import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const isAdmin = pathname.startsWith("/admin");
  const isLogin = pathname.startsWith("/admin/login");
  if (isAdmin && !isLogin && !request.auth) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  if (isLogin && request.auth) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
