import { redis } from "@/lib/session/redis";

const PREFIX = "recourse:counter";
const TTL_SECONDS = 90 * 24 * 60 * 60;
const IST_OFFSET_MIN = 5 * 60 + 30;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function istDay(msUtc: number = Date.now()): string {
  const d = new Date(msUtc + IST_OFFSET_MIN * 60_000);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Never throws — telemetry write failures must not surface to the request path.
export async function incrDailyQuiet(name: string, day: string = istDay()): Promise<void> {
  try {
    const r = redis();
    const key = `${PREFIX}:${name}:${day}`;
    const p = r.pipeline();
    p.incr(key);
    p.expire(key, TTL_SECONDS);
    await p.exec();
  } catch (err) {
    console.error(`[counter] incr ${name}:${day} failed`, err);
  }
}

// Read counter values for the last N IST days (today = index 0). Zero-fills
// missing days so the caller always gets a full window.
export async function readDailyWindow(
  name: string,
  days: number,
  now: number = Date.now(),
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  const keys: string[] = [];
  const orderedDays: string[] = [];
  for (let i = 0; i < days; i++) {
    const day = istDay(now - i * ONE_DAY_MS);
    orderedDays.push(day);
    keys.push(`${PREFIX}:${name}:${day}`);
    map.set(day, 0);
  }
  try {
    const r = redis();
    const vals = (await r.mget(...keys)) as Array<string | number | null>;
    for (let i = 0; i < orderedDays.length; i++) {
      const v = vals[i];
      if (v != null) map.set(orderedDays[i], Number(v));
    }
  } catch (err) {
    console.error(`[counter] read ${name} failed`, err);
  }
  return map;
}
