import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyCookie } from "@/lib/admin/auth";

export const config = {
  matcher: ["/admin/:path*"],
};

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === "/admin/login") return NextResponse.next();
  const secret = process.env.ADMIN_COOKIE_SECRET;
  if (!secret) {
    return new NextResponse("ADMIN_COOKIE_SECRET not configured", { status: 500 });
  }
  const cookie = req.cookies.get(ADMIN_COOKIE)?.value;
  if (await verifyCookie(cookie, secret)) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}
