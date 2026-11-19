"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { BeforeAfter } from "@/components/site/BeforeAfter";
import type { PublicCase } from "@/lib/cases";

const INTERVAL_MS = 4200;

export function CasesCarousel({ cases }: { cases: PublicCase[] }) {
  const [current, setCurrent] = useState(0);
  const count = cases.length;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-move carousel every 4.2 seconds
  useEffect(() => {
    if (count <= 1) return;

    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % count);
    }, INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [count, current]);

  if (count === 0) return null;

  function prev() {
    setCurrent((p) => (p - 1 + count) % count);
  }

  function next() {
    setCurrent((p) => (p + 1) % count);
  }

  return (
    <div className="mx-auto mt-10 max-w-4xl">
      {/* Sliding Track: horizontal slide across all cases */}
      <div className="relative overflow-hidden rounded-[2rem]" dir="ltr">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {cases.map((c) => (
            <div key={c.id} className="w-full shrink-0" dir="rtl">
              <BeforeAfter
                beforeSrc={c.beforeSrc}
                afterSrc={c.afterSrc}
                beforeAlt={`${c.title} — قبل العلاج`}
                afterAlt={`${c.title} — بعد العلاج`}
                caption={`${c.title}. ${c.description ?? ""} نُشرت بموافقة المريض، والنتائج تختلف من حالة لأخرى.`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Responsive Navigation Controls Under the Images */}
      {count > 1 && (
        <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-line/60 bg-white/80 p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
          {/* Controls: Next & Previous Buttons + Case Selector Pills */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Next and Previous Buttons placed under the images */}
            <div className="flex items-center gap-1.5" aria-label="أزرار التنقل">
              <button
                type="button"
                onClick={prev}
                aria-label="الحالة السابقة"
                title="الحالة السابقة"
                className="grid size-10 place-items-center rounded-full border border-line bg-white text-teal-deep shadow-sm transition-all hover:border-teal/40 hover:bg-teal-light hover:text-teal-deep active:scale-95"
              >
                <ChevronRight className="size-5" />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="الحالة التالية"
                title="الحالة التالية"
                className="grid size-10 place-items-center rounded-full border border-line bg-white text-teal-deep shadow-sm transition-all hover:border-teal/40 hover:bg-teal-light hover:text-teal-deep active:scale-95"
              >
                <ChevronLeft className="size-5" />
              </button>
            </div>

            <div className="hidden h-6 w-px bg-line sm:block" aria-hidden />

            {/* Case Selector Pills */}
            <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="تنقل بين الحالات">
              {cases.map((c, index) => {
                const isActive = index === current;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCurrent(index)}
                    aria-label={`عرض الحالة ${index + 1}: ${c.title}`}
                    aria-selected={isActive}
                    role="tab"
                    className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-teal-deep text-white shadow-sm ring-2 ring-teal-light"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                  >
                    {isActive && <Sparkles className="size-3 text-gold-soft animate-pulse" aria-hidden />}
                    <span>{c.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Auto-Moving Status Indicator */}
          <div className="flex items-center justify-between gap-3 border-t border-line/40 pt-3 text-xs text-muted sm:border-0 sm:pt-0">
            <span className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-teal opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-teal" />
              </span>
              <span>يتحرك تلقائياً</span>
            </span>
            <span className="rounded-md bg-teal-light/70 px-2 py-0.5 font-bold text-teal-deep">
              {current + 1} من {count}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
