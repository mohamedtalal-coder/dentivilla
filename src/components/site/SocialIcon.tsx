import type { SocialKey } from "@/lib/site-settings";

/** Simple stroke glyphs for social networks, drawn to match the lucide icon style (24px grid, 2px stroke). */
export function SocialIcon({ network, className = "size-5" }: { network: SocialKey; className?: string }) {
  const common = {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };

  switch (network) {
    case "instagram":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common}>
          <path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V10H6.5v3.5H9V21h3.5v-7.5H15l.5-3.5h-3V7a1 1 0 0 1 1-1H15z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common}>
          <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" />
          <path d="M14 3c.4 2.6 2.2 4.4 5 4.6" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common}>
          <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
          <path d="m10.5 9.5 4 2.5-4 2.5z" fill="currentColor" />
        </svg>
      );
    case "x":
      return (
        <svg {...common}>
          <path d="M4 4l16 16" />
          <path d="M20 4l-6.6 7.2M10.6 12.8 4 20" />
        </svg>
      );
    case "snapchat":
      return (
        <svg {...common}>
          <path d="M12 3.5c-3 0-5 2.2-5 5v2.2l-1.8.6c-.5.2-.4.9.1 1 .9.3 1.6.8 1.6 1.4-.4 1.2-1.8 2.3-3.4 2.8.3.8 1.4 1 2.3 1.2.2.5.2 1.2.7 1.3 1-.2 2-.4 3 .2.9.6 1.6 1.3 2.5 1.3s1.6-.7 2.5-1.3c1-.6 2-.4 3-.2.5-.1.5-.8.7-1.3.9-.2 2-.4 2.3-1.2-1.6-.5-3-1.6-3.4-2.8 0-.6.7-1.1 1.6-1.4.5-.1.6-.8.1-1l-1.8-.6V8.5c0-2.8-2-5-5-5z" />
        </svg>
      );
  }
}
