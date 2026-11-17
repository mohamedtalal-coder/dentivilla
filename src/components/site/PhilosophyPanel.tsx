import Image from "next/image";

/**
 * Brand panel built from the clinic's own 3D tooth renders — used where a
 * clinic photograph would go until real photography of the clinic is available.
 */
export function PhilosophyPanel({ className = "" }: { className?: string }) {
  return (
    <figure
      className={`relative isolate overflow-hidden rounded-[2rem] bg-teal-deep shadow-lift ${className}`}
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_70%_20%,rgb(43_166_164/0.45),transparent_60%),radial-gradient(90%_60%_at_10%_90%,rgb(197_155_76/0.25),transparent_60%)]"
      />
      <div aria-hidden className="absolute inset-x-0 top-[12%] flex items-end justify-center gap-2 sm:gap-4">
        <Image src="/images/teeth/canine.webp" alt="" width={120} height={350} className="h-40 w-auto opacity-80 sm:h-48" />
        <Image src="/images/teeth/incisor.webp" alt="" width={140} height={360} className="h-52 w-auto drop-shadow-[0_24px_30px_rgba(0,0,0,0.35)] sm:h-60" />
        <Image src="/images/teeth/premolar.webp" alt="" width={130} height={300} className="h-40 w-auto opacity-80 sm:h-48" />
      </div>
      <blockquote className="absolute inset-x-6 bottom-6 text-lg leading-8 font-medium text-white sm:inset-x-8 sm:bottom-8 sm:text-xl">
        «لا نصنع ابتسامة مكررة؛ نساعد ابتسامتك الحقيقية على الظهور.»
      </blockquote>
    </figure>
  );
}
