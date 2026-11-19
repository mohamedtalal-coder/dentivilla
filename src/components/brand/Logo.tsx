import Image from "next/image";
import { site } from "@/lib/site";

export function Logo({
  src = "/images/logo.png",
  compact = false,
  light = false,
}: {
  src?: string;
  compact?: boolean;
  light?: boolean;
}) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-1 ring-amber/35">
        <Image src={src} alt="" width={40} height={40} className="size-full scale-[1.12] object-contain" />
      </span>
      <span className="leading-tight">
        <span className={`block text-sm font-bold sm:text-[15px] ${light ? "text-white" : "text-teal-deep"}`}>
          {site.doctor.name}
        </span>
        {!compact && (
          <span className={`hidden text-xs sm:block ${light ? "text-teal-light/75" : "text-muted"}`}>
            Dentivilla · تجميل وجراحة الأسنان
          </span>
        )}
      </span>
    </span>
  );
}
