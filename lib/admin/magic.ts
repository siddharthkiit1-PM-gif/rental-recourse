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
