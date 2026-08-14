import { describe, it, expect, beforeEach } from "vitest";
import { mintMagicToken, verifyMagicToken, isAllowed, parseAllowlist } from "@/lib/admin/magic";

const SECRET = "test-secret-32-bytes-of-nothing-in-particular=";

describe("parseAllowlist", () => {
  it("splits on comma and trims whitespace, lowercases", () => {
    expect(parseAllowlist(" A@x.com , b@y.com ,c@z.com ")).toEqual([
      "a@x.com",
      "b@y.com",
      "c@z.com",
    ]);
  });
  it("returns empty array for empty/undefined", () => {
    expect(parseAllowlist(undefined)).toEqual([]);
    expect(parseAllowlist("")).toEqual([]);
  });
});

describe("isAllowed", () => {
  it("matches case-insensitively", () => {
    expect(isAllowed("Foo@Bar.com", ["foo@bar.com"])).toBe(true);
  });
  it("rejects non-members", () => {
    expect(isAllowed("x@y.com", ["foo@bar.com"])).toBe(false);
  });
});

describe("mint/verify round trip", () => {
  let mock: { store: Map<string, string> };
  let redisLike: {
    setex: (k: string, ttl: number, v: string) => Promise<"OK">;
    getdel: (k: string) => Promise<string | null>;
  };
  beforeEach(() => {
    mock = { store: new Map() };
    redisLike = {
      async setex(k, _ttl, v) { mock.store.set(k, v); return "OK"; },
      async getdel(k) { const v = mock.store.get(k) ?? null; mock.store.delete(k); return v; },
    };
  });

  it("mint + verify returns email", async () => {
    const token = await mintMagicToken("user@example.com", SECRET, redisLike);
    const res = await verifyMagicToken(token, SECRET, redisLike);
    expect(res).toEqual({ ok: true, email: "user@example.com" });
  });

  it("rejects tampered signature", async () => {
    const token = await mintMagicToken("user@example.com", SECRET, redisLike);
    const [p, s] = token.split(".");
    const tampered = `${p}.${s.slice(0, -2)}AA`;
    const res = await verifyMagicToken(tampered, SECRET, redisLike);
    expect(res).toEqual({ ok: false, reason: "bad_signature" });
  });

  it("rejects expired token", async () => {
    const token = await mintMagicToken("user@example.com", SECRET, redisLike, { expMs: -1 });
    const res = await verifyMagicToken(token, SECRET, redisLike);
    expect(res).toEqual({ ok: false, reason: "expired" });
  });

  it("rejects second use of the same token", async () => {
    const token = await mintMagicToken("user@example.com", SECRET, redisLike);
    await verifyMagicToken(token, SECRET, redisLike);
    const second = await verifyMagicToken(token, SECRET, redisLike);
    expect(second).toEqual({ ok: false, reason: "consumed" });
  });

  it("rejects malformed token", async () => {
    const res = await verifyMagicToken("garbage", SECRET, redisLike);
    expect(res.ok).toBe(false);
  });
});
