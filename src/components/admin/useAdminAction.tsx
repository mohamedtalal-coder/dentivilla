"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle2, CircleAlert } from "lucide-react";
import type { ActionResult } from "@/app/actions/admin";

/** Runs an admin server action, refreshes server data, and exposes feedback. */
export function useAdminAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  function run(action: () => Promise<ActionResult>, onSuccess?: () => void) {
    setResult(null);
    startTransition(async () => {
      try {
        const next = await action();
        setResult(next);
        if (next.ok) {
          onSuccess?.();
          router.refresh();
        }
      } catch {
        setResult({ ok: false, error: "تعذر الاتصال بالخادم." });
      }
    });
  }

  return { pending, result, run, clear: () => setResult(null) };
}

export function ActionFeedback({ result }: { result: ActionResult | null }) {
  if (!result) return null;
  return result.ok ? (
    <p role="status" className="flex items-center gap-1.5 text-sm text-teal-mid">
      <CheckCircle2 className="size-4" aria-hidden />
      {result.message ?? "تم الحفظ"}
    </p>
  ) : (
    <p role="alert" className="flex items-center gap-1.5 text-sm text-red-700">
      <CircleAlert className="size-4" aria-hidden />
      {result.error}
    </p>
  );
}
