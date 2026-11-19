"use client";

import { useState } from "react";
import {
  ImagePlus,
  Loader2,
  RotateCcw,
} from "lucide-react";
import {
  resetSiteImageSlot,
  updateSiteImageSlot,
} from "@/app/actions/admin";
import { useAdminAction } from "@/components/admin/useAdminAction";
import type { SiteImageSlotDef } from "@/lib/site-images";

export type AdminSiteImageSlot = SiteImageSlotDef & {
  activeUrl: string;
  isCustom: boolean;
  mediaId: string | null;
  updatedAt: string | null;
};

export function SiteImageManager({
  slots,
}: {
  slots: AdminSiteImageSlot[];
}) {
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const { pending, result, run } = useAdminAction();

  async function handleSlotUpload(key: string, file: File) {
    setUploadingSlot(key);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/admin/media", { method: "POST", body });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error ?? "تعذر رفع الصورة.");

      await run(() => updateSiteImageSlot({ key, mediaId: payload.id }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "تعذر رفع الصورة.");
    } finally {
      setUploadingSlot(null);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-line/80 bg-ivory/60 p-4 text-sm text-neutral-700">
        💡 يمكنك استبدال أي صورة رئيسية في الموقع برفع صورة جديدة مخصصة من جهازك. تُضغط الصور تلقائياً وتُحفظ بصيغة WebP عالية الجودة وسريعة التحميل، مع إمكانية استعادة الصورة الأصلية في أي وقت.
      </div>

      {result && (
        <div
          role="alert"
          className={`rounded-2xl p-4 text-sm font-semibold transition-all ${
            result.ok ? "bg-teal-light text-teal-deep" : "bg-red-50 text-red-700"
          }`}
        >
          {result.ok ? result.message ?? "تمت العملية بنجاح" : result.error}
        </div>
      )}

      {/* Grid of Core Website Image Slots */}
      <div className="grid gap-6 md:grid-cols-2">
        {slots.map((slot) => {
          const isUploadingThis = uploadingSlot === slot.key;

          return (
            <div
              key={slot.key}
              className="flex flex-col justify-between overflow-hidden rounded-[2rem] border border-line bg-white p-6 shadow-sm transition-all hover:border-teal/30 hover:shadow-card"
            >
              <div>
                {/* Header: Title and Status */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-teal-deep">
                      {slot.labelAr}
                    </h3>
                    <p className="mt-0.5 text-xs text-teal-mid font-medium">
                      {slot.locationAr}
                    </p>
                  </div>
                  <span
                    className={`chip text-[11px] font-semibold ${
                      slot.isCustom
                        ? "border-teal/30 bg-teal-light text-teal-deep"
                        : "border-neutral-200 bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {slot.isCustom ? "صورة مخصصة نشطة" : "الصورة الافتراضية"}
                  </span>
                </div>

                <p className="mt-2 text-xs leading-5 text-muted">
                  المقاس المقترح: {slot.recommendedSize}
                </p>

                {/* Image Preview Box */}
                <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-2xl border border-line bg-neutral-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slot.activeUrl}
                    alt={slot.labelAr}
                    className="size-full object-contain p-2"
                  />
                  {isUploadingThis && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs">
                      <Loader2 className="size-7 animate-spin text-teal" />
                      <span className="mt-2 text-xs font-semibold text-teal-deep">
                        جارٍ معالجة ورفع الصورة...
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Bar */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-4">
                <label className="btn-primary cursor-pointer text-xs shadow-sm">
                  <ImagePlus className="size-4" aria-hidden />
                  {slot.isCustom ? "تغيير الصورة" : "رفع صورة مخصصة"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                    className="sr-only"
                    disabled={isUploadingThis || pending}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleSlotUpload(slot.key, file);
                      e.target.value = "";
                    }}
                  />
                </label>

                {slot.isCustom && (
                  <button
                    type="button"
                    disabled={pending || isUploadingThis}
                    onClick={() => {
                      if (confirm(`هل ترغب في استعادة الصورة الافتراضية لـ «${slot.labelAr}»؟`)) {
                        run(() => resetSiteImageSlot(slot.key));
                      }
                    }}
                    className="btn-secondary text-xs text-neutral-600 hover:text-red-700"
                  >
                    <RotateCcw className="size-3.5" aria-hidden />
                    استعادة الافتراضية
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
