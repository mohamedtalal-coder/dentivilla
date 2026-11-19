import Image from "next/image";

/**
 * Brand panel built from the clinic's own 3D tooth renders or a custom image uploaded from the dashboard.
 */
export function PhilosophyPanel({
  className = "",
  src,
}: {
  className?: string;
  src?: string;
}) {
  const isCustomImage = src && !src.includes("incisor.webp");

  return (
    <figure
      className={`relative isolate overflow-hidden rounded-[2rem] bg-teal-deep shadow-lift ${className}`}
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_70%_20%,rgb(43_166_164/0.45),transparent_60%),radial-gradient(90%_60%_at_10%_90%,rgb(197_155_76/0.25),transparent_60%)]"
      />

      {isCustomImage ? (
        <div className="absolute inset-0">
          <Image
            src={src}
            alt="فلسفة عيادة Dentivilla"
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 450px, 90vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-teal-deep/90 via-teal-deep/30 to-transparent" />
        </div>
      ) : (
        <div aria-hidden className="absolute inset-x-0 top-[12%] flex items-end justify-center gap-2 sm:gap-4">
          <Image src="/images/teeth/canine.webp" alt="" width={120} height={350} className="h-40 w-auto opacity-80 sm:h-48" />
          <Image src="/images/teeth/incisor.webp" alt="" width={140} height={360} className="h-52 w-auto drop-shadow-[0_24px_30px_rgba(0,0,0,0.35)] sm:h-60" />
          <Image src="/images/teeth/premolar.webp" alt="" width={130} height={300} className="h-40 w-auto opacity-80 sm:h-48" />
        </div>
      )}

      <blockquote className="absolute inset-x-6 bottom-6 text-lg leading-8 font-medium text-white sm:inset-x-8 sm:bottom-8 sm:text-xl">
        «لا نصنع ابتسامة مكررة؛ نساعد ابتسامتك الحقيقية على الظهور.»
      </blockquote>
    </figure>
  );
}
