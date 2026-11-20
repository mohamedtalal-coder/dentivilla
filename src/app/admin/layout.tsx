import { auth, signOut } from "@/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { Logo } from "@/components/brand/Logo";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-ivory font-arabic" dir="rtl" lang="ar">
      {session?.user ? (
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="card-soft h-fit rounded-[28px] p-5 lg:sticky lg:top-6">
            <Logo compact />
            <AdminNav />
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/admin/login" });
              }}
            >
              <button className="mt-6 text-sm text-red-800 hover:underline" type="submit">
                خروج
              </button>
            </form>
          </aside>
          <div>{children}</div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
