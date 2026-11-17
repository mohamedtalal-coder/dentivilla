"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { Sparkles, ArrowLeft } from "lucide-react";

const STORAGE_KEY = "dentivilla-intro-seen";
const DURATION = 3600; // 3.6s snappy, cinematic, elegant
const REDUCED_DURATION = 350;

function wasSeen() {
  if (typeof window === "undefined") return false;
  try {
    // Check URL override: ?intro=1 or ?preview=1 forces it to play
    const params = new URLSearchParams(window.location.search);
    if (params.has("intro") || params.has("preview")) {
      return false;
    }
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* private mode fallback */
  }
}

export function WelcomeIntro({ forcePlay = false }: { forcePlay?: boolean }) {
  const reactId = useId().replace(/:/g, "");
  const [phase, setPhase] = useState<"loading" | "play" | "reduced" | "off">(() => {
    if (typeof window === "undefined") return "loading";
    if (!forcePlay && wasSeen()) return "off";
    const reduced = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return reduced ? "reduced" : "play";
  });
  const [progress, setProgress] = useState(0); // 0 to 1

  const containerRef = useRef<HTMLDivElement>(null);
  const portalHoleRef = useRef<SVGPathElement>(null);
  const rafRef = useRef<number>(0);

  const finish = useCallback(() => {
    markSeen();
    setPhase("off");
    document.documentElement.style.overflow = "";
  }, []);

  // Client hydration check if initialized as "loading" on SSR
  useEffect(() => {
    if (phase !== "loading") return;
    const shouldSkip = !forcePlay && wasSeen();
    if (shouldSkip) {
      // Defer state update outside of synchronous render phase
      requestAnimationFrame(() => setPhase("off"));
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => setPhase(reduced ? "reduced" : "play"));
  }, [forcePlay, phase]);

  // Main animation driver
  useEffect(() => {
    if (phase !== "play" && phase !== "reduced") return;

    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";

    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;

      if (phase === "reduced") {
        const t = Math.min(1, elapsed / REDUCED_DURATION);
        setProgress(t);
        if (t >= 1) {
          finish();
        } else {
          rafRef.current = requestAnimationFrame(tick);
        }
        return;
      }

      const t = Math.min(1, elapsed / DURATION);
      setProgress(t);

      // Dynamically update SVG portal mask scale during portal reveal (t: 0.65 to 1.0)
      if (portalHoleRef.current) {
        if (t < 0.62) {
          // Closed portal
          portalHoleRef.current.setAttribute(
            "transform",
            "translate(512 485) scale(0.001) translate(-512 -485)"
          );
        } else {
          // Expand portal through the mouth aperture
          const portalT = (t - 0.62) / 0.38; // 0 to 1
          // Exponential easing for dramatic zoom-in
          const scale = 0.001 + Math.pow(portalT, 3.2) * 55;
          portalHoleRef.current.setAttribute(
            "transform",
            `translate(512 485) scale(${scale.toFixed(3)}) translate(-512 -485)`
          );
        }
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        finish();
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("keydown", onKey);
      html.style.overflow = prevOverflow;
    };
  }, [phase, finish]);

  if (phase === "off" || phase === "loading") {
    // When inactive, render a discreet helper pill at bottom-left in dev mode or for users
    return (
      <aside className="fixed bottom-4 left-4 z-40 hidden sm:block">
        <button
          type="button"
          onClick={() => {
            sessionStorage.removeItem(STORAGE_KEY);
            setPhase("play");
            setProgress(0);
          }}
          className="group flex items-center gap-2 rounded-full border border-teal/20 bg-white/90 px-4 py-2 text-xs font-medium text-teal-deep shadow-sm backdrop-blur-md transition-all hover:border-teal hover:bg-teal hover:text-white"
          title="إعادة تشغيل ترحيب العيادة"
        >
          <Sparkles className="size-3.5 text-amber transition-transform group-hover:rotate-12 group-hover:text-white" />
          <span>مشاهدة ترحيب العيادة</span>
        </button>
      </aside>
    );
  }

  // Animation timeline values calculated from progress (0 to 1)
  // 1. Initial State (0 to 0.20): Closed lips + warm welcome message
  // 2. The Smile (0.20 to 0.55): Lips blossom into radiant smile
  // 3. The Hold (0.55 to 0.65): Luminous dental shine
  // 4. Portal Open & Website Reveal (0.65 to 1.0): Camera zooms through smile into site

  // Smile morph opacity (0 = closed lips, 1 = smiling lips)
  const smileOpacity = Math.min(1, Math.max(0, (progress - 0.2) / 0.35));

  // Subtle camera push-in / dolly zoom effect
  const zoomScale = 1 + Math.pow(progress, 2.5) * 0.45;

  // Header welcome text fade out as smile takes center stage
  const textOpacity = progress < 0.25 ? 1 : Math.max(0, 1 - (progress - 0.25) / 0.25);

  // Overlay fadeout at the very end
  const overlayOpacity = progress > 0.88 ? Math.max(0, 1 - (progress - 0.88) / 0.12) : 1;

  const maskId = `welcome-portal-mask-${reactId}`;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-between overflow-hidden bg-alabaster select-none"
      style={{ opacity: overlayOpacity }}
      role="dialog"
      aria-modal="true"
      aria-label="مقدمة ترحيب Dentivilla"
    >
      {/* SVG Mask defining the mouth aperture portal */}
      <svg className="absolute inset-0 h-0 w-0" aria-hidden="true">
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" width="100%" height="100%">
            {/* White = keep intro visible */}
            <rect width="100%" height="100%" fill="white" />
            {/* Black hole = punches through into the website beneath */}
            <g transform="translate(0, 0)">
              <path
                ref={portalHoleRef}
                d="M 195 435 C 330 405 694 405 829 435 C 750 535 512 565 274 535 Z"
                fill="black"
                transform="translate(512 485) scale(0.001) translate(-512 -485)"
              />
            </g>
          </mask>
        </defs>
      </svg>

      {/* Ambient warm clinic atmosphere */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(197,155,76,0.08)_0%,rgba(250,249,246,0)_65%)]"
        aria-hidden="true"
      />

      {/* Top Welcoming Header — establishes this as a warm hospitality welcome, NOT a loading screen */}
      <header
        className="relative z-20 pt-8 text-center transition-opacity duration-500 sm:pt-12"
        style={{ opacity: textOpacity }}
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-amber/30 bg-amber-light/80 px-4 py-1 text-xs font-semibold text-amber-dark backdrop-blur-sm">
          <Sparkles className="size-3 text-amber" />
          عيادة Dentivilla لطب وتجميل الأسنان
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-teal-deep sm:text-3xl">
          ابتسامة ترحب بك
        </h1>
        <p className="mt-1 text-xs font-medium text-muted sm:text-sm">
          د. محمد ياسر الجبالي · استشاري تجميل وزراعة الأسنان
        </p>
      </header>

      {/* Central Visual: Hyper-realistic human lips transitioning into a radiant smile */}
      <div className="relative z-10 my-auto flex items-center justify-center">
        <div
          className="relative aspect-square w-[340px] sm:w-[460px] md:w-[540px] lg:w-[600px] overflow-hidden rounded-full shadow-[0_20px_60px_-15px_rgba(12,79,77,0.12)]"
          style={{
            transform: `scale(${zoomScale})`,
            transition: "transform 0.05s linear",
          }}
        >
          {/* Layer 1: Closed Natural Lips */}
          <div className="absolute inset-0">
            <Image
              src="/images/intro/lips-closed.jpg"
              alt="شفاه طبيعية متناسقة"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 340px, 600px"
            />
          </div>

          {/* Layer 2: Radiant Natural Smile (cross-fades seamlessly over closed lips) */}
          <div
            className="absolute inset-0 transition-opacity duration-75"
            style={{ opacity: smileOpacity }}
          >
            <Image
              src="/images/intro/lips-smile.jpg"
              alt="ابتسامة طبيعية مشرقة"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 340px, 600px"
            />
          </div>

          {/* Luminous dental enamel gleam during the smile hold */}
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_48%,rgba(255,255,255,0.45)_0%,rgba(255,255,255,0)_40%)] mix-blend-overlay transition-opacity duration-300"
            style={{
              opacity: progress > 0.45 && progress < 0.75 ? 1 : 0,
            }}
          />

          {/* Golden portal rim light as the transition approaches */}
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(197,155,76,0.3)_0%,rgba(12,79,77,0)_60%)] mix-blend-screen transition-opacity duration-500"
            style={{
              opacity: progress > 0.6 ? Math.min(1, (progress - 0.6) / 0.25) : 0,
            }}
          />
        </div>
      </div>

      {/* Bottom Bar: Elegant Skip / Enter Action */}
      <footer className="relative z-20 pb-8 sm:pb-12">
        <button
          type="button"
          onClick={finish}
          className="group inline-flex items-center gap-2 rounded-full border border-line bg-white/90 px-6 py-2.5 text-sm font-semibold text-teal-deep shadow-md backdrop-blur-md transition-all hover:border-teal/40 hover:bg-teal-light/60 hover:text-teal-deep"
        >
          <span>تخطي والبدء</span>
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
        </button>
      </footer>
    </div>
  );
}
