# Admin Magic-Link Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/admin` shared-password login with a Resend-delivered magic link + email allowlist, keeping the existing HMAC session cookie and middleware untouched.

**Architecture:** New `/api/admin/magic/request` sends a signed one-time token (HMAC + Redis nonce, 15-min TTL) to the submitter's email. `/api/admin/magic/verify` validates and mints the same `recourse_admin` cookie the middleware already understands. Password endpoint is deleted.

**Tech Stack:** Next.js 16 App Router, Web Crypto for HMAC, `@upstash/redis` for the nonce, `@upstash/ratelimit` for per-IP throttling, `resend` for delivery, Vitest for unit tests.

**Spec:** `docs/superpowers/specs/2026-08-14-admin-magic-link-login-design.md`

---

## File Structure

Small feature — the token layer is a single module with a clear boundary; routes are thin adapters over it.

**New**
- `lib/admin/magic.ts` — token mint/verify, allowlist parse, Resend send. Pure functions except for `sendMagicLink` (which calls Resend and Redis).
- `lib/admin/ratelimit.ts` — two `Ratelimit` instances (request + verify), factory pattern matching `lib/session/ratelimit.ts`.
- `app/api/admin/magic/request/route.ts` — POST adapter.
- `app/api/admin/magic/verify/route.ts` — GET adapter.
- `tests/unit/magic.test.ts` — Vitest specs for the token core.

**Modified**
- `app/admin/login/LoginForm.tsx` — email input, sent + error states.
- `app/admin/login/page.tsx` — read `?sent=1` and `?error=…` from URL.

**Deleted**
- `app/api/admin/login/route.ts` — password path retired.

**Unchanged**
- `middleware.ts`, `lib/admin/auth.ts`, `app/admin/page.tsx`, `app/admin/Dashboard.tsx`, `app/api/admin/logout/route.ts`.

---

## Task 1: Add Resend dep and local env vars

**Files:**
- Modify: `package.json` (via `npm install`)
- Modify: `.env.local`

- [ ] **Step 1: Install Resend SDK**

Run: `npm install resend`
Expected: `resend@…` added to `dependencies`; lockfile updated. No peer-dep warnings.

- [ ] **Step 2: Append the three new env vars to `.env.local`, remove `ADMIN_PASSWORD`**

Open `.env.local` and:
- Remove the `ADMIN_PASSWORD=…` line.
- Append:

```
RESEND_API_KEY=re_REDACTED_SEE_ENV_LOCAL
ADMIN_EMAIL_ALLOWLIST=agrawalsiddharth18@gmail.com
MAGIC_TOKEN_SECRET=5HcuAyHnuYQZtNk5OwlyS5Mnbz8P5Ij4UXIaRfr+xIY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Note: `NEXT_PUBLIC_APP_URL` is `http://localhost:3000` for dev only; the Vercel prod value gets set separately in Task 7.

- [ ] **Step 3: Confirm the vars load**

Run: `node -e "require('dotenv').config({path:'.env.local'});console.log('key:',!!process.env.RESEND_API_KEY,'allow:',process.env.ADMIN_EMAIL_ALLOWLIST,'secret_len:',(process.env.MAGIC_TOKEN_SECRET||'').length,'url:',process.env.NEXT_PUBLIC_APP_URL,'pwd_removed:',!process.env.ADMIN_PASSWORD)"`
Expected: `key: true allow: agrawalsiddharth18@gmail.com secret_len: 44 url: http://localhost:3000 pwd_removed: true`

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add resend for admin magic-link email"
```

`.env.local` is gitignored — no env commit needed.

---

## Task 2: Token core (TDD)

**Files:**
- Create: `lib/admin/magic.ts`
- Create: `tests/unit/magic.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/magic.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests, expect all fail (module missing)**

Run: `npm test -- tests/unit/magic.test.ts`
Expected: FAIL — `Cannot find module '@/lib/admin/magic'`.

- [ ] **Step 3: Implement `lib/admin/magic.ts`**

Create `lib/admin/magic.ts`:

```ts
import { Resend } from "resend";

const MAGIC_TTL_MS = 15 * 60 * 1000;
const REDIS_PREFIX = "recourse:magic:";

type Payload = { email: string; jti: string; exp: number };

export type MagicRedis = {
  setex: (key: string, ttlSeconds: number, value: string) => Promise<unknown>;
  getdel: (key: string) => Promise<string | null>;
};

export type VerifyResult =
  | { ok: true; email: string }
  | { ok: false; reason: "bad_format" | "bad_signature" | "expired" | "consumed" };

function b64urlBytes(bytes: Uint8Array): string {
  let s = "";
  for (const byte of bytes) s += String.fromCharCode(byte);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlEncode(str: string): string {
  return b64urlBytes(new TextEncoder().encode(str));
}

function b64urlDecode(str: string): Uint8Array {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return b64urlBytes(new Uint8Array(sig));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function parseAllowlist(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowed(email: string, allowlist: string[]): boolean {
  return allowlist.includes(email.trim().toLowerCase());
}

export async function mintMagicToken(
  email: string,
  secret: string,
  redis: MagicRedis,
  opts: { expMs?: number } = {},
): Promise<string> {
  // Random 16-byte jti gives 128 bits of unpredictability on top of the HMAC.
  const jtiBytes = new Uint8Array(16);
  crypto.getRandomValues(jtiBytes);
  const jti = b64urlBytes(jtiBytes);
  const expDeltaMs = opts.expMs ?? MAGIC_TTL_MS;
  const payload: Payload = {
    email: email.trim().toLowerCase(),
    jti,
    exp: Date.now() + expDeltaMs,
  };
  const payloadPart = b64urlEncode(JSON.stringify(payload));
  const sigPart = await hmac(secret, payloadPart);
  // TTL floor of 1s so Upstash accepts even an already-expired token in tests.
  const ttl = Math.max(1, Math.ceil(expDeltaMs / 1000));
  await redis.setex(`${REDIS_PREFIX}${jti}`, ttl, "1");
  return `${payloadPart}.${sigPart}`;
}

export async function verifyMagicToken(
  token: string,
  secret: string,
  redis: MagicRedis,
): Promise<VerifyResult> {
  if (!token || !token.includes(".")) return { ok: false, reason: "bad_format" };
  const [payloadPart, sigPart] = token.split(".");
  const expected = await hmac(secret, payloadPart);
  if (!timingSafeEqual(sigPart, expected)) return { ok: false, reason: "bad_signature" };
  let payload: Payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadPart)));
  } catch {
    return { ok: false, reason: "bad_format" };
  }
  if (typeof payload.exp !== "number" || Date.now() >= payload.exp) {
    return { ok: false, reason: "expired" };
  }
  const consumed = await redis.getdel(`${REDIS_PREFIX}${payload.jti}`);
  if (!consumed) return { ok: false, reason: "consumed" };
  return { ok: true, email: payload.email };
}

export async function sendMagicLink(args: {
  to: string;
  link: string;
  resendApiKey: string;
}): Promise<void> {
  const resend = new Resend(args.resendApiKey);
  const { error } = await resend.emails.send({
    from: "Recourse <onboarding@resend.dev>",
    to: [args.to],
    subject: "Your admin sign-in link",
    text:
      `Sign in to Recourse Ops:\n\n${args.link}\n\n` +
      `This link expires in 15 minutes and can only be used once. ` +
      `If you didn't request this, ignore this email.`,
    html:
      `<p>Sign in to Recourse Ops:</p>` +
      `<p><a href="${args.link}">${args.link}</a></p>` +
      `<p style="color:#666;font-size:12px">Expires in 15 minutes, single use. ` +
      `If you didn't request this, ignore this email.</p>`,
  });
  if (error) throw new Error(`Resend failed: ${error.message}`);
}
```

- [ ] **Step 4: Run the tests, expect all pass**

Run: `npm test -- tests/unit/magic.test.ts`
Expected: `parseAllowlist × 2 · isAllowed × 2 · mint/verify round trip × 5` — all green.

- [ ] **Step 5: Commit**

```bash
git add lib/admin/magic.ts tests/unit/magic.test.ts
git commit -m "feat(admin): magic-link token mint/verify + Resend send helper"
```

---

## Task 3: Per-endpoint rate limiters

**Files:**
- Create: `lib/admin/ratelimit.ts`

- [ ] **Step 1: Create the module**

Create `lib/admin/ratelimit.ts`:

```ts
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/session/redis";

let _req: Ratelimit | null = null;
let _verify: Ratelimit | null = null;

export function magicRequestLimit(): Ratelimit {
  if (_req) return _req;
  _req = new Ratelimit({
    redis: redis(),
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    analytics: true,
    prefix: "recourse:rl:magic-req",
  });
  return _req;
}

export function magicVerifyLimit(): Ratelimit {
  if (_verify) return _verify;
  _verify = new Ratelimit({
    redis: redis(),
    limiter: Ratelimit.slidingWindow(20, "1 m"),
    analytics: true,
    prefix: "recourse:rl:magic-verify",
  });
  return _verify;
}
```

- [ ] **Step 2: Type-check compiles**

Run: `npx tsc --noEmit`
Expected: exits 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/admin/ratelimit.ts
git commit -m "feat(admin): per-IP rate limiters for magic-link endpoints"
```

---

## Task 4: `POST /api/admin/magic/request` route

**Files:**
- Create: `app/api/admin/magic/request/route.ts`

- [ ] **Step 1: Implement the route**

Create `app/api/admin/magic/request/route.ts`:

```ts
import {
  isAllowed,
  mintMagicToken,
  parseAllowlist,
  sendMagicLink,
} from "@/lib/admin/magic";
import { magicRequestLimit } from "@/lib/admin/ratelimit";
import { redis } from "@/lib/session/redis";

export const runtime = "nodejs";

function clientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  return xf?.split(",")[0]?.trim() || "unknown";
}

function isValidEmail(v: unknown): v is string {
  return typeof v === "string" && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) && v.length <= 254;
}

export async function POST(req: Request) {
  const secret = process.env.MAGIC_TOKEN_SECRET;
  const resendKey = process.env.RESEND_API_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const allowlist = parseAllowlist(process.env.ADMIN_EMAIL_ALLOWLIST);
  if (!secret || !resendKey || !appUrl || allowlist.length === 0) {
    return Response.json({ error: "admin not configured" }, { status: 500 });
  }

  const rl = await magicRequestLimit().limit(clientIp(req));
  if (!rl.success) {
    return Response.json({ error: "too many requests" }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as { email?: unknown } | null;
  const email = body?.email;
  if (!isValidEmail(email)) {
    return Response.json({ error: "invalid email" }, { status: 400 });
  }

  // Always respond 200 to prevent allowlist enumeration. Only send if allowed.
  if (isAllowed(email, allowlist)) {
    try {
      const r = redis();
      const token = await mintMagicToken(email, secret, {
        setex: (k, ttl, v) => r.setex(k, ttl, v),
        getdel: (k) => r.getdel(k),
      });
      const link = `${appUrl}/api/admin/magic/verify?token=${encodeURIComponent(token)}`;
      await sendMagicLink({ to: email, link, resendApiKey: resendKey });
    } catch (err) {
      console.error("[magic/request] send failed", err);
      // fall through — do not leak to caller
    }
  }

  return Response.json({ ok: true });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/magic/request/route.ts
git commit -m "feat(admin): POST /api/admin/magic/request sends signed link"
```

---

## Task 5: `GET /api/admin/magic/verify` route

**Files:**
- Create: `app/api/admin/magic/verify/route.ts`

- [ ] **Step 1: Implement the route**

Create `app/api/admin/magic/verify/route.ts`:

```ts
import { ADMIN_COOKIE, cookieAttrs, mintCookie } from "@/lib/admin/auth";
import {
  isAllowed,
  parseAllowlist,
  verifyMagicToken,
} from "@/lib/admin/magic";
import { magicVerifyLimit } from "@/lib/admin/ratelimit";
import { redis } from "@/lib/session/redis";

export const runtime = "nodejs";

function clientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  return xf?.split(",")[0]?.trim() || "unknown";
}

function redirectTo(base: string, path: string, query: Record<string, string> = {}) {
  const url = new URL(path, base);
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  return Response.redirect(url.toString(), 302);
}

export async function GET(req: Request) {
  const magicSecret = process.env.MAGIC_TOKEN_SECRET;
  const cookieSecret = process.env.ADMIN_COOKIE_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const allowlist = parseAllowlist(process.env.ADMIN_EMAIL_ALLOWLIST);
  if (!magicSecret || !cookieSecret || !appUrl || allowlist.length === 0) {
    return new Response("admin not configured", { status: 500 });
  }

  const rl = await magicVerifyLimit().limit(clientIp(req));
  if (!rl.success) {
    return redirectTo(appUrl, "/admin/login", { error: "rate_limited" });
  }

  const token = new URL(req.url).searchParams.get("token") ?? "";
  const r = redis();
  const result = await verifyMagicToken(token, magicSecret, {
    setex: (k, ttl, v) => r.setex(k, ttl, v),
    getdel: (k) => r.getdel(k),
  });

  if (!result.ok || !isAllowed(result.email, allowlist)) {
    return redirectTo(appUrl, "/admin/login", { error: "link_invalid" });
  }

  const sessionCookie = await mintCookie(cookieSecret);
  const target = new URL("/admin", appUrl).toString();
  return new Response(null, {
    status: 302,
    headers: {
      location: target,
      "set-cookie": `${ADMIN_COOKIE}=${sessionCookie}; ${cookieAttrs()}`,
    },
  });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/magic/verify/route.ts
git commit -m "feat(admin): GET /api/admin/magic/verify mints session cookie"
```

---

## Task 6: Rewrite login UI

**Files:**
- Modify: `app/admin/login/LoginForm.tsx` (full rewrite)
- Modify: `app/admin/login/page.tsx` (no functional change — still `Suspense` wraps client)

- [ ] **Step 1: Replace `LoginForm.tsx`**

Overwrite `app/admin/login/LoginForm.tsx`:

```tsx
"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

const styles = {
  page: {
    minHeight: "100dvh",
    background: "#1a1712",
    color: "#f2ebd8",
    fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
    display: "grid",
    placeItems: "center",
    padding: "2rem",
  } as const,
  card: {
    width: "100%",
    maxWidth: 380,
    padding: "2.5rem 2rem",
    border: "1px solid #33302a",
    background: "#221e18",
  } as const,
  eyebrowRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 32 } as const,
  dot: { width: 10, height: 10, background: "#e39a2b", display: "inline-block" } as const,
  eyebrow: {
    letterSpacing: "0.14em",
    fontSize: 11,
    color: "#8b8371",
    textTransform: "uppercase",
  } as const,
  heading: {
    fontFamily: "'Instrument Serif', ui-serif, Georgia, serif",
    fontSize: 32,
    fontWeight: 400,
    letterSpacing: "-0.01em",
    margin: 0,
    marginBottom: 28,
  } as const,
  label: {
    display: "block",
    fontSize: 11,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "#8b8371",
    marginBottom: 8,
  } as const,
  input: {
    width: "100%",
    padding: "10px 12px",
    background: "#1a1712",
    border: "1px solid #33302a",
    color: "#f2ebd8",
    fontFamily: "inherit",
    fontSize: 14,
    outline: "none",
  } as const,
  buttonBase: {
    width: "100%",
    marginTop: 20,
    padding: "12px",
    border: "none",
    fontFamily: "inherit",
    fontSize: 12,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
  } as const,
  message: { fontSize: 12, marginTop: 12, marginBottom: 0, lineHeight: 1.5 } as const,
} as const;

function errorCopy(code: string | null): string | null {
  if (!code) return null;
  if (code === "rate_limited") return "Too many attempts. Wait a minute and try again.";
  return "That link is expired or already used. Enter your email to get a new one.";
}

export function LoginForm() {
  const params = useSearchParams();
  const errorFromUrl = errorCopy(params.get("error"));
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(errorFromUrl);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await fetch("/api/admin/magic/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      setSent(true);
      setBusy(false);
      return;
    }
    if (res.status === 429) {
      setError("Too many attempts. Wait a minute and try again.");
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error === "invalid email" ? "Enter a valid email." : "Something went wrong.");
    }
    setBusy(false);
  }

  const disabled = busy || !email;
  const buttonStyle = {
    ...styles.buttonBase,
    background: disabled ? "#33302a" : "#e39a2b",
    color: disabled ? "#8b8371" : "#1a1712",
    cursor: disabled ? "not-allowed" : "pointer",
  } as const;

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.eyebrowRow}>
          <span style={styles.dot} />
          <span style={styles.eyebrow}>Recourse — Ops</span>
        </div>

        <h1 style={styles.heading}>{sent ? "Check your inbox" : "Sign in"}</h1>

        {sent ? (
          <p style={{ ...styles.message, color: "#f2ebd8" }}>
            We just sent a sign-in link to <strong>{email}</strong>. It expires in
            15 minutes and can only be used once.
          </p>
        ) : (
          <form onSubmit={submit}>
            <label htmlFor="email" style={styles.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
            {error && (
              <p role="alert" style={{ ...styles.message, color: "#e07b5a" }}>
                {error}
              </p>
            )}
            <button type="submit" disabled={disabled} style={buttonStyle}>
              {busy ? "Sending…" : "Send sign-in link"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Confirm `page.tsx` needs no changes**

Re-read `app/admin/login/page.tsx` — it already wraps `LoginForm` in `Suspense`, which is what `useSearchParams` requires. Leave it as-is.

- [ ] **Step 3: Type-check + build**

Run: `npx tsc --noEmit`
Expected: exits 0.

Run: `npm run build`
Expected: build succeeds; route manifest lists both new API routes (`/api/admin/magic/request`, `/api/admin/magic/verify`).

- [ ] **Step 4: Local smoke — send yourself a link, click it**

Run `npm run dev` in one shell.

Then in another shell:

```bash
curl -sS -X POST http://localhost:3000/api/admin/magic/request \
  -H 'content-type: application/json' \
  -d '{"email":"agrawalsiddharth18@gmail.com"}'
```

Expected: `{"ok":true}`. Inbox receives a link within ~10s.

Click the link in the email:
- Expected: browser lands on `http://localhost:3000/admin` with `recourse_admin` cookie set.
- Click the same link a second time: redirect to `/admin/login?error=link_invalid`.

Try an unlisted email:

```bash
curl -sS -X POST http://localhost:3000/api/admin/magic/request \
  -H 'content-type: application/json' \
  -d '{"email":"not-me@example.com"}'
```

Expected: still `{"ok":true}`; no email arrives.

- [ ] **Step 5: Commit**

```bash
git add app/admin/login/LoginForm.tsx
git commit -m "feat(admin): magic-link login UI (email → check-inbox state)"
```

---

## Task 7: Delete the password path

**Files:**
- Delete: `app/api/admin/login/route.ts`

- [ ] **Step 1: Delete the route file**

Run: `rm app/api/admin/login/route.ts`

- [ ] **Step 2: Confirm nothing else references it**

Run: `grep -rn "api/admin/login\|ADMIN_PASSWORD" app lib middleware.ts 2>/dev/null`
Expected: no matches (LoginForm now POSTs to `/api/admin/magic/request`).

- [ ] **Step 3: Type-check + build**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed; route manifest no longer lists `/api/admin/login`.

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/login/route.ts
git commit -m "chore(admin): retire password login route"
```

---

## Task 8: Push, set Vercel prod env, redeploy, live smoke

**Files:** none (deployment step)

- [ ] **Step 1: Push all commits**

```bash
git push origin main
```

Vercel auto-deploys on push (per user's deployment workflow). Wait for the deployment to reach `● Ready` — check with `npx vercel ls | head -5`.

- [ ] **Step 2: Set the three new prod env vars, remove the old one**

```bash
npx vercel env rm ADMIN_PASSWORD production          # confirm y
printf 're_REDACTED_SEE_ENV_LOCAL' | npx vercel env add RESEND_API_KEY production
printf 'agrawalsiddharth18@gmail.com'                 | npx vercel env add ADMIN_EMAIL_ALLOWLIST production
printf '5HcuAyHnuYQZtNk5OwlyS5Mnbz8P5Ij4UXIaRfr+xIY=' | npx vercel env add MAGIC_TOKEN_SECRET production
printf 'https://rental-recourse.vercel.app'           | npx vercel env add NEXT_PUBLIC_APP_URL production
```

(If any `env add` prompts "Which environments?" instead of accepting positional, retry with `--environments production`.)

- [ ] **Step 3: Redeploy so the running instance sees the new env**

```bash
npx vercel --prod --yes
```

Wait for `● Ready`.

- [ ] **Step 4: Verify env is what we expect**

```bash
npx vercel env ls production | grep -E "ADMIN|LAUNCH|RESEND|MAGIC|NEXT_PUBLIC_APP_URL"
```

Expected: `ADMIN_COOKIE_SECRET`, `ADMIN_EMAIL_ALLOWLIST`, `LAUNCH_TS`, `MAGIC_TOKEN_SECRET`, `NEXT_PUBLIC_APP_URL`, `RESEND_API_KEY` — and NO `ADMIN_PASSWORD`.

- [ ] **Step 5: Live smoke against prod**

```bash
curl -sS -X POST https://rental-recourse.vercel.app/api/admin/magic/request \
  -H 'content-type: application/json' \
  -d '{"email":"agrawalsiddharth18@gmail.com"}'
```

Expected: `{"ok":true}`. Inbox receives link within ~10s.

Click the link:
- Land on `https://rental-recourse.vercel.app/admin`.
- Dashboard renders (session cookie set).
- Re-click: `?error=link_invalid`.

- [ ] **Step 6: Rotate the Resend key (safety, since key was pasted in chat)**

Manually in the Resend dashboard: revoke the old key, create a new one, then:

```bash
npx vercel env rm RESEND_API_KEY production
printf '<new_key>' | npx vercel env add RESEND_API_KEY production
npx vercel --prod --yes
```

Update local `.env.local` with the new key too.

---

## Self-Review

- **Spec coverage:** Every spec section has a task — token core (Task 2), rate limiters (Task 3), request route (Task 4), verify route (Task 5), UI states (Task 6), env/password removal (Task 1 + 7), prod deploy (Task 8). Middleware/cookie unchanged as promised.
- **Placeholder scan:** No TBDs, no vague "add error handling" — every step has real code or a real command.
- **Type consistency:** `MagicRedis` interface is defined once in Task 2 and consumed by routes in Tasks 4/5 via an inline adapter (`(k, ttl, v) => r.setex(k, ttl, v)`) — matches the two methods declared. `VerifyResult` discriminated union is only read by the verify route, which checks `.ok`.
- **Rollback:** All eight tasks are independent commits; `git revert` any subset if needed. Env rollback: re-add `ADMIN_PASSWORD`, revert code, redeploy.