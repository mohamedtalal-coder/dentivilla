import Image from "next/image";
import { site } from "@/lib/site";

/**
 * The source photo includes third-party signage on the right edge, so the
 * frame is locked to a portrait aspect and anchored left: at 5:6 the visible
 * width is ~85% of the image, which keeps that signage out of view at every
 * breakpoint.
 */
export function DoctorPortrait({
  src = "/images/doctor.jpg",
  preload = false,
}: {
  src?: string;
  preload?: boolean;
}) {
  return (
    <figure className="relative mx-auto w-full max-w-[480px]">
      <div className="relative aspect-[5/6] overflow-hidden rounded-[2rem] bg-ivory shadow-lift ring-1 ring-black/5">
        <Image
          src={src}
          alt={`${site.doctor.name} — ${site.doctor.title}`}
          fill
          sizes="(min-width: 1024px) 480px, 92vw"
          className="object-cover object-[12%_18%]"
          preload={preload}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-teal-deep/70 to-transparent" />
      </div>
      <figcaption className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 text-white">
        <span>
          <span className="block text-base font-bold">{site.doctor.name}</span>
          <span className="block text-sm text-white/80">{site.doctor.title}</span>
        </span>
        <span className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur-sm">
          {site.addressShort}
        </span>
      </figcaption>
    </figure>
  );
}
