"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  beforeSrc?: string;
  afterSrc?: string;
  beforeAlt?: string;
  afterAlt?: string;
  caption?: string;
  preload?: boolean;
};

/**
 * Before/after comparison. In LTR reading order, "Before" sits on the left and
 * "After" on the right. The divider position indicates the percentage of the frame
 * showing the "Before" photo.
 */
export function BeforeAfter({
  beforeSrc = "/images/smile_before.jpg",
  afterSrc = "/images/smile_after.jpg",
  beforeAlt = "Teeth before treatment",
  afterAlt = "Teeth after treatment",
  caption,
  preload = false,
}: Props) {
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  const updateFromClientX = useCallback((clientX: number) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  }, []);

  function onKeyDown(event: React.KeyboardEvent) {
    const step = event.shiftKey ? 10 : 2;
    const moves: Record<string, (p: number) => number> = {
      ArrowLeft: (p) => p - step,
      ArrowRight: (p) => p + step,
      ArrowDown: (p) => p - step,
      ArrowUp: (p) => p + step,
      PageDown: (p) => p - 10,
      PageUp: (p) => p + 10,
      Home: () => 0,
      End: () => 100,
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    setPosition((p) => Math.min(100, Math.max(0, move(p))));
  }

  const beforeShare = Math.round(position);

  return (
    <figure className="w-full">
      <div
        ref={frameRef}
        className={`comparison-surface relative aspect-[16/10] overflow-hidden rounded-[1.75rem] bg-neutral-200 shadow-lift ring-1 ring-black/5 sm:aspect-[16/9] ${
          dragging ? "cursor-grabbing" : "cursor-ew-resize"
        }`}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
          updateFromClientX(event.clientX);
        }}
        onPointerMove={(event) => {
          if (dragging) updateFromClientX(event.clientX);
        }}
        onPointerUp={(event) => {
          event.currentTarget.releasePointerCapture(event.pointerId);
          setDragging(false);
        }}
        onPointerCancel={() => setDragging(false)}
      >
        {/* Base layer: After photo on right */}
        <Image src={afterSrc} alt={afterAlt} fill sizes="(min-width: 1024px) 896px, 100vw" className="object-cover" preload={preload} />
        
        {/* Top layer: Before photo on left clipped to position */}
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
          <Image src={beforeSrc} alt={beforeAlt} fill sizes="(min-width: 1024px) 896px, 100vw" className="object-cover" />
        </div>

        {/* Badges */}
        <span
          className={`pointer-events-none absolute top-4 left-4 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm transition-opacity ${
            position < 12 ? "opacity-0" : "opacity-100"
          }`}
        >
          Before
        </span>
        <span
          className={`pointer-events-none absolute top-4 right-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-teal-deep backdrop-blur-sm transition-opacity ${
            position > 88 ? "opacity-0" : "opacity-100"
          }`}
        >
          After
        </span>

        {/* Divider bar */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_12px_rgba(0,0,0,0.35)]"
          style={{ left: `${position}%` }}
        />
        <button
          type="button"
          role="slider"
          aria-label="Before and after comparison slider"
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={beforeShare}
          aria-valuetext={`Before ${beforeShare}%, After ${100 - beforeShare}%`}
          onKeyDown={onKeyDown}
          className="absolute top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-teal-deep shadow-lift ring-1 ring-black/5 transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-teal/40"
          style={{ left: `clamp(24px, ${position}%, calc(100% - 24px))` }}
        >
          <span className="flex items-center" aria-hidden>
            <ChevronLeft className="size-4" />
            <ChevronRight className="-ms-1 size-4" />
          </span>
        </button>
      </div>
      {caption && <figcaption className="mt-4 text-center text-sm text-muted">{caption}</figcaption>}
    </figure>
  );
}
