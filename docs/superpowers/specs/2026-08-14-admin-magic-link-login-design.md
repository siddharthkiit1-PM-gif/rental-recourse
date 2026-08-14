# Admin login: swap password → Resend magic link

**Date:** 2026-08-14
**Scope:** `/admin` authentication only. Session cookie, middleware, dashboard, and logout are unchanged.

## Motivation

Current `/admin` login is a shared password + HMAC session cookie. Moving to a passwordless magic-link flow gets rid of the password to remember and lets the allowlist be edited without a redeploy.

## Non-goals

- No multi-user roles, no team management UI. Allowlist is an env var.
- No account recovery beyond "request a new link".
- No changes to the session cookie format, TTL, middleware, or the dashboard itself.

## Architecture

```
/admin/login
   ↓  submit email
POST /api/admin/magic/request
   ↓  allowlist check (silent on miss)
   ↓  mint one-time token, SETEX nonce in Redis (TTL 15m)
   ↓  send link via Resend
200  → UI shows "check your inbox"

email link → GET /api/admin/magic/verify?token=…
   ↓  verify HMAC + exp + Redis GETDEL nonce
   ↓  mint existing HMAC session cookie
302  → /admin
```

The magic-link layer is the ONLY thing added. It hands off to the existing session cookie the moment verification succeeds. Middleware, `mintCookie`, `verifyCookie`, `ADMIN_COOKIE` all stay as-is.

## Files

| Change | Path | Purpose |
|---|---|---|
| new | `lib/admin/magic.ts` | Mint/verify magic token; Resend send helper |
| new | `lib/admin/ratelimit.ts` | Two new `Ratelimit` instances (request + verify) using existing `redis()` helper |
| new | `app/api/admin/magic/request/route.ts` | POST — accept email, send link |
| new | `app/api/admin/magic/verify/route.ts` | GET — verify token, mint session cookie |
| edit | `app/admin/login/LoginForm.tsx` | Email input; success + error states |
| edit | `app/admin/login/page.tsx` | Read `?error=…` and `?sent=1` from URL |
| delete | `app/api/admin/login/route.ts` | Password path retired |
| new | `tests/unit/magic.test.ts` | Unit tests for token mint/verify |

Package add: `resend` (only dep).

## Token format

```
token   = b64url(payload) + "." + b64url(HMAC-SHA256(payload, MAGIC_TOKEN_SECRET))
payload = JSON of { email: string, jti: string, exp: number }
jti     = b64url(crypto.getRandomValues(16 bytes))
exp     = Date.now() + 15 * 60 * 1000
```

Single-use enforcement: on mint, `SETEX recourse:magic:<jti> 900 1`. On verify, `GETDEL recourse:magic:<jti>` — missing key means "already consumed or expired", reject.

Verifying requires ALL of:
1. Signature matches (timing-safe compare — reuse the helper already in `lib/admin/auth.ts`).
2. `exp > now`.
3. `GETDEL` returned a value (nonce existed).
4. Email in payload is still on the current allowlist (guards against env change between mint and verify).

## Environment variables

**Add** (`.env.local` and Vercel production):
| Name | Value |
|---|---|
| `RESEND_API_KEY` | `re_…` (rotate after end-to-end verification) |
| `ADMIN_EMAIL_ALLOWLIST` | `agrawalsiddharth18@gmail.com` (comma-separated, whitespace-trimmed on read) |
| `MAGIC_TOKEN_SECRET` | 32 random bytes, base64 |
| `NEXT_PUBLIC_APP_URL` | `https://rental-recourse.vercel.app` — used to build absolute magic links |

**Remove:**
- `ADMIN_PASSWORD` (Vercel prod + `.env.local`).

**Keep unchanged:**
- `ADMIN_COOKIE_SECRET`, `LAUNCH_TS`, `UPSTASH_REDIS_*`.

## Email

- **From:** `Recourse <onboarding@resend.dev>` (sandbox — works because only recipient is the account owner).
- **Subject:** `Your admin sign-in link`
- **Body:** plain text + minimal HTML. Contains full absolute URL, expiry note ("expires in 15 minutes, single use"), and a "you can ignore this email if you didn't ask for it" line.

## UX states on `/admin/login`

| State | Trigger | Copy |
|---|---|---|
| Idle | first load | Email input + "Send me a sign-in link" button |
| Sent | `?sent=1` after successful POST | "Check your inbox — link expires in 15 minutes." Hide the form. |
| Error | `?error=link_invalid` (verify failed) | "That link is expired or already used. Enter your email to get a new one." Show form. |
| Error | `?error=link_invalid&reason=notallowed` | Same generic copy — do NOT distinguish allowlist misses (avoid enumeration). |

The request endpoint always responds 200 regardless of allowlist match; only the verify path can distinguish, and it doesn't leak the reason to the UI.

## Rate limiting

Add two new `Ratelimit` instances in `lib/admin/ratelimit.ts` using the same `@upstash/ratelimit` + shared `redis()` client already in the project:
- `POST /api/admin/magic/request` — 5 / minute / IP, prefix `recourse:rl:magic-req`.
- `GET /api/admin/magic/verify` — 20 / minute / IP, prefix `recourse:rl:magic-verify` (guards jti brute-force on top of HMAC + 128-bit random jti).

## Error handling

| Where | Failure | Behavior |
|---|---|---|
| request | Invalid email format | 400 JSON `{ error: "invalid email" }` — client-side validation catches first |
| request | Rate-limited | 429 JSON `{ error: "too many requests" }` |
| request | Resend send fails | Log `console.error`, still return 200 (avoid signal to caller) |
| verify | Bad signature / expired / consumed / not on allowlist | 302 → `/admin/login?error=link_invalid` |
| verify | Rate-limited | 302 → `/admin/login?error=rate_limited` |

No exception is surfaced to the browser.

## Testing

Unit (`lib/admin/magic.test.ts`, Vitest — matches the project's existing test setup):
- Round-trip: mint then verify succeeds; email echoed.
- Tampered signature rejected.
- Expired token rejected.
- Second verify of same token rejected (nonce consumed).
- Allowlist miss on verify rejected even if signature valid.

Manual (post-deploy):
1. Visit `/admin/login`, enter `agrawalsiddharth18@gmail.com`, submit.
2. Confirm inbox receives link within ~10s.
3. Click link → land on `/admin`, cookie set.
4. Click same link again → redirect to `/admin/login?error=link_invalid`.
5. Enter a non-allowlisted email → still shows "check your inbox"; no email arrives.
6. Rotate the Resend key.

## Rollback

Single revert of the implementation commit restores the password flow. No schema/migration changes; no session cookies are invalidated (cookie format unchanged).
