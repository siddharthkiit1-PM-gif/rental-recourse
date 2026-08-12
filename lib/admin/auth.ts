/**
 * Admin cookie: base64url(timestamp).base64url(HMAC-SHA256(timestamp, secret)).
 * Verified by re-computing the HMAC and checking timestamp is <7 days old.
 * No JWT dep — Web Crypto is enough for a single-admin tool.
 */
export const ADMIN_COOKIE = "recourse_admin";
const MAX_AGE_SEC = 7 * 24 * 60 * 60;

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const b = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;
  let s = "";
  for (const byte of b) s += String.fromCharCode(byte);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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
  return b64url(sig);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function mintCookie(secret: string): Promise<string> {
  const ts = String(Date.now());
  const sig = await hmac(secret, ts);
  return `${b64url(new TextEncoder().encode(ts))}.${sig}`;
}

export async function verifyCookie(
  value: string | undefined,
  secret: string,
): Promise<boolean> {
  if (!value || !value.includes(".")) return false;
  const [tsPart, sigPart] = value.split(".");
  let ts: string;
  try {
    ts = new TextDecoder().decode(b64urlDecode(tsPart));
  } catch {
    return false;
  }
  const expected = await hmac(secret, ts);
  if (!timingSafeEqual(sigPart, expected)) return false;
  const age = (Date.now() - Number(ts)) / 1000;
  return Number.isFinite(age) && age >= 0 && age < MAX_AGE_SEC;
}

export function cookieAttrs(): string {
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SEC}${
    process.env.NODE_ENV === "production" ? "; Secure" : ""
  }`;
}
