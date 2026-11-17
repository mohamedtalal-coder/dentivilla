type Props = {
  step: number;
  title: string;
  text: string;
  accent?: "teal" | "gold";
};

const DIGITS = "٠١٢٣٤٥٦٧٨٩";

/**
 * Molar silhouette (viewBox 300×420): four-cusp crown, cervical constriction
 * at y≈240, root trunk to the furcation at y≈292, two roots to y≈410.
 */
const TOOTH_PATH =
  "M 38 78 C 36 34, 72 16, 106 22 C 128 26, 136 42, 150 42 C 164 42, 172 26, 194 22 " +
  "C 228 16, 264 34, 262 78 C 266 140, 262 200, 248 240 C 242 262, 240 300, 236 338 " +
  "C 232 378, 218 410, 203 410 C 188 410, 182 384, 178 352 C 172 316, 164 292, 150 292 " +
  "C 136 292, 128 316, 122 352 C 118 384, 112 410, 97 410 C 82 410, 68 378, 64 338 " +
  "C 60 300, 58 262, 52 240 C 38 200, 34 140, 38 78 Z";

/** Scalloped cemento-enamel junction: dips at the root centres, rises between them. */
const CEJ_PATH = "M 50 238 C 78 226, 104 252, 150 236 C 196 252, 222 226, 250 238";

/**
 * A step card shaped as a tooth. Lit from the top-left: enamel crown with
 * cusp ridges, buccal groove and translucent cusp tips; dentin-toned roots
 * with furcation shadow. Title and text sit in the crown, the step on the root.
 */
export function ToothJourneyCard({ step, title, text, accent = "teal" }: Props) {
  const gold = accent === "gold";
  const id = `tooth-card-${step}`;
  const shade = gold ? "120 86 34" : "12 64 62";

  return (
    <li className="group relative z-10 aspect-[248/424] w-[52vw] max-w-[210px] shrink-0 snap-center list-none sm:mx-auto sm:w-full">
      <svg
        viewBox="26 0 248 424"
        aria-hidden
        className="absolute inset-0 size-full overflow-visible transition-transform duration-500 ease-out group-hover:-translate-y-1.5"
        style={{ filter: `drop-shadow(0 14px 18px rgb(${shade} / 0.14)) drop-shadow(0 2px 3px rgb(${shade} / 0.08))` }}
      >
        <defs>
          {/* enamel → cervical → dentin */}
          <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fdfefe" />
            <stop offset="0.3" stopColor={gold ? "#fbf7ee" : "#f6faf9"} />
            <stop offset="0.52" stopColor={gold ? "#f3e9d3" : "#eaf1ef"} />
            <stop offset="0.58" stopColor="#efe4ca" />
            <stop offset="0.8" stopColor="#e5d4ae" />
            <stop offset="1" stopColor="#d6c093" />
          </linearGradient>
          {/* light from the top-left: bright mesial edge, darker distal side */}
          <linearGradient id={`${id}-side`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={`rgb(${shade})`} stopOpacity="0.1" />
            <stop offset="0.07" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="0.3" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="0.72" stopColor={`rgb(${shade})`} stopOpacity="0" />
            <stop offset="1" stopColor={`rgb(${shade})`} stopOpacity="0.2" />
          </linearGradient>
          {/* translucent, slightly blue-grey cusp tips */}
          <linearGradient id={`${id}-incisal`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c9d8de" stopOpacity="0.55" />
            <stop offset="0.07" stopColor="#c9d8de" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={`${id}-furcation`} cx="150" cy="300" r="60" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={`rgb(${shade})`} stopOpacity="0.28" />
            <stop offset="1" stopColor={`rgb(${shade})`} stopOpacity="0" />
          </radialGradient>
          {/* soft shadow band at the cervical constriction */}
          <linearGradient id={`${id}-cervical`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.46" stopColor={`rgb(${shade})`} stopOpacity="0" />
            <stop offset="0.565" stopColor={`rgb(${shade})`} stopOpacity="0.09" />
            <stop offset="0.68" stopColor={`rgb(${shade})`} stopOpacity="0" />
          </linearGradient>
          <radialGradient id={`${id}-gloss`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          {/* fine enamel grain */}
          <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={step * 7} />
            <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0 0.22  0 0 0 0.06 0" />
          </filter>
          <filter id={`${id}-soft`}>
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
          <clipPath id={`${id}-clip`}>
            <path d={TOOTH_PATH} />
          </clipPath>
        </defs>

        {/* contact shadows under the apices */}
        <ellipse cx="97" cy="415" rx="20" ry="3.5" fill={`rgb(${shade})`} opacity="0.14" />
        <ellipse cx="203" cy="415" rx="20" ry="3.5" fill={`rgb(${shade})`} opacity="0.14" />

        <path d={TOOTH_PATH} fill={`url(#${id}-body)`} />

        <g clipPath={`url(#${id}-clip)`}>
          <rect x="0" y="0" width="300" height="420" filter={`url(#${id}-grain)`} />
          <rect x="0" y="0" width="300" height="420" fill={`url(#${id}-side)`} />
          <rect x="0" y="0" width="300" height="420" fill={`url(#${id}-incisal)`} />
          <rect x="0" y="0" width="300" height="420" fill={`url(#${id}-cervical)`} />

          {/* cusp triangular ridges converging toward the central fossa */}
          <g stroke="#ffffff" strokeLinecap="round" fill="none" filter={`url(#${id}-soft)`}>
            <path d="M 92 30 C 100 52, 118 66, 138 72" strokeWidth="5" opacity="0.8" />
            <path d="M 208 30 C 200 52, 182 66, 162 72" strokeWidth="5" opacity="0.55" />
            <path d="M 58 52 C 74 34, 104 30, 128 42" strokeWidth="3.5" opacity="0.9" />
            <path d="M 172 42 C 196 30, 226 34, 242 52" strokeWidth="3.5" opacity="0.6" />
          </g>

          {/* buccal groove: engraved line (shadow + offset highlight) ending in a pit */}
          <path d="M 150 46 C 148 62, 151 78, 149 94" stroke={`rgb(${shade})`} strokeOpacity="0.2" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <path d="M 147.6 50 C 145.6 64, 148.6 78, 146.6 90" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <ellipse cx="149" cy="98" rx="2.6" ry="3.4" fill={`rgb(${shade})`} opacity="0.16" />

          {/* specular highlights: broad sheen + tight hotspot */}
          <ellipse cx="92" cy="118" rx="40" ry="72" fill={`url(#${id}-gloss)`} opacity="0.7" transform="rotate(-10 92 118)" />
          <ellipse cx="74" cy="92" rx="5" ry="20" fill="#ffffff" opacity="0.95" transform="rotate(-8 74 92)" filter={`url(#${id}-soft)`} />

          {/* cemento-enamel junction */}
          <path d={CEJ_PATH} stroke="#b9a271" strokeOpacity="0.45" strokeWidth="1.6" fill="none" />
          <path d={CEJ_PATH} stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1" fill="none" transform="translate(0 -1.6)" />

          {/* furcation and root anatomy */}
          <rect x="0" y="0" width="300" height="420" fill={`url(#${id}-furcation)`} />
          <g stroke={`rgb(${shade})`} strokeOpacity="0.12" strokeWidth="1.4" fill="none" strokeLinecap="round">
            <path d="M 92 286 C 90 320, 92 360, 97 396" />
            <path d="M 208 286 C 210 320, 208 360, 203 396" />
          </g>
          <g stroke="#ffffff" strokeOpacity="0.45" strokeWidth="2" fill="none" strokeLinecap="round">
            <path d="M 72 290 C 70 320, 74 358, 84 390" />
            <path d="M 188 300 C 186 330, 190 362, 196 392" />
          </g>
        </g>

        {/* fine definition edge instead of a heavy outline */}
        <path d={TOOTH_PATH} fill="none" stroke={`rgb(${shade})`} strokeOpacity="0.16" strokeWidth="1.2" />
        <path
          d={TOOTH_PATH}
          fill="none"
          stroke={gold ? "#c59b4c" : "#2ba6a4"}
          strokeWidth="2"
          opacity="0"
          className="transition-opacity duration-300 group-hover:opacity-60"
        />
      </svg>

      {/* Crown: title and text */}
      <div className="absolute inset-x-[14%] top-[16%] bottom-[46%] flex flex-col items-center justify-center text-center transition-transform duration-500 ease-out group-hover:-translate-y-1.5">
        <h3 className="text-[15px] leading-snug font-bold text-teal-deep">{title}</h3>
        <p className="mt-1.5 text-xs leading-[1.65] text-muted">{text}</p>
      </div>

      {/* Root trunk: step number */}
      <div className="absolute inset-x-0 top-[61%] flex justify-center transition-transform duration-500 ease-out group-hover:-translate-y-1.5">
        <span
          className={`grid size-8 place-items-center rounded-full text-sm font-bold text-white shadow-[0_4px_10px_-2px_rgb(0_0_0/0.25)] ring-2 ring-white/80 ${
            gold ? "bg-amber" : "bg-teal-deep"
          }`}
        >
          <span className="sr-only">الخطوة </span>
          {DIGITS[step]}
        </span>
      </div>
    </li>
  );
}
