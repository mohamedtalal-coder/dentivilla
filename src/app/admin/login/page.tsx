"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@dentivilla.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setPending(false);
    if (result?.error) {
      setError("بيانات الدخول غير صحيحة");
      return;
    }
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const callbackUrl = params?.get("callbackUrl");
    const destination = callbackUrl && callbackUrl.startsWith("/admin") ? callbackUrl : "/admin";
    router.push(destination);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="card-soft w-full max-w-md rounded-[28px] p-8"
      >
        <Logo />
        <h1 className="mt-6 text-2xl font-bold text-teal-deep">دخول الطبيب</h1>
        <p className="mt-2 text-sm text-muted">لوحة خاصة لإدارة المواعيد والمرضى.</p>
        <label className="mt-6 grid gap-1 text-sm">
          البريد
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-2xl border border-[rgba(15,79,76,0.12)] px-4 py-3"
            required
          />
        </label>
        <label className="mt-4 grid gap-1 text-sm">
          كلمة المرور
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-2xl border border-[rgba(15,79,76,0.12)] px-4 py-3"
            required
          />
        </label>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        <Button type="submit" className="mt-6 w-full" disabled={pending}>
          {pending ? "جاري الدخول…" : "دخول"}
        </Button>
      </form>
    </div>
  );
}
