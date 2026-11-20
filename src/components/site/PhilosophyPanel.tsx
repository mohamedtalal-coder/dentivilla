"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const AUTO_SLIDE_INTERVAL_MS = 4500;

/**
 * Brand panel built from the clinic's own 3D tooth renders or a multi-image carousel
 * uploaded from the dashboard.
 */
export function PhilosophyPanel({
  className = "",
  images,
  src,
}: {
  className?: string;
  images?: string[];
  src?: string;
}) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Normalize image list from props
  const validImages: string[] = Array.isArray(images) && images.length > 0
    ? images.filter(Boolean)
    : src && !src.includes("incisor.webp")
    ? [src]
    : [];

  const count = validImages.length;

  // Auto-advance slides when there is more than 1 image
  useEffect(() => {
    if (count <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % count);
    }, AUTO_SLIDE_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [count, isPaused, current]);

  function prev() {
    setCurrent((p) => (p - 1 + count) % count);
  }

  function next() {
    setCurrent((p) => (p + 1) % count);
  }

  return (
    <figure
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`group relative isolate overflow-hidden rounded-[2rem] bg-teal-deep shadow-lift ${className}`}
      aria-label="Dentivilla Philosophy"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_70%_20%,rgb(43_166_164/0.45),transparent_60%),radial-gradient(90%_60%_at_10%_90%,rgb(197_155_76/0.25),transparent_60%)]"
      />

      {count > 0 ? (
        <div className="absolute inset-0">
          {count > 1 ? (
            /* Multi-image sliding carousel */
            <div className="relative size-full overflow-hidden" dir="ltr">
              <div
                className="flex size-full transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${current * 100}%)` }}
              >
                {validImages.map((imgSrc, idx) => (
                  <div key={idx} className="relative size-full shrink-0">
                    <Image
                      src={imgSrc}
                      alt={`Dentivilla Clinic — Image ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 450px, 90vw"
                      priority={idx === 0}
                    />
                  </div>
                ))}
              </div>

              {/* Navigation Arrows */}
              <div className="pointer-events-none absolute inset-x-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-between">
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Previous image"
                  className="pointer-events-auto grid size-9 place-items-center rounded-full bg-teal-deep/70 text-white shadow-md backdrop-blur-md transition-all hover:bg-teal-deep hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Next image"
                  className="pointer-events-auto grid size-9 place-items-center rounded-full bg-teal-deep/70 text-white shadow-md backdrop-blur-md transition-all hover:bg-teal-deep hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>

              {/* Slide Indicator Dots */}
              <div
                className="absolute inset-x-0 bottom-24 z-20 flex items-center justify-center gap-1.5"
                role="group"
                aria-label="Philosophy image indicators"
              >
                {validImages.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrent(idx)}
                    aria-label={`Go to image ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === current
                        ? "w-6 bg-gold-soft"
                        : "w-2 bg-white/45 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* Single custom image */
            <Image
              src={validImages[0]}
              alt="Dentivilla Philosophy"
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 450px, 90vw"
              priority
            />
          )}

          {/* Legibility gradient for the quote */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-teal-deep/95 via-teal-deep/30 to-transparent" />
        </div>
      ) : (
        /* Default static 3D teeth render */
        <div aria-hidden className="absolute inset-x-0 top-[12%] flex items-end justify-center gap-2 sm:gap-4">
          <Image src="/images/teeth/canine.webp" alt="" width={120} height={350} className="h-40 w-auto opacity-80 sm:h-48" />
          <Image src="/images/teeth/incisor.webp" alt="" width={140} height={360} className="h-52 w-auto drop-shadow-[0_24px_30px_rgba(0,0,0,0.35)] sm:h-60" />
          <Image src="/images/teeth/premolar.webp" alt="" width={130} height={300} className="h-40 w-auto opacity-80 sm:h-48" />
        </div>
      )}

      <blockquote className="pointer-events-none absolute inset-x-6 bottom-6 text-lg leading-8 font-medium text-white sm:inset-x-8 sm:bottom-8 sm:text-xl z-20">
        “We don&apos;t create repetitive smiles; we help your true, natural smile emerge.”
      </blockquote>
    </figure>
  );
}
