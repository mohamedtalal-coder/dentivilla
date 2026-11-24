"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FileText, Image as ImageIcon } from "lucide-react";
import type { ReactNode } from "react";

type Tab = "media" | "text";

export function SiteDataTabs({
  media,
  text,
}: {
  media: ReactNode;
  text: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab: Tab = searchParams.get("tab") === "text" ? "text" : "media";

  function select(next: Tab) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "media") params.delete("tab");
    else params.set("tab", next);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="grid gap-6">
      <div role="tablist" aria-label="بيانات الموقع" className="flex w-fit gap-1 rounded-full border border-line bg-white p-1">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "media"}
          onClick={() => select("media")}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            tab === "media" ? "bg-teal-deep text-white" : "text-ink hover:bg-ivory"
          }`}
        >
          <ImageIcon className="size-4" aria-hidden />
          الوسائط
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "text"}
          onClick={() => select("text")}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            tab === "text" ? "bg-teal-deep text-white" : "text-ink hover:bg-ivory"
          }`}
        >
          <FileText className="size-4" aria-hidden />
          النصوص
        </button>
      </div>
      {tab === "media" ? media : text}
    </div>
  );
}
