import { describe, it, expect } from "vitest";
import { aggregateByDay, type HourlyBucket } from "@/lib/admin/metrics";

// 2026-08-13 18:30:00 UTC = 2026-08-14 00:00 IST
const AUG_13_UTC_1830 = Date.parse("2026-08-13T18:30:00Z");
// 2026-08-14 00:00 UTC = 2026-08-14 05:30 IST
const AUG_14_UTC_0000 = Date.parse("2026-08-14T00:00:00Z");
// 2026-08-14 18:29:00 UTC = 2026-08-14 23:59 IST
const AUG_14_UTC_1829 = Date.parse("2026-08-14T18:29:00Z");
// 2026-08-14 18:31:00 UTC = 2026-08-15 00:01 IST (crosses IST midnight)
const AUG_14_UTC_1831 = Date.parse("2026-08-14T18:31:00Z");

describe("aggregateByDay", () => {
  it("empty buckets → empty rows, zero totals, empty today row for the given day", () => {
    const r = aggregateByDay([], "2026-08-14");
    expect(r.total_attempts).toBe(0);
    expect(r.total_unique_ips).toBe(0);
    expect(r.by_day).toEqual([]);
    expect(r.today).toEqual({ day: "2026-08-14", attempts: 0, unique_ips: 0 });
  });

  it("skips buckets with no identifier field", () => {
    const buckets: HourlyBucket[] = [{ time: AUG_14_UTC_0000 }];
    const r = aggregateByDay(buckets, "2026-08-14");
    expect(r.by_day).toEqual([]);
  });

  it("sums attempts and dedupes IPs within a day", () => {
    const buckets: HourlyBucket[] = [
      { time: AUG_14_UTC_0000, identifier: { "1.1.1.1": 3, "2.2.2.2": 1 } },
      { time: AUG_14_UTC_1829, identifier: { "1.1.1.1": 2, "3.3.3.3": 5 } },
    ];
    const r = aggregateByDay(buckets, "2026-08-14");
    expect(r.by_day).toEqual([
      { day: "2026-08-14", attempts: 11, unique_ips: 3 },
    ]);
    expect(r.today).toEqual({ day: "2026-08-14", attempts: 11, unique_ips: 3 });
    expect(r.total_attempts).toBe(11);
    expect(r.total_unique_ips).toBe(3);
  });

  it("splits buckets across IST day boundary at 18:30 UTC", () => {
    const buckets: HourlyBucket[] = [
      { time: AUG_13_UTC_1830, identifier: { "9.9.9.9": 1 } }, // 2026-08-14 IST
      { time: AUG_14_UTC_1829, identifier: { "9.9.9.9": 1 } }, // 2026-08-14 IST
      { time: AUG_14_UTC_1831, identifier: { "8.8.8.8": 1 } }, // 2026-08-15 IST
    ];
    const r = aggregateByDay(buckets, "2026-08-14");
    expect(r.by_day).toEqual([
      { day: "2026-08-15", attempts: 1, unique_ips: 1 },
      { day: "2026-08-14", attempts: 2, unique_ips: 1 },
    ]);
    expect(r.total_attempts).toBe(3);
    expect(r.total_unique_ips).toBe(2); // 9.9.9.9 + 8.8.8.8
  });

  it("sorts by_day descending by day string", () => {
    const buckets: HourlyBucket[] = [
      { time: Date.parse("2026-08-10T06:00:00Z"), identifier: { a: 1 } },
      { time: Date.parse("2026-08-12T06:00:00Z"), identifier: { b: 1 } },
      { time: Date.parse("2026-08-11T06:00:00Z"), identifier: { c: 1 } },
    ];
    const r = aggregateByDay(buckets, "2026-08-14");
    expect(r.by_day.map((d) => d.day)).toEqual([
      "2026-08-12",
      "2026-08-11",
      "2026-08-10",
    ]);
  });

  it("today row falls back to empty when today has no traffic", () => {
    const buckets: HourlyBucket[] = [
      { time: Date.parse("2026-08-11T06:00:00Z"), identifier: { a: 5 } },
    ];
    const r = aggregateByDay(buckets, "2026-08-14");
    expect(r.today).toEqual({ day: "2026-08-14", attempts: 0, unique_ips: 0 });
    expect(r.by_day.length).toBe(1);
  });
});
