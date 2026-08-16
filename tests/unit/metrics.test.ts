import { describe, it, expect } from "vitest";
import {
  aggregateAnalytics,
  buildMetrics,
  type HourlyBucket,
} from "@/lib/admin/metrics";

const AUG_13_UTC_1830 = Date.parse("2026-08-13T18:30:00Z");
const AUG_14_UTC_0000 = Date.parse("2026-08-14T00:00:00Z");
const AUG_14_UTC_1829 = Date.parse("2026-08-14T18:29:00Z");
const AUG_14_UTC_1831 = Date.parse("2026-08-14T18:31:00Z");

const AUG_16_NOON_UTC = Date.parse("2026-08-16T12:00:00Z");
const emptyAgg = { perDay: new Map(), totalAttempts: 0, allIps: new Set<string>() };

describe("aggregateAnalytics", () => {
  it("skips buckets with no identifier", () => {
    const r = aggregateAnalytics([{ time: AUG_14_UTC_0000 }]);
    expect(r.totalAttempts).toBe(0);
    expect(r.allIps.size).toBe(0);
    expect(r.perDay.size).toBe(0);
  });

  it("sums attempts and dedupes IPs across buckets in the same IST day", () => {
    const buckets: HourlyBucket[] = [
      { time: AUG_14_UTC_0000, identifier: { "1.1.1.1": 3, "2.2.2.2": 1 } },
      { time: AUG_14_UTC_1829, identifier: { "1.1.1.1": 2, "3.3.3.3": 5 } },
    ];
    const r = aggregateAnalytics(buckets);
    expect(r.totalAttempts).toBe(11);
    expect(r.allIps.size).toBe(3);
    const day = r.perDay.get("2026-08-14");
    expect(day?.attempts).toBe(11);
    expect(day?.ips.size).toBe(3);
  });

  it("splits at IST midnight (18:30 UTC)", () => {
    const buckets: HourlyBucket[] = [
      { time: AUG_13_UTC_1830, identifier: { "9.9.9.9": 1 } }, // 2026-08-14 IST
      { time: AUG_14_UTC_1829, identifier: { "9.9.9.9": 1 } }, // 2026-08-14 IST
      { time: AUG_14_UTC_1831, identifier: { "8.8.8.8": 1 } }, // 2026-08-15 IST
    ];
    const r = aggregateAnalytics(buckets);
    expect(r.perDay.get("2026-08-14")?.attempts).toBe(2);
    expect(r.perDay.get("2026-08-15")?.attempts).toBe(1);
    expect(r.allIps.size).toBe(2);
  });
});

describe("buildMetrics", () => {
  const call = (over: Partial<Parameters<typeof buildMetrics>[0]> = {}) =>
    buildMetrics({
      now: AUG_16_NOON_UTC,
      currentWeek: emptyAgg,
      priorWeek: null,
      completionsByDay: new Map(),
      rating5ByDay: new Map(),
      ratingsTotalByDay: new Map(),
      ...over,
    });

  it("empty everything → today row zeroed, by_day contains only today", () => {
    const r = call();
    expect(r.window_days).toBe(7);
    expect(r.today).toEqual({
      day: "2026-08-16",
      attempts: 0,
      unique_ips: 0,
      completions: 0,
      rating_5: 0,
      ratings_total: 0,
      completion_rate: null,
    });
    expect(r.by_day.map((d) => d.day)).toEqual(["2026-08-16"]);
    expect(r.totals.completion_rate).toBeNull();
    expect(r.totals.five_star_share).toBeNull();
    expect(r.prior).toBeNull();
  });

  it("merges analytics with counter data into a joined day row", () => {
    const buckets: HourlyBucket[] = [
      { time: AUG_14_UTC_0000, identifier: { "1.1.1.1": 10 } },
    ];
    const currentWeek = aggregateAnalytics(buckets);
    const r = call({
      currentWeek,
      completionsByDay: new Map([["2026-08-14", 7]]),
      rating5ByDay: new Map([["2026-08-14", 3]]),
      ratingsTotalByDay: new Map([["2026-08-14", 4]]),
    });
    const row = r.by_day.find((d) => d.day === "2026-08-14")!;
    expect(row).toMatchObject({
      attempts: 10,
      unique_ips: 1,
      completions: 7,
      rating_5: 3,
      ratings_total: 4,
    });
    expect(row.completion_rate).toBeCloseTo(0.7, 5);
    expect(r.totals.completion_rate).toBeCloseTo(0.7, 5);
    expect(r.totals.five_star_share).toBeCloseTo(0.75, 5);
  });

  it("completion_rate is null when attempts is zero even if completions somehow non-zero", () => {
    // Defensive: shouldn't happen in practice but should not divide by zero.
    const r = call({
      completionsByDay: new Map([["2026-08-14", 5]]),
    });
    const row = r.by_day.find((d) => d.day === "2026-08-14")!;
    expect(row.completion_rate).toBeNull();
  });

  it("caps by_day to 7 rows, sorted desc", () => {
    const completionsByDay = new Map<string, number>();
    for (let i = 0; i < 10; i++) {
      const day = new Date(AUG_16_NOON_UTC - i * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      completionsByDay.set(day, i + 1);
    }
    const r = call({ completionsByDay });
    expect(r.by_day.length).toBe(7);
    for (let i = 1; i < r.by_day.length; i++) {
      expect(r.by_day[i - 1].day > r.by_day[i].day).toBe(true);
    }
  });

  it("computes WoW attempts delta from prior period", () => {
    const current = aggregateAnalytics([
      { time: AUG_14_UTC_0000, identifier: { "1.1.1.1": 200 } },
    ]);
    const prior = aggregateAnalytics([
      { time: Date.parse("2026-08-05T06:00:00Z"), identifier: { "2.2.2.2": 100 } },
    ]);
    const r = call({ currentWeek: current, priorWeek: prior });
    expect(r.prior?.attempts).toBe(100);
    expect(r.prior?.unique_ips).toBe(1);
    expect(r.prior?.attempts_delta_pct).toBeCloseTo(100, 5); // 200 vs 100 = +100%
  });

  it("WoW delta is null when prior period had zero attempts", () => {
    const current = aggregateAnalytics([
      { time: AUG_14_UTC_0000, identifier: { "1.1.1.1": 10 } },
    ]);
    const r = call({ currentWeek: current, priorWeek: emptyAgg });
    expect(r.prior?.attempts).toBe(0);
    expect(r.prior?.attempts_delta_pct).toBeNull();
  });
});
