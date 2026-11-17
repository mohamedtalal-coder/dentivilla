import type { NextAuthConfig } from "next-auth";

// If deployed in production or on Vercel and AUTH_URL/NEXTAUTH_URL was accidentally set to localhost,
// delete it so Auth.js relies on dynamic host resolution via trustHost: true.
if (
  process.env.NODE_ENV === "production" ||
  process.env.VERCEL === "1" ||
  Boolean(process.env.VERCEL_ENV)
) {
  if (process.env.AUTH_URL?.includes("localhost")) {
    delete process.env.AUTH_URL;
  }
  if (process.env.NEXTAUTH_URL?.includes("localhost")) {
    delete process.env.NEXTAUTH_URL;
  }
}

export const authConfig = {
  trustHost: true,
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt" },
  providers: [],
} satisfies NextAuthConfig;
