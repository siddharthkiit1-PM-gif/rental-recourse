import { ADMIN_COOKIE, cookieAttrs, mintCookie } from "@/lib/admin/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { password?: string } | null;
  const password = body?.password;
  const expected = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_COOKIE_SECRET;
  if (!expected || !secret) {
    return Response.json({ error: "admin not configured" }, { status: 500 });
  }
  if (typeof password !== "string" || password !== expected) {
    // Constant-time-ish delay to blunt timing probes
    await new Promise((r) => setTimeout(r, 400));
    return Response.json({ error: "invalid credentials" }, { status: 401 });
  }
  const token = await mintCookie(secret);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "set-cookie": `${ADMIN_COOKIE}=${token}; ${cookieAttrs()}`,
    },
  });
}
