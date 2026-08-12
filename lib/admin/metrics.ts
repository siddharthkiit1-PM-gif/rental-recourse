import { redis } from "@/lib/session/redis";
import type { Session } from "@/lib/session/redis";

const IST_OFFSET_MIN = 5 * 60 + 30;

function toISTDay(msUtc: number): string {
  const d = new Date(msUtc + IST_OFFSET_MIN * 60_000);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function todayIST(): string {
  return toISTDay(Date.now());
}

export type DailyRow = {
  day: string; // YYYY-MM-DD (IST)
  drafts: number;
  sessions: number;
};

export type Metrics = {
  fetched_at: number;
  total_sessions: number;
  total_drafts: number;
  today: DailyRow;
  by_day: DailyRow[]; // sorted desc by day
};

export async function loadMetrics(): Promise<Metrics> {
  const r = redis();
  const keys: string[] = [];
  // Upstash Redis SCAN: cursor is a string; "0" means done. Safer than KEYS at
  // scale; small footprint today (~500 keys) but futureproof.
  let cursor: string | number = 0;
  while (true) {
    const res: [string | number, string[]] = await r.scan(cursor, {
      match: "recourse:session:*",
      count: 500,
    });
    keys.push(...res[1]);
    cursor = res[0];
    if (String(cursor) === "0") break;
  }

  const perDay = new Map<string, DailyRow>();
  let totalDrafts = 0;

  // Read in chunks of 100 via mget-friendly pipelining
  for (let i = 0; i < keys.length; i += 100) {
    const chunk = keys.slice(i, i + 100);
    const vals = (await r.mget(...chunk)) as Array<Session | string | null>;
    for (const v of vals) {
      if (!v) continue;
      const s = typeof v === "string" ? (JSON.parse(v) as Session) : v;
      const day = toISTDay(s.created_at ?? Date.now());
      const row = perDay.get(day) ?? { day, drafts: 0, sessions: 0 };
      row.sessions += 1;
      if (s.draft) {
        row.drafts += 1;
        totalDrafts += 1;
      }
      perDay.set(day, row);
    }
  }

  const today = todayIST();
  const byDay = [...perDay.values()].sort((a, b) => (a.day < b.day ? 1 : -1));
  const todayRow: DailyRow =
    perDay.get(today) ?? { day: today, drafts: 0, sessions: 0 };

  return {
    fetched_at: Date.now(),
    total_sessions: keys.length,
    total_drafts: totalDrafts,
    today: todayRow,
    by_day: byDay,
  };
}

export function launchTimestamp(): number {
  const iso = process.env.LAUNCH_TS ?? "2026-08-10T17:04:00Z";
  return Date.parse(iso);
}

export function formatHoursSince(fromMs: number, nowMs = Date.now()): string {
  const delta = Math.max(0, nowMs - fromMs);
  const h = Math.floor(delta / 3_600_000);
  const m = Math.floor((delta % 3_600_000) / 60_000);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}
