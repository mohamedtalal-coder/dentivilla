import fs from "fs";
import path from "path";
import sharp from "sharp";
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
} from "./src/components/site/lips";

const LIP_SCALE = 1.52;
const DURATION = 3600; // Let's test a refined welcoming 3.6s duration

function poseAt(ms: number) {
  const fadeIn = easeOutCubic(segment(ms, 0, 400));
  const smileT = easeInOutCubic(segment(ms, 200, 1400));
  const openT = easeInOutCubic(segment(ms, 1700, 2700));
  const revealT = easeInOutQuint(segment(ms, 2700, 3300));
  const expandT = easeInCubic(segment(ms, 3100, DURATION));
  const lipsOut = easeInCubic(segment(ms, 3100, DURATION));
  const teethFade = 1 - easeOutCubic(segment(ms, 2700, 3200));

  const pose =
    openT > 0
      ? lerpPose(POSE_SMILE, POSE_OPEN, openT)
      : lerpPose(POSE_CLOSED, POSE_SMILE, smileT);

  const hole = lerp(0.001, 1.2, revealT) + lerp(0, 50, expandT);

  return {
    pose,
    hole,
    lipsOpacity: fadeIn * (1 - lipsOut),
    teethMul: teethFade,
  };
}

function renderSvg(ms: number): string {
  const { pose, hole, lipsOpacity, teethMul } = poseAt(ms);

  const upper = upperPath(pose);
  const lower = lowerPath(pose);
  const aperture = aperturePath(pose);
  const teeth = teethPath(pose);
  const tLines = toothLines(pose);
  const lTeeth = lowerTeethPath(pose);
  const wet = wetLinePath(pose);

  const maskId = "test-mask";
  const clipId = "test-clip";
  const lowerClipId = "test-lower-clip";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW} ${VIEW}" width="1000" height="1000" style="background:#faf9f6;">
    <defs>
      <linearGradient id="ug" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stop-color="#8b3a48" />
        <stop offset="30%" stop-color="#b25668" />
        <stop offset="60%" stop-color="#c97080" />
        <stop offset="100%" stop-color="#d4828e" />
      </linearGradient>
      <radialGradient id="ug2" cx="50%" cy="80%" r="60%">
        <stop offset="0%" stop-color="#6b2838" stop-opacity="0.35" />
        <stop offset="100%" stop-color="#6b2838" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="lg" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stop-color="#d88a94" />
        <stop offset="35%" stop-color="#c87884" />
        <stop offset="70%" stop-color="#ba6672" />
        <stop offset="100%" stop-color="#8b3a48" />
      </linearGradient>
      <radialGradient id="lr" cx="50%" cy="30%" r="65%">
        <stop offset="0%" stop-color="#f0c8cc" stop-opacity="0.5" />
        <stop offset="40%" stop-color="#d4828e" stop-opacity="0.15" />
        <stop offset="100%" stop-color="#6b2838" stop-opacity="0.3" />
      </radialGradient>
      <radialGradient id="cg" cx="50%" cy="42%" r="65%">
        <stop offset="0%" stop-color="#200c10" />
        <stop offset="60%" stop-color="#140608" />
        <stop offset="100%" stop-color="#0a0304" />
      </radialGradient>
      <linearGradient id="gum" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stop-color="#d4727e" />
        <stop offset="100%" stop-color="#a84858" />
      </linearGradient>
      <linearGradient id="shine" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stop-color="#fce4e6" stop-opacity="0.5" />
        <stop offset="50%" stop-color="#fce4e6" stop-opacity="0.12" />
        <stop offset="100%" stop-color="#fce4e6" stop-opacity="0" />
      </linearGradient>
      <radialGradient id="lsh" cx="50%" cy="35%" r="50%">
        <stop offset="0%" stop-color="#fce4e6" stop-opacity="0.45" />
        <stop offset="60%" stop-color="#fce4e6" stop-opacity="0.08" />
        <stop offset="100%" stop-color="#fce4e6" stop-opacity="0" />
      </radialGradient>
      <clipPath id="${clipId}">
        <path d="${aperture}" />
      </clipPath>
      <clipPath id="${lowerClipId}">
        <path d="${lower}" />
      </clipPath>
      <mask id="${maskId}">
        <rect x="0" y="0" width="${VIEW}" height="${VIEW}" fill="white" />
        <path d="${aperture}" fill="black" transform="translate(500 510) scale(${hole * LIP_SCALE}) translate(-500 -510)" />
      </mask>
    </defs>

    <g mask="url(#${maskId})">
      <rect width="${VIEW}" height="${VIEW}" fill="#faf9f6" />
      <g transform="translate(500 510) scale(${LIP_SCALE}) translate(-500 -510)" opacity="${lipsOpacity}">
        <path d="${aperture}" fill="url(#cg)" />
        <rect x="400" y="460" width="200" height="100" fill="url(#gum)" clip-path="url(#${clipId})" opacity="0.4" />
        <path d="${teeth}" fill="#f5f2ec" opacity="${pose.teeth.opacity * teethMul}" clip-path="url(#${clipId})" />
        <g clip-path="url(#${clipId})">
          ${tLines.map((d) => `<path d="${d}" fill="none" stroke="#c4b8a8" stroke-width="0.6" opacity="${pose.teeth.opacity * teethMul * 0.15}" />`).join("")}
        </g>
        ${lTeeth ? `<path d="${lTeeth}" fill="#ebe8e2" opacity="${pose.teeth.opacity * teethMul * 0.5}" clip-path="url(#${clipId})" />` : ""}
        <path d="${upper}" fill="url(#ug)" />
        <path d="${upper}" fill="url(#ug2)" />
        <path d="${upper}" fill="url(#shine)" />
        <ellipse cx="${pose.upperHighlight.cx}" cy="${pose.upperHighlight.cy}" rx="${pose.upperHighlight.rx}" ry="${pose.upperHighlight.ry}" fill="#fce4e6" opacity="${pose.upperHighlight.opacity}" />
        <path d="${lower}" fill="url(#lg)" />
        <path d="${lower}" fill="url(#lr)" />
        <path d="${lower}" fill="url(#lsh)" />
        <ellipse cx="${pose.highlight.cx}" cy="${pose.highlight.cy}" rx="${pose.highlight.rx}" ry="${pose.highlight.ry}" fill="#fce4e6" opacity="${pose.highlight.opacity}" clip-path="url(#${lowerClipId})" />
        <path d="${wet}" fill="none" stroke="#5a2230" stroke-width="1.2" stroke-linecap="round" opacity="0.3" />
        <path d="${wet}" fill="none" stroke="#f0c8cc" stroke-width="0.5" stroke-linecap="round" opacity="0.2" transform="translate(0 -1.5)" />
      </g>
    </g>
  </svg>`;
}

async function run() {
  const times = [200, 800, 1400, 2200, 2800, 3200];
  fs.mkdirSync(".intro-frames", { recursive: true });
  for (const t of times) {
    const svg = renderSvg(t);
    const buf = Buffer.from(svg);
    await sharp(buf).png().toFile(`.intro-frames/frame-${t}.png`);
    console.log(`Rendered frame-${t}.png`);
  }
}

run();
