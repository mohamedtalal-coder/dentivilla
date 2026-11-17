/**
 * Procedural dental anatomy for the 3D jaw and the rendered tooth artwork.
 *
 * All measurements are in millimetres and follow commonly cited average
 * permanent-tooth dimensions (mesiodistal crown width, buccolingual depth,
 * crown height, root length). Teeth are modelled in a local frame:
 *   x = mesiodistal, y = cervical → occlusal (CEJ at y = 0), z = lingual → labial.
 */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export type ToothForm = "central" | "lateral" | "canine" | "premolar" | "molar";

export type ToothSpec = {
  form: ToothForm;
  width: number; // mesiodistal crown width
  depth: number; // buccolingual crown depth
  crown: number; // crown height
  root: number; // root length
  roots: 1 | 2 | 3;
};

const U: Record<number, ToothSpec> = {
  1: { form: "central", width: 8.5, depth: 7, crown: 10.5, root: 13, roots: 1 },
  2: { form: "lateral", width: 6.5, depth: 6, crown: 9, root: 13, roots: 1 },
  3: { form: "canine", width: 7.5, depth: 8, crown: 10, root: 17, roots: 1 },
  4: { form: "premolar", width: 7, depth: 9, crown: 8.5, root: 14, roots: 1 },
  5: { form: "premolar", width: 6.5, depth: 9, crown: 8.5, root: 14, roots: 1 },
  6: { form: "molar", width: 10, depth: 11, crown: 7.5, root: 12.5, roots: 3 },
  7: { form: "molar", width: 9, depth: 11, crown: 7, root: 11.5, roots: 3 },
  8: { form: "molar", width: 8.5, depth: 10, crown: 6.5, root: 11, roots: 3 },
};

const L: Record<number, ToothSpec> = {
  1: { form: "central", width: 5, depth: 6, crown: 9, root: 12.5, roots: 1 },
  2: { form: "lateral", width: 5.5, depth: 6.5, crown: 9.5, root: 14, roots: 1 },
  3: { form: "canine", width: 7, depth: 7.5, crown: 11, root: 16, roots: 1 },
  4: { form: "premolar", width: 7, depth: 7.5, crown: 8.5, root: 14, roots: 1 },
  5: { form: "premolar", width: 7, depth: 8, crown: 8, root: 14.5, roots: 1 },
  6: { form: "molar", width: 11, depth: 10.5, crown: 7.5, root: 14, roots: 2 },
  7: { form: "molar", width: 10.5, depth: 10, crown: 7, root: 13, roots: 2 },
  8: { form: "molar", width: 10, depth: 9.5, crown: 7, root: 11, roots: 2 },
};

export function specForFdi(fdi: string): ToothSpec {
  const quadrant = Number(fdi[0]);
  const position = Number(fdi[1]);
  return (quadrant <= 2 ? U : L)[position];
}

/* -------------------------------------------------------------------------- */
/* Tooth body                                                                 */
/* -------------------------------------------------------------------------- */

type Ring = { y: number; ax: number; bzLabial: number; bzLingual: number };

const ENAMEL = new THREE.Color("#f2ebdc");
const ENAMEL_EDGE = new THREE.Color("#e3e7e8"); // slight translucency at incisal/cusp tips
const DENTIN_ROOT = new THREE.Color("#e2cda3");
const CEJ_BAND = new THREE.Color("#eadcbc");

/** Silhouette key rings for the crown and (single) root, from apex to occlusal table. */
function profileFor(spec: ToothSpec, trunkOnly: boolean): Ring[] {
  const W = spec.width / 2;
  const D = spec.depth / 2;
  const C = spec.crown;
  const R = spec.root;
  const r = (y: number, ax: number, bz: number, lingual = 1): Ring => ({
    y,
    ax: ax * W,
    bzLabial: bz * D,
    bzLingual: bz * D * lingual,
  });

  const root: Ring[] = trunkOnly
    ? [r(-0.27 * R, 0.5, 0.62), r(-0.2 * R, 0.66, 0.78), r(-0.08 * R, 0.76, 0.84)]
    : [
        r(-R, 0.07, 0.08),
        r(-0.93 * R, 0.2, 0.24),
        r(-0.72 * R, 0.36, 0.5),
        r(-0.4 * R, 0.52, 0.72),
        r(-0.12 * R, 0.62, 0.82),
      ];

  switch (spec.form) {
    case "central":
    case "lateral":
      return [
        ...root,
        r(0, 0.68, 0.86, 0.9),
        r(0.2 * C, 0.8, 0.98, 0.92),
        r(0.5 * C, 0.94, 0.8, 0.7),
        r(0.8 * C, 1, 0.5, 0.42),
        r(0.96 * C, 0.98, 0.26, 0.22),
      ];
    case "canine":
      return [
        ...root,
        r(0, 0.68, 0.86, 0.92),
        r(0.25 * C, 0.95, 1, 0.95),
        r(0.55 * C, 1, 0.86, 0.8),
        r(0.76 * C, 0.86, 0.6, 0.55),
      ];
    case "premolar":
      return [
        ...root,
        r(0, 0.7, 0.8),
        r(0.3 * C, 0.96, 1),
        r(0.62 * C, 1, 0.98),
        r(0.8 * C, 0.92, 0.9),
      ];
    case "molar":
      return [
        ...root,
        r(0, 0.8, 0.82),
        r(0.3 * C, 0.98, 1),
        r(0.62 * C, 1, 0.98),
        r(0.8 * C, 0.95, 0.92),
      ];
  }
}

/** Height offset of the occlusal/incisal table — cusps, cusp tips, fossae. */
function occlusalRelief(spec: ToothSpec, x: number, z: number): number {
  const W = spec.width / 2;
  const D = spec.depth / 2;
  const C = spec.crown;
  const g = (cx: number, cz: number, sx: number, sz: number) =>
    Math.exp(-(((x - cx) / sx) ** 2 + ((z - cz) / sz) ** 2));

  switch (spec.form) {
    case "central":
    case "lateral":
      // straight incisal edge with very soft mamelon undulation
      return 0.05 * C + 0.15 * Math.cos((x / W) * Math.PI * 1.5) * 0.3;
    case "canine":
      // single pointed cusp; mesial slope shorter than distal
      return 0.24 * C * Math.max(0, 1 - Math.abs(x + 0.08 * W) / (W * 1.05)) ** 1.3;
    case "premolar":
      // buccal cusp taller than lingual, central groove between them
      return (
        0.2 * C * g(0, 0.45 * D, 0.55 * W, 0.42 * D) +
        0.13 * C * g(0, -0.45 * D, 0.55 * W, 0.42 * D) -
        0.05 * C * g(0, 0, 0.9 * W, 0.18 * D)
      );
    case "molar": {
      const cusp = (cx: number, cz: number, h: number) => h * C * g(cx, cz, 0.42 * W, 0.42 * D);
      return (
        cusp(-0.45 * W, 0.45 * D, 0.17) +
        cusp(0.45 * W, 0.45 * D, 0.15) +
        cusp(-0.45 * W, -0.45 * D, 0.16) +
        cusp(0.45 * W, -0.45 * D, 0.13) -
        0.08 * C * g(0, 0, 0.35 * W, 0.35 * D)
      );
    }
  }
}

function superellipse(theta: number, n: number) {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return [Math.sign(c) * Math.abs(c) ** (2 / n), Math.sign(s) * Math.abs(s) ** (2 / n)];
}

function colorForHeight(spec: ToothSpec, y: number, out: THREE.Color) {
  if (y < -0.6) return out.copy(DENTIN_ROOT);
  if (y < 0.4) return out.copy(DENTIN_ROOT).lerp(CEJ_BAND, (y + 0.6) / 1);
  const t = Math.min(1, y / spec.crown);
  out.copy(CEJ_BAND).lerp(ENAMEL, Math.min(1, t * 3));
  if (t > 0.72) out.lerp(ENAMEL_EDGE, (t - 0.72) / 0.5);
  return out;
}

/** Builds a closed, smooth surface from interpolated rings plus an occlusal cap. */
function lathedBody(
  spec: ToothSpec,
  rings: Ring[],
  opts: { segments: number; capRings: number; exponent: number; relief: boolean },
) {
  const curve = new THREE.CatmullRomCurve3(
    rings.map((ring) => new THREE.Vector3(ring.ax, ring.y, ring.bzLabial)),
    false,
    "centripetal",
  );
  const lingualCurve = new THREE.CatmullRomCurve3(
    rings.map((ring) => new THREE.Vector3(ring.ax, ring.y, ring.bzLingual)),
    false,
    "centripetal",
  );
  const sideSteps = Math.max(24, rings.length * 6);
  const side = curve.getPoints(sideSteps);
  const sideLingual = lingualCurve.getPoints(sideSteps);

  const seg = opts.segments;
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const color = new THREE.Color();

  const top = side[side.length - 1];
  const topLingual = sideLingual[sideLingual.length - 1];
  const topY = top.y;

  // bottom pole
  positions.push(0, side[0].y - 0.15, 0);
  colorForHeight(spec, side[0].y, color);
  colors.push(color.r, color.g, color.b);

  const ringCount = side.length + opts.capRings;
  for (let i = 0; i < ringCount; i += 1) {
    const isCap = i >= side.length;
    const capT = isCap ? (i - side.length + 1) / (opts.capRings + 1) : 0;
    const p = isCap ? top : side[i];
    const pl = isCap ? topLingual : sideLingual[i];
    const shrink = isCap ? Math.cos((capT * Math.PI) / 2) : 1;
    for (let j = 0; j < seg; j += 1) {
      const theta = (j / seg) * Math.PI * 2;
      const [ex, ez] = superellipse(theta, opts.exponent);
      const x = ex * p.x * shrink;
      const z = ez * (ez >= 0 ? p.z : pl.z) * shrink;
      let y = p.y;
      if (isCap) y = topY + Math.sin((capT * Math.PI) / 2) * 0.35;
      if (opts.relief && (isCap || i >= side.length - 3)) {
        const weight = isCap ? 1 : 1 - (side.length - 1 - i) / 3;
        y += occlusalRelief(spec, x, z) * Math.max(0, weight);
      }
      positions.push(x, y, z);
      colorForHeight(spec, y, color);
      colors.push(color.r, color.g, color.b);
    }
  }
  // top pole
  positions.push(0, topY + 0.35 + (opts.relief ? occlusalRelief(spec, 0, 0) : 0), 0);
  colorForHeight(spec, topY + 1, color);
  colors.push(color.r, color.g, color.b);

  const ringStart = (i: number) => 1 + i * seg;
  for (let j = 0; j < seg; j += 1) {
    indices.push(0, ringStart(0) + j, ringStart(0) + ((j + 1) % seg));
  }
  for (let i = 0; i < ringCount - 1; i += 1) {
    for (let j = 0; j < seg; j += 1) {
      const a = ringStart(i) + j;
      const b = ringStart(i) + ((j + 1) % seg);
      const c = ringStart(i + 1) + j;
      const d = ringStart(i + 1) + ((j + 1) % seg);
      indices.push(a, d, b, a, c, d);
    }
  }
  const last = ringStart(ringCount - 1);
  const pole = positions.length / 3 - 1;
  for (let j = 0; j < seg; j += 1) {
    indices.push(last + ((j + 1) % seg), last + j, pole);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** A separate tapered root (for multi-rooted molars), hanging from the root trunk. */
function rootGeometry(spec: ToothSpec, length: number, ax: number, bz: number) {
  const rootSpec: ToothSpec = { ...spec, form: "premolar" };
  const rings: Ring[] = [
    { y: -length, ax: ax * 0.12, bzLabial: bz * 0.12, bzLingual: bz * 0.12 },
    { y: -0.9 * length, ax: ax * 0.35, bzLabial: bz * 0.35, bzLingual: bz * 0.35 },
    { y: -0.6 * length, ax: ax * 0.7, bzLabial: bz * 0.7, bzLingual: bz * 0.7 },
    { y: -0.25 * length, ax: ax * 0.92, bzLabial: bz * 0.92, bzLingual: bz * 0.92 },
    { y: 0, ax, bzLabial: bz, bzLingual: bz },
  ];
  return lathedBody(rootSpec, rings, { segments: 20, capRings: 2, exponent: 2, relief: false });
}

const geometryCache = new Map<string, THREE.BufferGeometry>();

/** Full tooth (crown + root system) in local tooth coordinates. Cached per form/size. */
export function toothGeometry(spec: ToothSpec, detail: "high" | "medium" = "medium") {
  const key = `${spec.form}-${spec.width}-${spec.depth}-${spec.crown}-${spec.root}-${spec.roots}-${detail}`;
  const cached = geometryCache.get(key);
  if (cached) return cached;

  const segments = detail === "high" ? 72 : 40;
  const exponent = spec.form === "molar" ? 2.6 : spec.form === "premolar" ? 2.25 : 2.05;
  const multiRoot = spec.roots > 1;
  const body = lathedBody(spec, profileFor(spec, multiRoot), {
    segments,
    capRings: detail === "high" ? 12 : 7,
    exponent,
    relief: true,
  });

  if (!multiRoot) {
    geometryCache.set(key, body);
    return body;
  }

  const W = spec.width / 2;
  const D = spec.depth / 2;
  const trunkBottom = -0.2 * spec.root;
  const parts: THREE.BufferGeometry[] = [body];
  const placements: { x: number; z: number; len: number; ax: number; bz: number; tiltX: number; tiltZ: number }[] =
    spec.roots === 3
      ? [
          // mesiobuccal, distobuccal, palatal
          { x: -0.36 * W, z: 0.3 * D, len: 0.78, ax: 0.3 * W, bz: 0.4 * D, tiltX: -0.16, tiltZ: 0.1 },
          { x: 0.36 * W, z: 0.3 * D, len: 0.72, ax: 0.28 * W, bz: 0.36 * D, tiltX: 0.16, tiltZ: 0.1 },
          { x: 0, z: -0.38 * D, len: 0.85, ax: 0.36 * W, bz: 0.34 * D, tiltX: 0, tiltZ: -0.22 },
        ]
      : [
          // mesial, distal
          { x: -0.4 * W, z: 0, len: 0.8, ax: 0.3 * W, bz: 0.6 * D, tiltX: -0.14, tiltZ: 0 },
          { x: 0.4 * W, z: 0, len: 0.74, ax: 0.28 * W, bz: 0.56 * D, tiltX: 0.16, tiltZ: 0 },
        ];

  for (const placement of placements) {
    const root = rootGeometry(spec, spec.root * placement.len, placement.ax, placement.bz);
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(placement.x, trunkBottom + 0.6, placement.z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-placement.tiltZ, 0, placement.tiltX)),
      new THREE.Vector3(1, 1, 1),
    );
    root.applyMatrix4(matrix);
    parts.push(root);
  }

  const merged = mergeGeometries(parts, false) ?? body;
  merged.computeBoundingSphere();
  geometryCache.set(key, merged);
  return merged;
}

/** Crown only (e.g. an implant-supported restoration), closed at the cervical margin. */
export function crownGeometry(spec: ToothSpec) {
  const rings = profileFor(spec, true).filter((ring) => ring.y >= 0);
  const first = rings[0];
  const margin: Ring = {
    y: -0.8,
    ax: first.ax * 0.72,
    bzLabial: first.bzLabial * 0.72,
    bzLingual: first.bzLingual * 0.72,
  };
  const exponent = spec.form === "molar" ? 2.6 : spec.form === "premolar" ? 2.25 : 2.05;
  return lathedBody(spec, [margin, ...rings], { segments: 72, capRings: 12, exponent, relief: true });
}

/* -------------------------------------------------------------------------- */
/* Dental arches                                                              */
/* -------------------------------------------------------------------------- */

export type ArchName = "upper" | "lower";

export type PlacedTooth = {
  fdi: string;
  spec: ToothSpec;
  /** position of the CEJ centre, in arch coordinates (mm) */
  position: THREE.Vector3;
  /** rotation about the vertical axis so the labial face points outward */
  yaw: number;
  /** labial crown inclination (radians) */
  inclination: number;
  /** distance along the arch from the midline (mm), and the tooth's own half width */
  arcCenter: number;
  arcHalfWidth: number;
};

/** Half-arch centre line from the midline backwards (x ≥ 0, z anterior positive), in mm. */
const ARCH_CURVES: Record<ArchName, THREE.Vector3[]> = {
  upper: [
    [0, 26],
    [9, 23.6],
    [16.2, 18.6],
    [20.6, 11],
    [23.6, 2],
    [25.6, -8],
    [27, -18],
    [28, -28],
    [28.6, -34],
  ].map(([x, z]) => new THREE.Vector3(x, 0, z)),
  lower: [
    [0, 22.5],
    [6.8, 20.8],
    [12.8, 16.4],
    [17.6, 9.4],
    [20.8, 1],
    [22.8, -9],
    [24.2, -19],
    [25.2, -29],
    [25.8, -35],
  ].map(([x, z]) => new THREE.Vector3(x, 0, z)),
};

const archCurveCache = new Map<ArchName, THREE.CatmullRomCurve3>();

export function archCurve(arch: ArchName) {
  let curve = archCurveCache.get(arch);
  if (!curve) {
    curve = new THREE.CatmullRomCurve3(ARCH_CURVES[arch], false, "centripetal");
    archCurveCache.set(arch, curve);
  }
  return curve;
}

/**
 * Places the 16 teeth of an arch on its curve by cumulative mesiodistal width.
 * Arch-local frame: x to the patient's left when viewed from the front is
 * NOT assumed here — callers map quadrants to sides.
 */
export function placeArch(arch: ArchName): PlacedTooth[] {
  const curve = archCurve(arch);
  const length = curve.getLength();
  const quadrants = arch === "upper" ? [1, 2] : [4, 3];
  const placed: PlacedTooth[] = [];

  quadrants.forEach((quadrant, sideIndex) => {
    // Viewed from the front, the patient's right (Q1/Q4) is on the viewer's left (x < 0).
    // The upper arch is later flipped about the z-axis (x → −x, y → −y), so it is
    // laid out mirrored here and lands on the correct side after the flip.
    const rightSide = arch === "upper" ? 1 : -1;
    const sideSign = sideIndex === 0 ? rightSide : -rightSide;
    let cursor = 0.15; // half the midline contact gap
    for (let position = 1; position <= 8; position += 1) {
      const fdi = `${quadrant}${position}`;
      const spec = specForFdi(fdi);
      const center = cursor + spec.width / 2;
      cursor += spec.width + 0.2;
      const u = Math.min(1, center / length);
      const point = curve.getPointAt(u);
      const tangent = curve.getTangentAt(u);
      // outward (labial/buccal) direction in the xz-plane
      const outward = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      if (outward.z < 0 && point.z > 15) outward.negate();
      const yaw = Math.atan2(outward.x, outward.z) * sideSign;
      const inclination =
        spec.form === "central" || spec.form === "lateral" ? 0.2 : spec.form === "canine" ? 0.12 : 0.04;
      placed.push({
        fdi,
        spec,
        position: new THREE.Vector3(point.x * sideSign, 0, point.z),
        yaw,
        inclination,
        arcCenter: center,
        arcHalfWidth: spec.width / 2,
      });
    }
  });
  return placed;
}

/**
 * Gingiva as a swept horseshoe following the arch, with scalloped margins:
 * the gingival line dips at each tooth's zenith and rises into the
 * interdental papillae between teeth.
 */
export function gingivaGeometry(arch: ArchName) {
  const curve = archCurve(arch);
  const length = curve.getLength();
  const teeth = placeArch(arch).filter((tooth) => tooth.position.x >= 0);
  const halfLength = Math.min(length, teeth[teeth.length - 1].arcCenter + teeth[teeth.length - 1].arcHalfWidth + 1.2);

  const along = 220;
  const around = 28;
  const positions: number[] = [];
  const indices: number[] = [];

  const marginAt = (s: number) => {
    let nearest = teeth[0];
    for (const tooth of teeth) {
      if (Math.abs(tooth.arcCenter - s) < Math.abs(nearest.arcCenter - s)) nearest = tooth;
    }
    const d = Math.min(1, Math.abs(s - nearest.arcCenter) / nearest.arcHalfWidth);
    // zenith ~0.6 mm above CEJ, papilla ~3.4 mm above CEJ
    return 0.6 + 2.8 * d ** 2.2;
  };
  const depthAt = (s: number) => {
    let nearest = teeth[0];
    for (const tooth of teeth) {
      if (Math.abs(tooth.arcCenter - s) < Math.abs(nearest.arcCenter - s)) nearest = tooth;
    }
    return nearest.spec.depth / 2;
  };

  const bottom = -13;
  for (let i = 0; i <= along; i += 1) {
    const s = -halfLength + (2 * halfLength * i) / along;
    const sAbs = Math.abs(s);
    const u = Math.min(1, sAbs / length);
    const p = curve.getPointAt(u);
    const t = curve.getTangentAt(u);
    const sign = s < 0 ? -1 : 1;
    const point = new THREE.Vector3(p.x * sign, 0, p.z);
    let outward = new THREE.Vector3(-t.z, 0, t.x).normalize();
    if (outward.z < 0 && p.z > 15) outward.negate();
    outward = new THREE.Vector3(outward.x * sign, 0, outward.z);

    // taper the ends of the horseshoe so it closes neatly behind the last molar
    const endFade = Math.min(1, (halfLength - sAbs) / 4);
    const halfThickness = (depthAt(sAbs) + 1.6) * (0.35 + 0.65 * Math.sqrt(Math.max(0, endFade)));
    const top = bottom + (marginAt(sAbs) - bottom) * (0.25 + 0.75 * Math.sqrt(Math.max(0, endFade)));
    const cy = (top + bottom) / 2;
    const hy = (top - bottom) / 2;

    for (let j = 0; j < around; j += 1) {
      const phi = (j / around) * Math.PI * 2;
      const [ex, ey] = superellipse(phi, 3.2);
      const lateral = ex * halfThickness;
      const y = cy + ey * hy;
      positions.push(point.x + outward.x * lateral, y, point.z + outward.z * lateral);
    }
  }

  for (let i = 0; i < along; i += 1) {
    for (let j = 0; j < around; j += 1) {
      const a = i * around + j;
      const b = i * around + ((j + 1) % around);
      const c = (i + 1) * around + j;
      const d = (i + 1) * around + ((j + 1) % around);
      indices.push(a, c, d, a, d, b);
    }
  }

  // end caps
  const capStart = positions.length / 3;
  const firstCenter = new THREE.Vector3();
  const lastCenter = new THREE.Vector3();
  for (let j = 0; j < around; j += 1) {
    firstCenter.add(new THREE.Vector3(positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]));
    const k = (along * around + j) * 3;
    lastCenter.add(new THREE.Vector3(positions[k], positions[k + 1], positions[k + 2]));
  }
  firstCenter.divideScalar(around);
  lastCenter.divideScalar(around);
  positions.push(firstCenter.x, firstCenter.y, firstCenter.z, lastCenter.x, lastCenter.y, lastCenter.z);
  for (let j = 0; j < around; j += 1) {
    indices.push(capStart, (j + 1) % around, j);
    indices.push(capStart + 1, along * around + j, along * around + ((j + 1) % around));
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/* -------------------------------------------------------------------------- */
/* Implant (fixture + abutment + crown) for the implant artwork               */
/* -------------------------------------------------------------------------- */

export function implantFixtureGeometry() {
  const points: THREE.Vector2[] = [];
  const length = 12;
  const radius = 2.1;
  const pitch = 0.9;
  points.push(new THREE.Vector2(0, -length - 0.4));
  for (let y = -length; y <= -0.6; y += pitch / 2) {
    const taper = Math.min(1, (y + length) / 3.5);
    const thread = Math.round((y + length) / (pitch / 2)) % 2 === 0 ? 0 : 0.42;
    points.push(new THREE.Vector2((radius - 0.45 + thread) * (0.55 + 0.45 * taper), y));
  }
  points.push(new THREE.Vector2(radius, -0.3), new THREE.Vector2(radius * 0.92, 0));
  // abutment
  points.push(new THREE.Vector2(radius * 0.8, 0.2), new THREE.Vector2(radius * 0.72, 2.6), new THREE.Vector2(0, 2.8));
  const geometry = new THREE.LatheGeometry(points, 64);
  geometry.computeVertexNormals();
  return geometry;
}
