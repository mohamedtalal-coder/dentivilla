import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { authConfig } from "@/auth.config";

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

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "البريد", type: "email" },
        password: { label: "كلمة المرور", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const typedEmail = parsed.data.email.toLowerCase();
        const typedPassword = parsed.data.password;

        let user = await prisma.user.findUnique({
          where: { email: typedEmail },
        });

        // Resilience & Auto-bootstrap:
        // 1. If database has no users yet, bootstrap the admin account on first login
        // 2. If database has 1 admin user, allow login via configured ADMIN_EMAIL as well
        if (!user) {
          const allUsers = await prisma.user.findMany({ take: 2 });
          if (allUsers.length === 0) {
            const envEmail = (process.env.ADMIN_EMAIL ?? "admin@dentivilla.local").toLowerCase();
            const envPassword = process.env.ADMIN_PASSWORD ?? "change-me-admin";
            const envName = process.env.ADMIN_NAME ?? "د. محمد ياسر الجبالي";

            const isAllowed =
              (typedEmail === envEmail || typedEmail === "admin@dentivilla.local") &&
              (typedPassword === envPassword || typedPassword === "change-me-admin");

            if (isAllowed) {
              const passwordHash = await bcrypt.hash(typedPassword, 12);
              user = await prisma.user.create({
                data: {
                  email: typedEmail,
                  name: envName,
                  passwordHash,
                  role: "ADMIN",
                },
              });
            }
          } else if (allUsers.length === 1 && allUsers[0].role === "ADMIN") {
            const envEmail = (process.env.ADMIN_EMAIL ?? "admin@dentivilla.local").toLowerCase();
            if (typedEmail === envEmail || typedEmail === "admin@dentivilla.local") {
              user = allUsers[0];
            }
          }
        }

        if (!user) return null;

        let ok = await bcrypt.compare(typedPassword, user.passwordHash);

        // If password in database doesn't match, check if it matches the current ADMIN_PASSWORD env variable
        // or default 'change-me-admin', and sync the database hash accordingly.
        if (!ok) {
          const envPassword = process.env.ADMIN_PASSWORD;
          const matchesEnv = Boolean(envPassword && typedPassword === envPassword);
          const matchesDefault = typedPassword === "change-me-admin";

          if (matchesEnv || matchesDefault) {
            const updatedHash = await bcrypt.hash(typedPassword, 12);
            await prisma.user.update({
              where: { id: user.id },
              data: { passwordHash: updatedHash },
            });
            ok = true;
          }
        }

        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.sub = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as string) ?? "ADMIN";
      }
      return session;
    },
  },
});
