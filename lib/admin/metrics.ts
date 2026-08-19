import { draftRatelimit } from "@/lib/session/ratelimit";
import { readDailyWindow, istDay } from "@/lib/admin/counters";

const IST_OFFSET_MIN = 5 * 60 + 30;
const ONE_DAY_MS = 86_400_000;

// Monthly view = 4 weeks × 7 days = 28 rolling days.
const WEEK_SIZE = 7;
const WEEK_COUNT = 4;
const WINDOW_DAYS = WEEK_SIZE * WEEK_COUNT; // 28
const HOURS_IN_WINDOW = 24 * WINDOW_DAYS;

// The first IST day durable counters (completions / ratings / 5★) were live.
// Weeks whose latest day is before this show "—" in the UI for those columns
// to distinguish "unknown" from "genuinely zero".
export const COUNTERS_START_DAY = "2026-08-16";

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
  completion_rate: number | null;
};

export type WeeklyRow = {
  week_start: string; // YYYY-MM-DD IST, inclusive (oldest day of the week)
  week_end: string;   // YYYY-MM-DD IST, inclusive (most recent day of the week)
  label: string;      // "This week" for the current bucket, else "Aug 6–12"
  is_current: boolean;
  attempts: number;
  unique_ips: number; // deduped across all 7 days in this week
  completions: number;
  rating_5: number;
  ratings_total: number;
  completion_rate: number | null;
  counters_live: boolean; // false when week_end < COUNTERS_START_DAY → show "—" for counter cols
};

export type Totals = {
  attempts: number;
  unique_ips: number; // deduped across all 28 days
  completions: number;
  rating_5: number;
  ratings_total: number;
  completion_rate: number | null;
  five_star_share: number | null;
};

// Week-over-week comparison: this week (by_week[0]) vs last week (by_week[1]).
// Both windows have real data since Aug 11 spike, so this is the actionable delta.
export type WeekOverWeek = {
  attempts_this: number;
  attempts_last: number;
  attempts_delta_pct: number | null;
  unique_ips_this: number;
  unique_ips_last: number;
};

export type Metrics = {
  fetched_at: number;
  window_days: number;   // 28
  week_size: number;     // 7
  week_count: number;    // 4
  counters_start_day: string;
  today: DailyRow;
  by_week: WeeklyRow[];  // most recent first (index 0 = "This week")
  totals: Totals;        // 28-day window totals
  wow: WeekOverWeek | null;
};

export type HourlyBucket = {
  time: number;
  identifier?: Record<string, number>;
};

// Pure aggregator — hourly analytics buckets → per-IST-day totals.
export function aggregateAnalyticsPerDay(
  buckets: HourlyBucket[],
): Map<string, { attempts: number; ips: Set<string> }> {
  const perDay = new Map<string, { attempts: number; ips: Set<string> }>();
  for (const b of buckets) {
    if (!b.identifier) continue;
    const day = toISTDay(b.time);
    const row = perDay.get(day) ?? { attempts: 0, ips: new Set<string>() };
    for (const [ip, n] of Object.entries(b.identifier)) {
      row.attempts += n;
      row.ips.add(ip);
    }
    perDay.set(day, row);
  }
  return perDay;
}

// Builds an ordered list of week buckets: index 0 = current (today anchors the
// most recent 7-day window), index N-1 = oldest.
function buildWeekBuckets(now: number): Array<{
  start: string;
  end: string;
  days: string[];
}> {
  const weeks = [];
  for (let w = 0; w < WEEK_COUNT; w++) {
    const days: string[] = [];
    for (let d = 0; d < WEEK_SIZE; d++) {
      const offset = w * WEEK_SIZE + d;
      days.push(toISTDay(now - offset * ONE_DAY_MS));
    }
    days.reverse();
    weeks.push({ start: days[0], end: days[days.length - 1], days });
  }
  return weeks;
}

// Format a compact human label for a week bucket. Handles same-month and
// cross-month cases; the current week is always labeled "This week".
function labelWeek(start: string, end: string, isCurrent: boolean): string {
  if (isCurrent) return "This week";
  const startD = new Date(start + "T00:00:00Z");
  const endD = new Date(end + "T00:00:00Z");
  const startMonth = startD.toLocaleString("en-US", { month: "short" });
  const endMonth = endD.toLocaleString("en-US", { month: "short" });
  const startDay = startD.getUTCDate();
  const endDay = endD.getUTCDate();
  if (startMonth === endMonth) return `${startMonth} ${startDay}–${endDay}`;
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}`;
}

// Aggregate a week's days into a single row.
function aggregateWeek(
  days: string[],
  perDayAnalytics: Map<string, { attempts: number; ips: Set<string> }>,
  completionsByDay: Map<string, number>,
  rating5ByDay: Map<string, number>,
  ratingsTotalByDay: Map<string, number>,
): {
  attempts: number;
  unique_ips: number;
  completions: number;
  rating_5: number;
  ratings_total: number;
} {
  let attempts = 0;
  let completions = 0;
  let rating_5 = 0;
  let ratings_total = 0;
  const weekIps = new Set<string>();
  for (const day of days) {
    const d = perDayAnalytics.get(day);
    if (d) {
      attempts += d.attempts;
      for (const ip of d.ips) weekIps.add(ip);
    }
    completions += completionsByDay.get(day) ?? 0;
    rating_5 += rating5ByDay.get(day) ?? 0;
    ratings_total += ratingsTotalByDay.get(day) ?? 0;
  }
  return { attempts, unique_ips: weekIps.size, completions, rating_5, ratings_total };
}

// Pure combiner — merges analytics (attempts/IPs) with counter data
// (completions/ratings) into a Metrics view. Exported for unit tests.
export function buildMetrics(args: {
  now: number;
  perDayAnalytics: Map<string, { attempts: number; ips: Set<string> }>;
  completionsByDay: Map<string, number>;
  rating5ByDay: Map<string, number>;
  ratingsTotalByDay: Map<string, number>;
}): Omit<Metrics, "fetched_at"> {
  const today = toISTDay(args.now);
  const weeks = buildWeekBuckets(args.now);
  const start = COUNTERS_START_DAY;

  const byWeek: WeeklyRow[] = weeks.map((w, index) => {
    const agg = aggregateWeek(
      w.days,
      args.perDayAnalytics,
      args.completionsByDay,
      args.rating5ByDay,
      args.ratingsTotalByDay,
    );
    return {
      week_start: w.start,
      week_end: w.end,
      label: labelWeek(w.start, w.end, index === 0),
      is_current: index === 0,
      attempts: agg.attempts,
      unique_ips: agg.unique_ips,
      completions: agg.completions,
      rating_5: agg.rating_5,
      ratings_total: agg.ratings_total,
      completion_rate: agg.attempts > 0 ? agg.completions / agg.attempts : null,
      counters_live: w.end >= start,
    };
  });

  // Today row — same-day granularity for the "Today" card.
  const todayAnalytics = args.perDayAnalytics.get(today);
  const todayAttempts = todayAnalytics?.attempts ?? 0;
  const todayCompletions = args.completionsByDay.get(today) ?? 0;
  const todayRow: DailyRow = {
    day: today,
    attempts: todayAttempts,
    unique_ips: todayAnalytics?.ips.size ?? 0,
    completions: todayCompletions,
    rating_5: args.rating5ByDay.get(today) ?? 0,
    ratings_total: args.ratingsTotalByDay.get(today) ?? 0,
    completion_rate: todayAttempts > 0 ? todayCompletions / todayAttempts : null,
  };

  // 28-day totals from summing weekly aggregates.
  const totals: Totals = {
    attempts: byWeek.reduce((s, w) => s + w.attempts, 0),
    unique_ips: 0, // computed below via full-window IP union
    completions: byWeek.reduce((s, w) => s + w.completions, 0),
    rating_5: byWeek.reduce((s, w) => s + w.rating_5, 0),
    ratings_total: byWeek.reduce((s, w) => s + w.ratings_total, 0),
    completion_rate: null,
    five_star_share: null,
  };

  // Window-wide unique IPs: union across all days in the 28-day window.
  const allIps = new Set<string>();
  for (const w of weeks) {
    for (const day of w.days) {
      const d = args.perDayAnalytics.get(day);
      if (d) for (const ip of d.ips) allIps.add(ip);
    }
  }
  totals.unique_ips = allIps.size;
  totals.completion_rate =
    totals.attempts > 0 ? totals.completions / totals.attempts : null;
  totals.five_star_share =
    totals.ratings_total > 0 ? totals.rating_5 / totals.ratings_total : null;

  // WoW = this week vs immediately preceding week (only interesting comparison
  // right now — MoM has no prior data). null-safe when there are fewer than 2 weeks.
  let wow: WeekOverWeek | null = null;
  if (byWeek.length >= 2) {
    const thisWeek = byWeek[0];
    const lastWeek = byWeek[1];
    wow = {
      attempts_this: thisWeek.attempts,
      attempts_last: lastWeek.attempts,
      attempts_delta_pct:
        lastWeek.attempts > 0
          ? ((thisWeek.attempts - lastWeek.attempts) / lastWeek.attempts) * 100
          : null,
      unique_ips_this: thisWeek.unique_ips,
      unique_ips_last: lastWeek.unique_ips,
    };
  }

  return {
    window_days: WINDOW_DAYS,
    week_size: WEEK_SIZE,
    week_count: WEEK_COUNT,
    counters_start_day: COUNTERS_START_DAY,
    today: todayRow,
    by_week: byWeek,
    totals,
    wow,
  };
}

export async function loadMetrics(): Promise<Metrics> {
  const now = Date.now();
  const rl = draftRatelimit();
  const analytics = (rl as unknown as {
    analytics?: { getUsageOverTime: (n: number, k: string) => Promise<HourlyBucket[]> };
  }).analytics;

  let perDayAnalytics = new Map<string, { attempts: number; ips: Set<string> }>();
  if (analytics) {
    try {
      const buckets = await analytics.getUsageOverTime(HOURS_IN_WINDOW, "identifier");
      perDayAnalytics = aggregateAnalyticsPerDay(buckets);
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
      perDayAnalytics,
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

export { istDay };
