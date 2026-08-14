import { draftRatelimit } from "@/lib/session/ratelimit";

const IST_OFFSET_MIN = 5 * 60 + 30;
const HOURS_IN_WINDOW = 24 * 7;

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
  day: string;
  attempts: number;
  unique_ips: number;
};

export type Metrics = {
  fetched_at: number;
  window_days: number;
  today: DailyRow;
  by_day: DailyRow[];
  total_attempts: number;
  total_unique_ips: number;
};

export type HourlyBucket = {
  time: number;
  identifier?: Record<string, number>;
};

// Pure aggregator — exported so it can be unit-tested without hitting Upstash.
export function aggregateByDay(
  buckets: HourlyBucket[],
  today: string,
): Omit<Metrics, "fetched_at" | "window_days"> {
  const perDay = new Map<string, { attempts: number; ips: Set<string> }>();
  const allIps = new Set<string>();
  let totalAttempts = 0;

  for (const b of buckets) {
    if (!b.identifier) continue;
    const day = toISTDay(b.time);
    const row = perDay.get(day) ?? { attempts: 0, ips: new Set<string>() };
    for (const [ip, n] of Object.entries(b.identifier)) {
      row.attempts += n;
      row.ips.add(ip);
      allIps.add(ip);
      totalAttempts += n;
    }
    perDay.set(day, row);
  }

  const byDay: DailyRow[] = [...perDay.entries()]
    .map(([day, v]) => ({ day, attempts: v.attempts, unique_ips: v.ips.size }))
    .sort((a, b) => (a.day < b.day ? 1 : -1));

  const todayRow: DailyRow =
    byDay.find((r) => r.day === today) ?? { day: today, attempts: 0, unique_ips: 0 };

  return {
    today: todayRow,
    by_day: byDay,
    total_attempts: totalAttempts,
    total_unique_ips: allIps.size,
  };
}

export async function loadMetrics(): Promise<Metrics> {
  const rl = draftRatelimit();
  const analytics = (rl as unknown as { analytics?: { getUsageOverTime: (n: number, k: string) => Promise<HourlyBucket[]> } }).analytics;
  if (!analytics) {
    return {
      fetched_at: Date.now(),
      window_days: 7,
      today: { day: todayIST(), attempts: 0, unique_ips: 0 },
      by_day: [],
      total_attempts: 0,
      total_unique_ips: 0,
    };
  }
  const buckets = await analytics.getUsageOverTime(HOURS_IN_WINDOW, "identifier");
  const agg = aggregateByDay(buckets, todayIST());
  return {
    fetched_at: Date.now(),
    window_days: 7,
    ...agg,
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
