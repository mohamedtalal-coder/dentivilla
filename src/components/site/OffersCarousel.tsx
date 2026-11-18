"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { BookLink } from "@/components/booking/BookLink";
import type { PublicOffer } from "@/lib/offers";

const INTERVAL_MS = 3800;

export function OffersCarousel({ offers }: { offers: PublicOffer[] }) {
  const [current, setCurrent] = useState(0);
  const count = offers.length;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
    <aside
      aria-label="العروض الخاصة بالعيادة"
      className="relative mt-8 overflow-hidden rounded-[2rem] border border-amber/35 bg-gradient-to-br from-amber-light via-ivory to-amber-light/70 p-6 shadow-card sm:p-8"
    >
      {/* Sliding Track: bulletproof horizontal sliding using LTR track with RTL slide contents */}
      <div className="overflow-hidden" dir="ltr">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {offers.map((offer, idx) => (
            <div key={offer.id} className="w-full shrink-0" dir="rtl">
              <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                <div className="max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="chip border-amber/40 bg-white font-bold text-amber-dark">
                      <Sparkles className="size-3.5" aria-hidden />
                      {offer.badge}
                    </span>
                    {count > 1 && (
                      <span className="text-xs text-muted">
                        عرض {idx + 1} من {count}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 text-2xl font-bold text-teal-deep sm:text-3xl">
                    {offer.titleAr}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted sm:text-base">
                    {offer.descriptionAr}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:flex-col sm:items-end">
                  <div className="flex items-baseline gap-2">
                    <p className="text-teal-deep">
                      <span className="text-3xl font-extrabold sm:text-4xl">{offer.price}</span>{" "}
                      <span className="text-sm font-semibold">ج.م</span>
                    </p>
                    {offer.originalPrice && offer.originalPrice > offer.price && (
                      <span className="text-sm text-neutral-400 line-through">
                        {offer.originalPrice} ج.م
                      </span>
                    )}
                  </div>

                  <BookLink
                    intent={{ treatmentSlug: offer.treatmentSlug || "consultation" }}
                    className="btn-gold px-7 py-3 text-base font-bold shadow-md transition-transform hover:scale-[1.02]"
                  >
                    احجز العرض
                  </BookLink>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Controls & Auto-movement visual progress */}
      {count > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-amber/20 pt-4">
          <div className="flex items-center gap-2" role="tablist" aria-label="تنقل بين العروض">
            {offers.map((offer, index) => {
              const isActive = index === current;
              return (
                <button
                  key={offer.id}
                  type="button"
                  onClick={() => setCurrent(index)}
                  aria-label={`الانتقال إلى: ${offer.titleAr}`}
                  aria-selected={isActive}
                  role="tab"
                  className={`relative h-2.5 overflow-hidden rounded-full transition-all duration-300 ${
                    isActive ? "w-10 bg-amber/30" : "w-3 bg-amber/25 hover:bg-amber/50"
                  }`}
                >
                  {isActive && (
                    <span
                      key={current}
                      className="absolute inset-0 bg-amber-dark transition-all duration-[3800ms] ease-linear"
                      style={{
                        animation: "autoProgress 3.8s linear forwards",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prev}
              aria-label="العرض السابق"
              className="grid size-9 place-items-center rounded-full border border-amber/30 bg-white/80 text-teal-deep transition-all hover:bg-amber hover:text-white"
            >
              <ChevronRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="العرض التالي"
              className="grid size-9 place-items-center rounded-full border border-amber/30 bg-white/80 text-teal-deep transition-all hover:bg-amber hover:text-white"
            >
              <ChevronLeft className="size-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
