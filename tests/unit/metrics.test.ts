import { describe, it, expect } from "vitest";
import {
  aggregateAnalyticsPerDay,
  buildMetrics,
  type HourlyBucket,
} from "@/lib/admin/metrics";

const AUG_14_UTC_0000 = Date.parse("2026-08-14T00:00:00Z"); // 05:30 IST = Aug 14 IST
const AUG_13_UTC_1830 = Date.parse("2026-08-13T18:30:00Z"); // 00:00 IST Aug 14
const AUG_14_UTC_1831 = Date.parse("2026-08-14T18:31:00Z"); // 00:01 IST Aug 15

// Anchor "now" at 2026-08-19 12:00 UTC = 17:30 IST → today = "2026-08-19"
const NOW = Date.parse("2026-08-19T12:00:00Z");

const emptyDay = new Map<string, { attempts: number; ips: Set<string> }>();

describe("aggregateAnalyticsPerDay", () => {
  it("skips buckets with no identifier", () => {
    const r = aggregateAnalyticsPerDay([{ time: AUG_14_UTC_0000 }]);
    expect(r.size).toBe(0);
  });

  it("sums attempts and dedupes IPs across buckets in the same IST day", () => {
    const r = aggregateAnalyticsPerDay([
      { time: AUG_14_UTC_0000, identifier: { "1.1.1.1": 3, "2.2.2.2": 1 } },
      { time: Date.parse("2026-08-14T09:00:00Z"), identifier: { "1.1.1.1": 2, "3.3.3.3": 5 } },
    ]);
    const day = r.get("2026-08-14");
    expect(day?.attempts).toBe(11);
    expect(day?.ips.size).toBe(3);
  });

  it("splits at IST midnight (18:30 UTC)", () => {
    const r = aggregateAnalyticsPerDay([
      { time: AUG_13_UTC_1830, identifier: { "9.9.9.9": 1 } },
      { time: AUG_14_UTC_1831, identifier: { "8.8.8.8": 1 } },
    ]);
    expect(r.get("2026-08-14")?.attempts).toBe(1);
    expect(r.get("2026-08-15")?.attempts).toBe(1);
  });
});

describe("buildMetrics — window + weekly bucketing", () => {
  const call = (over: Partial<Parameters<typeof buildMetrics>[0]> = {}) =>
    buildMetrics({
      now: NOW,
      perDayAnalytics: emptyDay,
      completionsByDay: new Map(),
      rating5ByDay: new Map(),
      ratingsTotalByDay: new Map(),
      ...over,
    });

  it("produces 4 weekly buckets over a 28-day window", () => {
    const r = call();
    expect(r.window_days).toBe(28);
    expect(r.week_size).toBe(7);
    expect(r.week_count).toBe(4);
    expect(r.by_week.length).toBe(4);
  });

  it("week 0 is 'This week' and ends today (2026-08-19)", () => {
    const r = call();
    const current = r.by_week[0];
    expect(current.is_current).toBe(true);
    expect(current.label).toBe("This week");
    expect(current.week_end).toBe("2026-08-19");
    expect(current.week_start).toBe("2026-08-13");
  });

  it("week 3 (oldest) covers Jul 23 – 29", () => {
    const r = call();
    const oldest = r.by_week[3];
    expect(oldest.is_current).toBe(false);
    expect(oldest.week_start).toBe("2026-07-23");
    expect(oldest.week_end).toBe("2026-07-29");
    expect(oldest.label).toContain("Jul");
  });

  it("cross-month week label uses both months", () => {
    const r = call();
    // Aug 6 – 12 is within one month
    expect(r.by_week[1].label).toBe("Aug 6–12");
    // Jul 30 – Aug 5 crosses months
    expect(r.by_week[2].label).toBe("Jul 30 – Aug 5");
  });

  it("counters_live=true only for weeks ending on/after 2026-08-16", () => {
    const r = call();
    expect(r.by_week[0].counters_live).toBe(true);  // Aug 13–19, ends after
    expect(r.by_week[1].counters_live).toBe(false); // Aug 6–12, ends before
    expect(r.by_week[2].counters_live).toBe(false); // Jul 30–Aug 5
    expect(r.by_week[3].counters_live).toBe(false); // Jul 23–29
  });

  it("aggregates attempts + dedupes IPs across all 7 days of a week", () => {
    const perDay = new Map<string, { attempts: number; ips: Set<string> }>();
    perDay.set("2026-08-13", { attempts: 10, ips: new Set(["a", "b"]) });
    perDay.set("2026-08-15", { attempts: 5, ips: new Set(["b", "c"]) });
    perDay.set("2026-08-19", { attempts: 2, ips: new Set(["c", "d"]) });
    const r = call({ perDayAnalytics: perDay });
    const current = r.by_week[0];
    expect(current.attempts).toBe(17);
    expect(current.unique_ips).toBe(4); // {a, b, c, d}
  });

  it("bucket totals sum completions/ratings/5★ across the week", () => {
    const r = call({
      completionsByDay: new Map([
        ["2026-08-16", 3],
        ["2026-08-17", 5],
        ["2026-08-19", 2],
      ]),
      rating5ByDay: new Map([
        ["2026-08-16", 1],
        ["2026-08-17", 2],
      ]),
      ratingsTotalByDay: new Map([
        ["2026-08-16", 2],
        ["2026-08-17", 3],
      ]),
    });
    const current = r.by_week[0];
    expect(current.completions).toBe(10);
    expect(current.rating_5).toBe(3);
    expect(current.ratings_total).toBe(5);
  });

  it("totals aggregate across all 4 weeks; unique_ips is deduped across the whole window", () => {
    const perDay = new Map<string, { attempts: number; ips: Set<string> }>();
    // Same IP in two different weeks → counted once in window totals
    perDay.set("2026-08-15", { attempts: 3, ips: new Set(["shared"]) });
    perDay.set("2026-08-05", { attempts: 4, ips: new Set(["shared", "other"]) });
    const r = call({ perDayAnalytics: perDay });
    expect(r.totals.attempts).toBe(7);
    expect(r.totals.unique_ips).toBe(2); // {shared, other}
  });

  it("today row reflects today's analytics + counters, with completion_rate", () => {
    const r = call({
      perDayAnalytics: new Map([
        ["2026-08-19", { attempts: 8, ips: new Set(["x", "y"]) }],
      ]),
      completionsByDay: new Map([["2026-08-19", 4]]),
    });
    expect(r.today).toEqual({
      day: "2026-08-19",
      attempts: 8,
      unique_ips: 2,
      completions: 4,
      rating_5: 0,
      ratings_total: 0,
      completion_rate: 0.5,
    });
  });

  it("wow compares this week (by_week[0]) vs last week (by_week[1])", () => {
    const perDay = new Map<string, { attempts: number; ips: Set<string> }>();
    perDay.set("2026-08-19", { attempts: 100, ips: new Set(["a"]) }); // this week
    perDay.set("2026-08-11", { attempts: 50, ips: new Set(["b"]) });  // last week
    const r = call({ perDayAnalytics: perDay });
    expect(r.wow?.attempts_this).toBe(100);
    expect(r.wow?.attempts_last).toBe(50);
    expect(r.wow?.attempts_delta_pct).toBeCloseTo(100, 5);
  });

  it("wow delta is null when last week had zero attempts (avoid divide-by-zero)", () => {
    const perDay = new Map<string, { attempts: number; ips: Set<string> }>();
    perDay.set("2026-08-19", { attempts: 10, ips: new Set(["a"]) });
    const r = call({ perDayAnalytics: perDay });
    expect(r.wow?.attempts_last).toBe(0);
    expect(r.wow?.attempts_delta_pct).toBeNull();
  });
});
