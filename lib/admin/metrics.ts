import { draftRatelimit } from "@/lib/session/ratelimit";
import { readDailyWindow, istDay } from "@/lib/admin/counters";

const IST_OFFSET_MIN = 5 * 60 + 30;
const WINDOW_DAYS = 7;
const HOURS_IN_WINDOW = 24 * WINDOW_DAYS;
const HOURS_IN_TWO_WEEKS = HOURS_IN_WINDOW * 2;

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
  completions: number;
  rating_5: number;
  ratings_total: number;
  completion_rate: number | null; // null when attempts === 0
};

export type Totals = {
  attempts: number;
  unique_ips: number;
  completions: number;
  rating_5: number;
  ratings_total: number;
  completion_rate: number | null;
  five_star_share: number | null; // rating_5 / ratings_total
};

export type WoW = {
  attempts: number;
  unique_ips: number;
  attempts_delta_pct: number | null; // null when prior period was zero
};

export type Metrics = {
  fetched_at: number;
  window_days: number;
  today: DailyRow;
  by_day: DailyRow[]; // desc by day
  totals: Totals;
  prior: WoW | null; // prior 7 days for WoW comparison (attempts/DAU only — counters have no history)
};

export type HourlyBucket = {
  time: number;
  identifier?: Record<string, number>;
};

type AnalyticsAgg = {
  perDay: Map<string, { attempts: number; ips: Set<string> }>;
  totalAttempts: number;
  allIps: Set<string>;
};

// Pure aggregator over a set of hourly buckets, keyed by IST day.
export function aggregateAnalytics(buckets: HourlyBucket[]): AnalyticsAgg {
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
  return { perDay, totalAttempts, allIps };
}

// Pure combiner — merges analytics (attempts/IPs) with counter data
// (completions/ratings) into a Metrics view. Exported for unit tests.
export function buildMetrics(args: {
  now: number;
  currentWeek: AnalyticsAgg;
  priorWeek: AnalyticsAgg | null;
  completionsByDay: Map<string, number>;
  rating5ByDay: Map<string, number>;
  ratingsTotalByDay: Map<string, number>;
}): Omit<Metrics, "fetched_at"> {
  const today = toISTDay(args.now);
  const { perDay, totalAttempts, allIps } = args.currentWeek;

  const days = new Set<string>([
    ...perDay.keys(),
    ...args.completionsByDay.keys(),
    ...args.rating5ByDay.keys(),
    ...args.ratingsTotalByDay.keys(),
  ]);
  days.add(today);

  const byDay: DailyRow[] = [...days]
    .map((day) => {
      const row = perDay.get(day);
      const attempts = row?.attempts ?? 0;
      const unique_ips = row?.ips.size ?? 0;
      const completions = args.completionsByDay.get(day) ?? 0;
      const rating_5 = args.rating5ByDay.get(day) ?? 0;
      const ratings_total = args.ratingsTotalByDay.get(day) ?? 0;
      const completion_rate = attempts > 0 ? completions / attempts : null;
      return { day, attempts, unique_ips, completions, rating_5, ratings_total, completion_rate };
    })
    .sort((a, b) => (a.day < b.day ? 1 : -1))
    .slice(0, WINDOW_DAYS);

  const todayRow: DailyRow =
    byDay.find((r) => r.day === today) ?? {
      day: today,
      attempts: 0,
      unique_ips: 0,
      completions: 0,
      rating_5: 0,
      ratings_total: 0,
      completion_rate: null,
    };

  const totalCompletions = sumMap(args.completionsByDay);
  const totalRating5 = sumMap(args.rating5ByDay);
  const totalRatings = sumMap(args.ratingsTotalByDay);

  const totals: Totals = {
    attempts: totalAttempts,
    unique_ips: allIps.size,
    completions: totalCompletions,
    rating_5: totalRating5,
    ratings_total: totalRatings,
    completion_rate: totalAttempts > 0 ? totalCompletions / totalAttempts : null,
    five_star_share: totalRatings > 0 ? totalRating5 / totalRatings : null,
  };

  let prior: WoW | null = null;
  if (args.priorWeek) {
    const priorAttempts = args.priorWeek.totalAttempts;
    const priorIps = args.priorWeek.allIps.size;
    prior = {
      attempts: priorAttempts,
      unique_ips: priorIps,
      attempts_delta_pct:
        priorAttempts > 0 ? ((totalAttempts - priorAttempts) / priorAttempts) * 100 : null,
    };
  }

  return { window_days: WINDOW_DAYS, today: todayRow, by_day: byDay, totals, prior };
}

function sumMap(m: Map<string, number>): number {
  let sum = 0;
  for (const v of m.values()) sum += v;
  return sum;
}

export async function loadMetrics(): Promise<Metrics> {
  const now = Date.now();
  const rl = draftRatelimit();
  const analytics = (rl as unknown as {
    analytics?: { getUsageOverTime: (n: number, k: string) => Promise<HourlyBucket[]> };
  }).analytics;

  let currentWeek: AnalyticsAgg = { perDay: new Map(), totalAttempts: 0, allIps: new Set() };
  let priorWeek: AnalyticsAgg | null = null;
  if (analytics) {
    try {
      const buckets = await analytics.getUsageOverTime(HOURS_IN_TWO_WEEKS, "identifier");
      const cutoffMs = now - WINDOW_DAYS * 24 * 60 * 60 * 1000;
      const current: HourlyBucket[] = [];
      const prior: HourlyBucket[] = [];
      for (const b of buckets) (b.time >= cutoffMs ? current : prior).push(b);
      currentWeek = aggregateAnalytics(current);
      priorWeek = aggregateAnalytics(prior);
    } catch (err) {
      console.error("[metrics] analytics fetch failed", err);
    }
  }

  const [completions, rating5, ratingsTotal] = await Promise.all([
    readDailyWindow("draft_completed", WINDOW_DAYS, now),
    readDailyWindow("rating_5", WINDOW_DAYS, now),
    readDailyWindow("ratings_total", WINDOW_DAYS, now),
  ]);

  return {
    fetched_at: now,
    ...buildMetrics({
      now,
      currentWeek,
      priorWeek,
      completionsByDay: completions,
      rating5ByDay: rating5,
      ratingsTotalByDay: ratingsTotal,
    }),
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

// Re-export for consumers that used the old istDay location.
export { istDay };
