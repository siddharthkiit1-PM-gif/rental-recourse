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
