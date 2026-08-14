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
    }
  }

  return Response.json({ ok: true });
}
