import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * Server Component authentication guard for the admin area.
 * Redirects unauthorized requests directly to the login page.
 */
export async function requireAdminSession() {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }
  return session;
}
