import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const proxyHandler = auth((request) => {
  const { pathname, search } = request.nextUrl;
  const isAdmin = pathname.startsWith("/admin");
  const isLogin = pathname.startsWith("/admin/login");

  // Determine real public origin from headers (behind Vercel / reverse proxy)
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    request.nextUrl.host;
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (request.nextUrl.protocol ? request.nextUrl.protocol.replace(":", "") : "https");
  const baseUrl = `${proto}://${host}`;

  if (isAdmin && !isLogin && !request.auth) {
    const url = new URL("/admin/login", baseUrl);
    url.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }
  if (isLogin && request.auth) {
    const url = new URL("/admin", baseUrl);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export default proxyHandler;
export { proxyHandler as proxy };

export const config = {
  matcher: ["/admin/:path*"],
};
