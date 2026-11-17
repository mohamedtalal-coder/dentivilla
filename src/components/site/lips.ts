export type Pt = readonly [number, number];

export type LipPose = {
  /** Left commissure */
  L: Pt;
  /** Right commissure */
  R: Pt;
  /** Outer contour of upper lip (left-to-right, through cupid's bow) */
  outerUpper: Pt[];
  /** Inner edge of upper lip (the vermillion line, left-to-right) */
  innerUpper: Pt[];
  /** Inner edge of lower lip (left-to-right) */
  innerLower: Pt[];
  /** Outer contour of lower lip (left-to-right) */
  outerLower: Pt[];
  /** Specular highlight on lower lip */
  highlight: { cx: number; cy: number; rx: number; ry: number; opacity: number };
  /** Upper-lip highlight (philtrum area shine) */
  upperHighlight: { cx: number; cy: number; rx: number; ry: number; opacity: number };
  /** Teeth visibility */
  teeth: { y: number; h: number; opacity: number };
  /** Upper lip shadow depth (how much shadow under the upper lip) */
  innerShadowOpacity: number;
};

export const VIEW = 1000;

function p(x: number, y: number): Pt {
  return [x, y];
}

/* -------------------------------------------------------------------------- */
/* Three key poses                                                            */
/* -------------------------------------------------------------------------- */

/** Neutral, closed lips — natural rest position. */
export const POSE_CLOSED: LipPose = {
  L: p(370, 510),
  R: p(630, 510),
  // Upper lip: more pronounced cupid's bow, natural asymmetry
  outerUpper: [
    p(394, 500), // just right of left commissure
    p(420, 490), // rising toward peak
    p(448, 482), // left peak of cupid's bow
    p(468, 476), // left column of philtrum
    p(500, 484), // dip of cupid's bow (philtrum base)
    p(532, 476), // right column of philtrum
    p(552, 482), // right peak of cupid's bow
    p(580, 490), // descending
    p(606, 500), // approaching right commissure
  ],
  // Inner upper edge — the wet-dry border
  innerUpper: [
    p(400, 512),
    p(440, 514),
    p(500, 516),
    p(560, 514),
    p(600, 512),
  ],
  // Inner lower edge
  innerLower: [
    p(400, 514),
    p(440, 516),
    p(500, 518),
    p(560, 516),
    p(600, 514),
  ],
  // Lower lip: fuller, rounder shape
  outerLower: [
    p(398, 524),
    p(430, 540),
    p(466, 550),
    p(500, 554),
    p(534, 550),
    p(570, 540),
    p(602, 524),
  ],
  highlight: { cx: 500, cy: 538, rx: 68, ry: 10, opacity: 0.4 },
  upperHighlight: { cx: 500, cy: 480, rx: 32, ry: 6, opacity: 0.25 },
  teeth: { y: 513, h: 3, opacity: 0 },
  innerShadowOpacity: 0,
};

/** Natural closed-lip smile — wider, commissures rise, subtle teeth peek. */
export const POSE_SMILE: LipPose = {
  L: p(344, 494),
  R: p(656, 494),
  outerUpper: [
    p(376, 478),
    p(406, 466),
    p(436, 458),
    p(462, 452),
    p(500, 460),
    p(538, 452),
    p(564, 458),
    p(594, 466),
    p(624, 478),
  ],
  innerUpper: [
    p(386, 500),
    p(434, 502),
    p(500, 505),
    p(566, 502),
    p(614, 500),
  ],
  innerLower: [
    p(388, 508),
    p(436, 514),
    p(500, 518),
    p(564, 514),
    p(612, 508),
  ],
  outerLower: [
    p(382, 528),
    p(420, 546),
    p(460, 556),
    p(500, 560),
    p(540, 556),
    p(580, 546),
    p(618, 528),
  ],
  highlight: { cx: 500, cy: 542, rx: 82, ry: 12, opacity: 0.5 },
  upperHighlight: { cx: 500, cy: 458, rx: 36, ry: 7, opacity: 0.3 },
  teeth: { y: 502, h: 14, opacity: 0.65 },
  innerShadowOpacity: 0.3,
};

/** Open mouth — elegant parting of lips revealing teeth and dark cavity. */
export const POSE_OPEN: LipPose = {
  L: p(350, 498),
  R: p(650, 498),
  outerUpper: [
    p(382, 460),
    p(410, 442),
    p(440, 432),
    p(466, 426),
    p(500, 434),
    p(534, 426),
    p(560, 432),
    p(590, 442),
    p(618, 460),
  ],
  innerUpper: [
    p(390, 474),
    p(436, 468),
    p(500, 464),
    p(564, 468),
    p(610, 474),
  ],
  innerLower: [
    p(392, 536),
    p(438, 548),
    p(500, 556),
    p(562, 548),
    p(608, 536),
  ],
  outerLower: [
    p(386, 560),
    p(424, 580),
    p(464, 592),
    p(500, 596),
    p(536, 592),
    p(576, 580),
    p(614, 560),
  ],
  highlight: { cx: 500, cy: 574, rx: 72, ry: 11, opacity: 0.35 },
  upperHighlight: { cx: 500, cy: 434, rx: 34, ry: 8, opacity: 0.2 },
  teeth: { y: 468, h: 36, opacity: 0.95 },
  innerShadowOpacity: 0.7,
};

/* -------------------------------------------------------------------------- */
/* Math utilities                                                             */
/* -------------------------------------------------------------------------- */

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function lerpPt(a: Pt, b: Pt, t: number): Pt {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
}

function lerpPts(a: Pt[], b: Pt[], t: number): Pt[] {
  return a.map((pt, i) => lerpPt(pt, b[i], t));
}

export function lerpPose(a: LipPose, b: LipPose, t: number): LipPose {
  return {
    L: lerpPt(a.L, b.L, t),
    R: lerpPt(a.R, b.R, t),
    outerUpper: lerpPts(a.outerUpper, b.outerUpper, t),
    innerUpper: lerpPts(a.innerUpper, b.innerUpper, t),
    innerLower: lerpPts(a.innerLower, b.innerLower, t),
    outerLower: lerpPts(a.outerLower, b.outerLower, t),
    highlight: {
      cx: lerp(a.highlight.cx, b.highlight.cx, t),
      cy: lerp(a.highlight.cy, b.highlight.cy, t),
      rx: lerp(a.highlight.rx, b.highlight.rx, t),
      ry: lerp(a.highlight.ry, b.highlight.ry, t),
      opacity: lerp(a.highlight.opacity, b.highlight.opacity, t),
    },
    upperHighlight: {
      cx: lerp(a.upperHighlight.cx, b.upperHighlight.cx, t),
      cy: lerp(a.upperHighlight.cy, b.upperHighlight.cy, t),
      rx: lerp(a.upperHighlight.rx, b.upperHighlight.rx, t),
      ry: lerp(a.upperHighlight.ry, b.upperHighlight.ry, t),
      opacity: lerp(a.upperHighlight.opacity, b.upperHighlight.opacity, t),
    },
    teeth: {
      y: lerp(a.teeth.y, b.teeth.y, t),
      h: lerp(a.teeth.h, b.teeth.h, t),
      opacity: lerp(a.teeth.opacity, b.teeth.opacity, t),
    },
    innerShadowOpacity: lerp(a.innerShadowOpacity, b.innerShadowOpacity, t),
  };
}

/* -------------------------------------------------------------------------- */
/* Spline path generation                                                     */
/* -------------------------------------------------------------------------- */

/** Catmull-Rom spline through points, converted to cubic Béziers. */
export function smoothPath(pts: Pt[], closed = true): string {
  const n = pts.length;
  if (n < 2) return "";
  const tension = 0.22;
  const at = (i: number): Pt => {
    if (closed) return pts[(i + n) % n];
    return pts[Math.max(0, Math.min(n - 1, i))];
  };

  let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const cp1x = p1[0] + (p2[0] - p0[0]) * tension;
    const cp1y = p1[1] + (p2[1] - p0[1]) * tension;
    const cp2x = p2[0] - (p3[0] - p1[0]) * tension;
    const cp2y = p2[1] - (p3[1] - p1[1]) * tension;
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  if (closed) d += " Z";
  return d;
}

/* -------------------------------------------------------------------------- */
/* SVG path builders                                                          */
/* -------------------------------------------------------------------------- */

/** Full upper lip outline (outer top → right commissure → inner bottom → left commissure). */
export function upperPath(pose: LipPose) {
  const innerRtoL = [...pose.innerUpper].reverse();
  return smoothPath([pose.L, ...pose.outerUpper, pose.R, ...innerRtoL], true);
}

/** Full lower lip outline (inner top → right commissure → outer bottom → left commissure). */
export function lowerPath(pose: LipPose) {
  const outerRtoL = [...pose.outerLower].reverse();
  return smoothPath([pose.L, ...pose.innerLower, pose.R, ...outerRtoL], true);
}

/** Aperture = the opening between upper and lower inner edges. */
export function aperturePath(pose: LipPose) {
  const innerLowerRtoL = [...pose.innerLower].reverse();
  return smoothPath([pose.L, ...pose.innerUpper, pose.R, ...innerLowerRtoL], true);
}

/** Wet line — the junction between upper and lower lips. */
export function wetLinePath(pose: LipPose) {
  return smoothPath([pose.L, ...pose.innerUpper, pose.R], false);
}

/** Upper teeth — slightly curved row with individual tooth separations. */
export function teethPath(pose: LipPose) {
  const y = pose.teeth.y;
  const h = pose.teeth.h;
  const left = lerp(pose.L[0], pose.innerUpper[0][0], 0.2);
  const right = lerp(pose.R[0], pose.innerUpper[pose.innerUpper.length - 1][0], 0.2);
  const cx = 500;
  // Slightly curved arch for teeth top edge
  return [
    `M ${left.toFixed(2)} ${y.toFixed(2)}`,
    `Q ${cx} ${(y - h * 0.08).toFixed(2)} ${right.toFixed(2)} ${y.toFixed(2)}`,
    `L ${right.toFixed(2)} ${(y + h).toFixed(2)}`,
    `Q ${cx} ${(y + h + h * 0.15).toFixed(2)} ${left.toFixed(2)} ${(y + h).toFixed(2)}`,
    "Z",
  ].join(" ");
}

/** Tooth separation lines for realism. */
export function toothLines(pose: LipPose): string[] {
  const y = pose.teeth.y;
  const h = pose.teeth.h;
  if (h < 8) return [];
  // Central 6 teeth separations
  const positions = [452, 468, 484, 500, 516, 532, 548];
  return positions.map(
    (x) => `M ${x} ${(y + 1).toFixed(2)} L ${x} ${(y + h - 1).toFixed(2)}`,
  );
}

/** Lower teeth row (smaller, behind lower lip edge). */
export function lowerTeethPath(pose: LipPose) {
  const y = pose.innerLower[2][1]; // bottom of inner lower
  const h = Math.max(0, pose.teeth.h * 0.5);
  if (h < 4) return "";
  const left = lerp(pose.L[0], pose.innerLower[0][0], 0.3);
  const right = lerp(pose.R[0], pose.innerLower[pose.innerLower.length - 1][0], 0.3);
  return [
    `M ${left.toFixed(2)} ${(y - h).toFixed(2)}`,
    `Q 500 ${(y - h - h * 0.1).toFixed(2)} ${right.toFixed(2)} ${(y - h).toFixed(2)}`,
    `L ${right.toFixed(2)} ${y.toFixed(2)}`,
    `Q 500 ${(y + 2).toFixed(2)} ${left.toFixed(2)} ${y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

/* -------------------------------------------------------------------------- */
/* Easing functions                                                           */
/* -------------------------------------------------------------------------- */

export function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

export function easeInCubic(t: number) {
  return t * t * t;
}

export function easeOutQuart(t: number) {
  return 1 - (1 - t) ** 4;
}

export function easeInOutQuint(t: number) {
  return t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2;
}

export function clamp01(t: number) {
  return Math.min(1, Math.max(0, t));
}

export function segment(now: number, start: number, end: number) {
  return clamp01((now - start) / (end - start));
}
