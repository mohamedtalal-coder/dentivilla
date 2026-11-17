"use client";

import { useCallback, useId, useLayoutEffect, useRef, useState } from "react";
import {
  POSE_CLOSED,
  POSE_OPEN,
  POSE_SMILE,
  VIEW,
  aperturePath,
  easeInCubic,
  easeInOutCubic,
  easeInOutQuint,
  easeOutCubic,
  easeOutQuart,
  lerp,
  lerpPose,
  lowerPath,
  lowerTeethPath,
  segment,
  teethPath,
  toothLines,
  upperPath,
  wetLinePath,
  type LipPose,
} from "./lips";

/* -------------------------------------------------------------------------- */
/* Config                                                                     */
/* -------------------------------------------------------------------------- */

const STORAGE_KEY = "dentivilla-intro-seen";
const DURATION = 5600;
const REDUCED_DURATION = 320;
const LIP_SCALE = 1.52;

/* -------------------------------------------------------------------------- */
/* Session helpers                                                            */
/* -------------------------------------------------------------------------- */

function markSeen() {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* private mode */
  }
}

function wasSeen() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/* -------------------------------------------------------------------------- */
/* Timeline: computes the full animation state at a given millisecond.        */
/*                                                                            */
/*   0 –  600ms  Fade-in (lips materialise from transparent)                  */
/* 300 – 1800ms  Closed → Smile                                              */
/* 1800 – 2200ms  Hold the smile                                              */
/* 2200 – 3800ms  Smile → Open                                               */
/* 3800 – 4600ms  Portal reveals (hole in mask expands)                       */
/* 4400 – 5600ms  Lips fade out + portal grows to full screen                 */
/* 5000 – 5600ms  Overlay fades out                                           */
/* -------------------------------------------------------------------------- */

function poseAt(ms: number) {
  // Lip materialization fade-in
  const fadeIn = easeOutCubic(segment(ms, 0, 600));

  // Closed → Smile
  const smileT = easeInOutCubic(segment(ms, 300, 1800));
  // Smile → Open
  const openT = easeInOutCubic(segment(ms, 2200, 3800));

  // Portal reveal (the "looking into the mouth" effect)
  const revealT = easeInOutQuint(segment(ms, 3800, 4600));
  // Expand to full screen
  const expandT = easeInCubic(segment(ms, 4400, DURATION));
  // Lips fade out
  const lipsOut = easeInCubic(segment(ms, 4400, DURATION));
  // Teeth fade before lips disappear
  const teethFade = 1 - easeOutCubic(segment(ms, 3800, 4400));
  // Overlay fade
  const overlayFade = 1 - easeOutQuart(segment(ms, 5000, DURATION));

  // Build the interpolated pose
  const pose =
    openT > 0
      ? lerpPose(POSE_SMILE, POSE_OPEN, openT)
      : lerpPose(POSE_CLOSED, POSE_SMILE, smileT);

  // Portal hole: starts at zero, then expands through the mouth opening
  const hole = lerp(0.001, 1.2, revealT) + lerp(0, 50, expandT);

  return {
    pose,
    hole,
    lipsOpacity: fadeIn * (1 - lipsOut),
    overlayOpacity: overlayFade,
    teethMul: teethFade,
  };
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

type Phase = "play" | "reduced" | "off";

/**
 * Compute the initial phase synchronously during client render.
 * On the server we return "off" (SSR never shows the intro), which avoids
 * a brief flash of the overlay. On the client the initializer reads
 * sessionStorage synchronously.
 */
function getInitialPhase(): Phase {
  if (typeof window === "undefined") return "off";
  if (wasSeen()) return "off";
  const reduced = typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return reduced ? "reduced" : "play";
}

export function WelcomeIntro() {
  const reactId = useId().replace(/:/g, "");
  const [phase, setPhase] = useState<Phase>(getInitialPhase);
  const overlayRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  // SVG element refs
  const upperRef = useRef<SVGPathElement>(null);
  const lowerRef = useRef<SVGPathElement>(null);
  const lowerShadeRef = useRef<SVGPathElement>(null);
  const lowerClipRef = useRef<SVGPathElement>(null);
  const cavityRef = useRef<SVGPathElement>(null);
  const clipRef = useRef<SVGPathElement>(null);
  const teethRef = useRef<SVGPathElement>(null);
  const lowerTeethRef = useRef<SVGPathElement>(null);
  const toothLinesRef = useRef<SVGGElement>(null);
  const holeRef = useRef<SVGPathElement>(null);
  const highlightRef = useRef<SVGEllipseElement>(null);
  const upperHighlightRef = useRef<SVGEllipseElement>(null);
  const wetRef = useRef<SVGPathElement>(null);
  const lipsGroupRef = useRef<SVGGElement>(null);
  const innerShadowRef = useRef<SVGPathElement>(null);
  const upperShinePath = useRef<SVGPathElement>(null);
  const lowerShinePath = useRef<SVGPathElement>(null);

  const finish = useCallback(() => {
    markSeen();
    setPhase("off");
  }, []);

  /* ---- Animation loop ---- */
  useLayoutEffect(() => {
    if (phase !== "play" && phase !== "reduced") return;

    const overlay = overlayRef.current;
    const html = document.documentElement;
    const previousOverflow = html.style.overflow;
    html.style.overflow = "hidden";

    const apply = (
      pose: LipPose,
      holeScale: number,
      lipsOpacity: number,
      overlayOpacity: number,
      teethMul: number,
    ) => {
      const upper = upperPath(pose);
      const lower = lowerPath(pose);
      const aperture = aperturePath(pose);
      const teeth = teethPath(pose);
      const tLines = toothLines(pose);
      const lTeeth = lowerTeethPath(pose);

      upperRef.current?.setAttribute("d", upper);
      lowerRef.current?.setAttribute("d", lower);
      lowerShadeRef.current?.setAttribute("d", lower);
      lowerClipRef.current?.setAttribute("d", lower);
      cavityRef.current?.setAttribute("d", aperture);
      clipRef.current?.setAttribute("d", aperture);
      holeRef.current?.setAttribute("d", aperture);
      holeRef.current?.setAttribute(
        "transform",
        `translate(500 510) scale(${holeScale * LIP_SCALE}) translate(-500 -510)`,
      );

      // Upper lip shine (follows the cupid's bow)
      upperShinePath.current?.setAttribute("d", upper);
      // Lower lip shine (follows the lower contour)
      lowerShinePath.current?.setAttribute("d", lower);

      // Teeth
      teethRef.current?.setAttribute("d", teeth);
      teethRef.current?.setAttribute("opacity", String(pose.teeth.opacity * teethMul));

      // Tooth separation lines
      if (toothLinesRef.current) {
        const lines = toothLinesRef.current.children;
        for (let i = 0; i < lines.length; i++) {
          const lineEl = lines[i] as SVGPathElement;
          if (tLines[i]) {
            lineEl.setAttribute("d", tLines[i]);
            lineEl.setAttribute("opacity", String(pose.teeth.opacity * teethMul * 0.15));
          } else {
            lineEl.setAttribute("opacity", "0");
          }
        }
      }

      // Lower teeth
      if (lowerTeethRef.current) {
        lowerTeethRef.current.setAttribute("d", lTeeth || "M0 0");
        lowerTeethRef.current.setAttribute("opacity", lTeeth ? String(pose.teeth.opacity * teethMul * 0.5) : "0");
      }

      // Wet line
      wetRef.current?.setAttribute("d", wetLinePath(pose));

      // Inner shadow under upper lip
      if (innerShadowRef.current) {
        innerShadowRef.current.setAttribute("d", aperture);
        innerShadowRef.current.setAttribute("opacity", String(pose.innerShadowOpacity * teethMul));
      }

      // Lower lip highlight
      highlightRef.current?.setAttribute("cx", String(pose.highlight.cx));
      highlightRef.current?.setAttribute("cy", String(pose.highlight.cy));
      highlightRef.current?.setAttribute("rx", String(pose.highlight.rx));
      highlightRef.current?.setAttribute("ry", String(pose.highlight.ry));
      highlightRef.current?.setAttribute("opacity", String(pose.highlight.opacity));

      // Upper lip philtrum highlight
      upperHighlightRef.current?.setAttribute("cx", String(pose.upperHighlight.cx));
      upperHighlightRef.current?.setAttribute("cy", String(pose.upperHighlight.cy));
      upperHighlightRef.current?.setAttribute("rx", String(pose.upperHighlight.rx));
      upperHighlightRef.current?.setAttribute("ry", String(pose.upperHighlight.ry));
      upperHighlightRef.current?.setAttribute("opacity", String(pose.upperHighlight.opacity));

      if (lipsGroupRef.current) lipsGroupRef.current.style.opacity = String(lipsOpacity);
      if (overlay) overlay.style.opacity = String(overlayOpacity);
    };

    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;

      if (phase === "reduced") {
        const t = Math.min(1, elapsed / REDUCED_DURATION);
        apply(POSE_CLOSED, 0.001, 1 - t, 1 - easeOutCubic(t), 0);
        if (t < 1) rafRef.current = requestAnimationFrame(tick);
        else finish();
        return;
      }

      const { pose, hole, lipsOpacity, overlayOpacity, teethMul } = poseAt(elapsed);
      apply(pose, hole, lipsOpacity, overlayOpacity, teethMul);

      if (elapsed < DURATION) rafRef.current = requestAnimationFrame(tick);
      else finish();
    };

    apply(POSE_CLOSED, 0.001, 0, 1, 0);
    rafRef.current = requestAnimationFrame(tick);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("keydown", onKey);
      html.style.overflow = previousOverflow;
    };
  }, [phase, finish]);

  if (phase === "off") return null;

  /* ---- SVG IDs (guaranteed unique with useId) ---- */
  const maskId = `intro-portal-${reactId}`;
  const clipId = `intro-teeth-${reactId}`;
  const lowerClipId = `intro-lower-${reactId}`;
  const upperClipId = `intro-upper-${reactId}`;
  const filterId = `intro-soft-${reactId}`;
  const upperGrad = `intro-ug-${reactId}`;
  const upperGrad2 = `intro-ug2-${reactId}`;
  const lowerGrad = `intro-lg-${reactId}`;
  const lowerRadial = `intro-lr-${reactId}`;
  const cavityGrad = `intro-cg-${reactId}`;
  const innerShadowGrad = `intro-is-${reactId}`;
  const shineGrad = `intro-sh-${reactId}`;
  const lowerShineGrad = `intro-lsh-${reactId}`;
  const gumGrad = `intro-gum-${reactId}`;
  const showLips = phase !== "reduced";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-alabaster"
      role="dialog"
      aria-modal="true"
      aria-label="مقدمة الموقع"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          {/* ---- Upper lip gradient: deep rose tones with warmth ---- */}
          <linearGradient id={upperGrad} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#8b3a48" />
            <stop offset="30%" stopColor="#b25668" />
            <stop offset="60%" stopColor="#c97080" />
            <stop offset="100%" stopColor="#d4828e" />
          </linearGradient>

          {/* Upper lip shadow layer for depth */}
          <radialGradient id={upperGrad2} cx="50%" cy="80%" r="60%">
            <stop offset="0%" stopColor="#6b2838" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#6b2838" stopOpacity="0" />
          </radialGradient>

          {/* ---- Lower lip gradient: warmer, more luminous ---- */}
          <linearGradient id={lowerGrad} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#d88a94" />
            <stop offset="35%" stopColor="#c87884" />
            <stop offset="70%" stopColor="#ba6672" />
            <stop offset="100%" stopColor="#8b3a48" />
          </linearGradient>

          {/* Lower lip radial glow */}
          <radialGradient id={lowerRadial} cx="50%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#f0c8cc" stopOpacity="0.5" />
            <stop offset="40%" stopColor="#d4828e" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#6b2838" stopOpacity="0.3" />
          </radialGradient>

          {/* ---- Mouth cavity: dark interior ---- */}
          <radialGradient id={cavityGrad} cx="50%" cy="42%" r="65%">
            <stop offset="0%" stopColor="#200c10" />
            <stop offset="60%" stopColor="#140608" />
            <stop offset="100%" stopColor="#0a0304" />
          </radialGradient>

          {/* Inner shadow under upper lip */}
          <linearGradient id={innerShadowGrad} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#0a0304" stopOpacity="0.8" />
            <stop offset="40%" stopColor="#0a0304" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0a0304" stopOpacity="0" />
          </linearGradient>

          {/* ---- Upper lip specular shine ---- */}
          <linearGradient id={shineGrad} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#fce4e6" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#fce4e6" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#fce4e6" stopOpacity="0" />
          </linearGradient>

          {/* ---- Lower lip specular shine ---- */}
          <radialGradient id={lowerShineGrad} cx="50%" cy="35%" r="50%">
            <stop offset="0%" stopColor="#fce4e6" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#fce4e6" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#fce4e6" stopOpacity="0" />
          </radialGradient>

          {/* ---- Gum gradient ---- */}
          <linearGradient id={gumGrad} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#d4727e" />
            <stop offset="100%" stopColor="#a84858" />
          </linearGradient>

          {/* ---- Soft shadow filter ---- */}
          <filter id={filterId} x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="8" stdDeviation="18" floodColor="#0c4f4d" floodOpacity="0.10" />
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#4a1c26" floodOpacity="0.08" />
          </filter>

          {/* ---- Clip paths ---- */}
          <clipPath id={clipId}>
            <path ref={clipRef} d={aperturePath(POSE_CLOSED)} />
          </clipPath>
          <clipPath id={lowerClipId}>
            <path ref={lowerClipRef} d={lowerPath(POSE_CLOSED)} />
          </clipPath>
          <clipPath id={upperClipId}>
            <path d={upperPath(POSE_CLOSED)} />
          </clipPath>

          {/* ---- Portal mask: white everywhere except the growing hole ---- */}
          <mask id={maskId} maskUnits="userSpaceOnUse">
            <rect x="0" y="0" width={VIEW} height={VIEW} fill="white" />
            <path
              ref={holeRef}
              d={aperturePath(POSE_CLOSED)}
              fill="black"
              transform="translate(500 510) scale(0.001) translate(-500 -510)"
            />
          </mask>
        </defs>

        {/* Everything rendered inside the portal mask */}
        <g mask={`url(#${maskId})`}>
          {/* Background */}
          <rect width={VIEW} height={VIEW} fill="#faf9f6" />

          {showLips ? (
            <g
              ref={lipsGroupRef}
              filter={`url(#${filterId})`}
              transform={`translate(500 510) scale(${LIP_SCALE}) translate(-500 -510)`}
              style={{ opacity: 0 }}
            >
              {/* === LAYER 1: Dark mouth cavity === */}
              <path
                ref={cavityRef}
                d={aperturePath(POSE_CLOSED)}
                fill={`url(#${cavityGrad})`}
              />

              {/* === LAYER 2: Gum tissue visible behind teeth === */}
              <rect
                x="400" y="460" width="200" height="100"
                fill={`url(#${gumGrad})`}
                clipPath={`url(#${clipId})`}
                opacity="0.4"
              />

              {/* === LAYER 3: Upper teeth === */}
              <path
                ref={teethRef}
                d={teethPath(POSE_CLOSED)}
                fill="#f5f2ec"
                opacity="0"
                clipPath={`url(#${clipId})`}
              />

              {/* Tooth separation lines for realism */}
              <g ref={toothLinesRef} clipPath={`url(#${clipId})`}>
                {Array.from({ length: 7 }).map((_, i) => (
                  <path
                    key={i}
                    d="M0 0"
                    fill="none"
                    stroke="#c4b8a8"
                    strokeWidth="0.6"
                    opacity="0"
                  />
                ))}
              </g>

              {/* === LAYER 4: Lower teeth === */}
              <path
                ref={lowerTeethRef}
                d="M0 0"
                fill="#ebe8e2"
                opacity="0"
                clipPath={`url(#${clipId})`}
              />

              {/* === LAYER 5: Inner shadow under upper lip edge === */}
              <path
                ref={innerShadowRef}
                d={aperturePath(POSE_CLOSED)}
                fill={`url(#${innerShadowGrad})`}
                opacity="0"
                clipPath={`url(#${clipId})`}
              />

              {/* === LAYER 6: Upper lip === */}
              <path
                ref={upperRef}
                d={upperPath(POSE_CLOSED)}
                fill={`url(#${upperGrad})`}
              />
              {/* Upper lip depth shadow overlay */}
              <path
                d={upperPath(POSE_CLOSED)}
                fill={`url(#${upperGrad2})`}
              />
              {/* Upper lip specular highlight band */}
              <path
                ref={upperShinePath}
                d={upperPath(POSE_CLOSED)}
                fill={`url(#${shineGrad})`}
                style={{ mixBlendMode: "soft-light" }}
              />

              {/* Philtrum area highlight */}
              <ellipse
                ref={upperHighlightRef}
                cx={POSE_CLOSED.upperHighlight.cx}
                cy={POSE_CLOSED.upperHighlight.cy}
                rx={POSE_CLOSED.upperHighlight.rx}
                ry={POSE_CLOSED.upperHighlight.ry}
                fill="#fce4e6"
                opacity={POSE_CLOSED.upperHighlight.opacity}
                style={{ mixBlendMode: "soft-light" }}
              />

              {/* === LAYER 7: Lower lip === */}
              <path
                ref={lowerRef}
                d={lowerPath(POSE_CLOSED)}
                fill={`url(#${lowerGrad})`}
              />
              {/* Lower lip radial glow overlay */}
              <path
                ref={lowerShadeRef}
                d={lowerPath(POSE_CLOSED)}
                fill={`url(#${lowerRadial})`}
              />
              {/* Lower lip shine */}
              <path
                ref={lowerShinePath}
                d={lowerPath(POSE_CLOSED)}
                fill={`url(#${lowerShineGrad})`}
                style={{ mixBlendMode: "screen" }}
              />

              {/* Lower lip central highlight (the rounded shine) */}
              <ellipse
                ref={highlightRef}
                cx={POSE_CLOSED.highlight.cx}
                cy={POSE_CLOSED.highlight.cy}
                rx={POSE_CLOSED.highlight.rx}
                ry={POSE_CLOSED.highlight.ry}
                fill="#fce4e6"
                opacity={POSE_CLOSED.highlight.opacity}
                clipPath={`url(#${lowerClipId})`}
                style={{ mixBlendMode: "soft-light" }}
              />

              {/* === LAYER 8: Wet line (lip junction) === */}
              <path
                ref={wetRef}
                d={wetLinePath(POSE_CLOSED)}
                fill="none"
                stroke="#5a2230"
                strokeWidth="1.2"
                strokeLinecap="round"
                opacity="0.3"
              />
              {/* Thin bright line just above the wet line (moisture reflection) */}
              <path
                d={wetLinePath(POSE_CLOSED)}
                fill="none"
                stroke="#f0c8cc"
                strokeWidth="0.5"
                strokeLinecap="round"
                opacity="0.2"
                transform="translate(0 -1.5)"
              />
            </g>
          ) : null}
        </g>
      </svg>

      {/* Skip button */}
      <button
        type="button"
        onClick={finish}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 rounded-full border border-line bg-white/85 px-5 py-2 text-sm font-medium text-muted shadow-sm backdrop-blur-sm transition-colors hover:border-teal/40 hover:text-teal-deep"
      >
        تخطي المقدمة
      </button>
    </div>
  );
}
