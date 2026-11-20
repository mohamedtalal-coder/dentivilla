"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Images,
  Loader2,
  RotateCcw,
  Trash2,
} from "lucide-react";
import {
  addSiteImageItem,
  deleteSiteImageItem,
  reorderSiteImageItems,
  resetSiteImageSlot,
  updateSiteImageSlot,
} from "@/app/actions/admin";
import { useAdminAction } from "@/components/admin/useAdminAction";
import type { SiteImageSlotDef } from "@/lib/site-images";

export type AdminSiteImageItem = {
  id: string;
  url: string;
  mediaId: string | null;
  sortOrder: number;
};

export type AdminSiteImageSlot = SiteImageSlotDef & {
  activeUrl: string;
  isCustom: boolean;
  mediaId: string | null;
  items?: AdminSiteImageItem[];
  updatedAt: string | null;
};

export function SiteImageManager({
  slots,
}: {
  slots: AdminSiteImageSlot[];
}) {
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [previewIndexes, setPreviewIndexes] = useState<Record<string, number>>({});
  const { pending, result, run } = useAdminAction();

  async function handleSingleUpload(key: string, file: File) {
    setUploadingSlot(key);
    setUploadProgress("جاري معالجة ورفع الصورة...");
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
      setUploadProgress(null);
    }
  }

  async function handleMultipleUpload(key: string, files: FileList | File[]) {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploadingSlot(key);
    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setUploadProgress(`جاري معالجة ورفع الصورة ${i + 1} من ${fileArray.length}...`);
        const body = new FormData();
        body.set("file", file);
        const res = await fetch("/api/admin/media", { method: "POST", body });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload.error ?? "تعذر رفع الصورة.");

        await run(() => addSiteImageItem({ slotKey: key, mediaId: payload.id }));
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "تعذر رفع الصور.");
    } finally {
      setUploadingSlot(null);
      setUploadProgress(null);
    }
  }

  async function handleMoveItem(slotKey: string, items: AdminSiteImageItem[], fromIdx: number, toIdx: number) {
    if (toIdx < 0 || toIdx >= items.length) return;
    const reordered = [...items];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    const itemIds = reordered.map((it) => it.id);
    await run(() => reorderSiteImageItems({ slotKey, itemIds }));
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-line/80 bg-ivory/60 p-4 text-sm text-neutral-700">
        💡 يمكنك استبدال أي صورة رئيسية في الموقع برفع صورة جديدة مخصصة من جهازك. تُضغط الصور تلقائياً وتُحفظ بصيغة WebP عالية الجودة وسريعة التحميل، مع إمكانية إضافة صور متعددة لمعرض الفلسفة وترتيبها أو حذفها بسهولة.
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
      <div className="grid gap-6 lg:grid-cols-2">
        {slots.map((slot) => {
          const isUploadingThis = uploadingSlot === slot.key;
          const isMultiple = Boolean(slot.multiple);
          const items = slot.items ?? [];
          const activeIndex = previewIndexes[slot.key] ?? 0;
          const currentSlide = items[activeIndex]?.url || slot.activeUrl;

          return (
            <div
              key={slot.key}
              className={`flex flex-col justify-between overflow-hidden rounded-[2rem] border border-line bg-white p-6 shadow-sm transition-all hover:border-teal/30 hover:shadow-card ${
                isMultiple ? "lg:col-span-2" : ""
              }`}
            >
              <div>
                {/* Header: Title and Status */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-teal-deep">
                        {slot.labelAr}
                      </h3>
                      {isMultiple && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-light px-2.5 py-0.5 text-xs font-bold text-amber-dark border border-amber/30">
                          <Images className="size-3.5" aria-hidden />
                          معرض صور متحرك
                        </span>
                      )}
                    </div>
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
                    {isMultiple
                      ? items.length > 0
                        ? `معرض نشط (${items.length} صور)`
                        : "العرض الافتراضي"
                      : slot.isCustom
                      ? "صورة مخصصة نشطة"
                      : "الصورة الافتراضية"}
                  </span>
                </div>

                <p className="mt-2 text-xs leading-5 text-muted">
                  الحجم الموصى به: {slot.recommendedSize}
                </p>

                {/* Multiple Images Management Section */}
                {isMultiple ? (
                  <div className="mt-5 grid gap-5 lg:grid-cols-12">
                    {/* Live Preview Box */}
                    <div className="lg:col-span-6">
                      <p className="text-xs font-bold text-teal-deep mb-2">معاينة حية كما تظهر للمرضى:</p>
                      <div className="relative aspect-[4/5] max-h-80 w-full overflow-hidden rounded-2xl border border-line bg-teal-deep shadow-inner">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={currentSlide}
                          alt={slot.labelAr}
                          className="size-full object-cover"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-teal-deep/95 via-teal-deep/25 to-transparent" />
                        <blockquote className="pointer-events-none absolute inset-x-4 bottom-4 text-xs font-medium text-white sm:text-sm">
                          «ابتسامتك لا تتكرر، نحن فقط نساعدها على الظهور»
                        </blockquote>

                        {/* Slide Selector Arrows in Preview */}
                        {items.length > 1 && (
                          <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewIndexes((prev) => ({
                                  ...prev,
                                  [slot.key]: (activeIndex - 1 + items.length) % items.length,
                                }))
                              }
                              className="grid size-7 place-items-center rounded-full bg-teal-deep/70 text-white backdrop-blur-xs hover:bg-teal-deep active:scale-95"
                              aria-label="السابق"
                            >
                              <ChevronRight className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewIndexes((prev) => ({
                                  ...prev,
                                  [slot.key]: (activeIndex + 1) % items.length,
                                }))
                              }
                              className="grid size-7 place-items-center rounded-full bg-teal-deep/70 text-white backdrop-blur-xs hover:bg-teal-deep active:scale-95"
                              aria-label="التالي"
                            >
                              <ChevronLeft className="size-4" />
                            </button>
                          </div>
                        )}

                        {isUploadingThis && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-teal-deep/85 backdrop-blur-xs z-30">
                            <Loader2 className="size-8 animate-spin text-gold-soft" />
                            <span className="mt-2 text-xs font-semibold text-white">
                              {uploadProgress || "جاري معالجة ورفع الصور..."}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Thumbnails Gallery & Item Ordering */}
                    <div className="flex flex-col justify-between lg:col-span-6">
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-teal-deep">
                            الصور الحالية بالمعرض ({items.length}):
                          </p>
                          <span className="text-[11px] text-muted">
                            إعادة ترتيب أو حذف أي صورة
                          </span>
                        </div>

                        {items.length === 0 ? (
                          <div className="mt-3 rounded-2xl border border-dashed border-line bg-alabaster p-6 text-center text-xs text-muted">
                            لم تتم إضافة صور مخصصة بعد. تظهر حالياً مجسمات ثلاثية الأبعاد لتشريح الأسنان.
                            <br />
                            <span className="mt-1 block font-semibold text-teal-mid">
                              اضغط على «إضافة صور للمعرض» بالأسفل لرفع صورة أو أكثر.
                            </span>
                          </div>
                        ) : (
                          <div className="mt-3 grid max-h-72 gap-2.5 overflow-y-auto pl-1">
                            {items.map((item, idx) => (
                              <div
                                key={item.id}
                                className={`flex items-center justify-between gap-3 rounded-xl border p-2.5 transition-all ${
                                  idx === activeIndex
                                    ? "border-amber bg-amber-light/30 shadow-xs"
                                    : "border-line bg-white hover:border-teal/30"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={item.url}
                                    alt={`شريحة ${idx + 1}`}
                                    className="size-12 shrink-0 rounded-lg object-cover border border-line"
                                  />
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="rounded bg-teal-deep px-1.5 py-0.5 text-[10px] font-bold text-white">
                                        #{idx + 1}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setPreviewIndexes((prev) => ({
                                            ...prev,
                                            [slot.key]: idx,
                                          }))
                                        }
                                        className="text-xs font-semibold text-teal-deep hover:underline"
                                      >
                                        معاينة
                                      </button>
                                    </div>
                                    <p className="mt-0.5 text-[11px] text-muted">
                                      {idx === 0 ? "صورة الغلاف الرئيسية" : `صورة رقم ${idx + 1}`}
                                    </p>
                                  </div>
                                </div>

                                {/* Reorder & Delete Actions */}
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={pending || idx === 0}
                                    onClick={() => handleMoveItem(slot.key, items, idx, idx - 1)}
                                    title="تحريك لأعلى"
                                    aria-label="تحريك لأعلى"
                                    className="grid size-7 place-items-center rounded-lg border border-line bg-alabaster text-neutral-600 hover:bg-teal-light hover:text-teal-deep disabled:opacity-30"
                                  >
                                    <ArrowUp className="size-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={pending || idx === items.length - 1}
                                    onClick={() => handleMoveItem(slot.key, items, idx, idx + 1)}
                                    title="تحريك لأسفل"
                                    aria-label="تحريك لأسفل"
                                    className="grid size-7 place-items-center rounded-lg border border-line bg-alabaster text-neutral-600 hover:bg-teal-light hover:text-teal-deep disabled:opacity-30"
                                  >
                                    <ArrowDown className="size-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={pending || isUploadingThis}
                                    onClick={() => {
                                      if (confirm(`هل ترغب في حذف الصورة رقم ${idx + 1} من المعرض؟`)) {
                                        run(() => deleteSiteImageItem(item.id));
                                      }
                                    }}
                                    title="حذف الصورة"
                                    aria-label="حذف الصورة"
                                    className="grid size-7 place-items-center rounded-lg border border-line bg-alabaster text-neutral-500 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Single Image Preview Box */
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
                          {uploadProgress || "جاري معالجة ورفع الصورة..."}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions Bar */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-4">
                {isMultiple ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="btn-primary cursor-pointer text-xs shadow-sm">
                      <ImagePlus className="size-4" aria-hidden />
                      إضافة صور للمعرض (صورة أو أكثر)
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                        className="sr-only"
                        disabled={isUploadingThis || pending}
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files && files.length > 0) {
                            handleMultipleUpload(slot.key, files);
                          }
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                ) : (
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
                        if (file) handleSingleUpload(slot.key, file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}

                {slot.isCustom && (
                  <button
                    type="button"
                    disabled={pending || isUploadingThis}
                    onClick={() => {
                      const msg = isMultiple
                        ? `هل ترغب في استعادة العرض الافتراضي لـ «${slot.labelAr}»؟`
                        : `هل ترغب في استعادة الصورة الافتراضية لـ «${slot.labelAr}»؟`;
                      if (confirm(msg)) {
                        run(() => resetSiteImageSlot(slot.key));
                      }
                    }}
                    className="btn-secondary text-xs text-neutral-600 hover:text-red-700"
                  >
                    <RotateCcw className="size-3.5" aria-hidden />
                    {isMultiple ? "استعادة العرض الافتراضي" : "استعادة الافتراضية"}
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
