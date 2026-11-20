"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { BookLink } from "@/components/booking/BookLink";
import { TEETH_BY_FDI } from "@/lib/teeth";

const Jaw3D = dynamic(() => import("@/components/dental/Jaw3D"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-teal-light/40" />,
});

const TYPE_LABEL = { incisor: "Incisor", canine: "Canine", premolar: "Premolar", molar: "Molar" } as const;

export function JawExplorer() {
  const [selected, setSelected] = useState("11");
  const tooth = TEETH_BY_FDI[selected];
  const onToggle = useCallback((fdi: string) => setSelected(fdi), []);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-line bg-gradient-to-b from-teal-light/50 via-white to-ivory">
        <Jaw3D className="aspect-[4/5] w-full sm:aspect-[5/4]" selected={[selected]} onToggle={onToggle} />
        <p className="pointer-events-none absolute inset-x-0 top-3 text-center text-xs text-muted">
          Click any tooth · Drag to rotate 3D model
        </p>
      </div>
      <aside className="card-soft rounded-[1.75rem] p-6 sm:p-8" aria-live="polite">
        <p className="text-sm text-muted">Tooth Number (FDI)</p>
        <p className="mt-1 font-mono text-4xl font-bold text-teal-deep">{tooth?.fdi}</p>
        <h2 className="mt-3 text-xl font-bold text-ink">{tooth?.nameAr}</h2>
        <p className="mt-3 leading-8 text-muted">{tooth?.roleAr}</p>
        <dl className="mt-6 grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-2xl bg-ivory p-3">
            <dt className="text-muted">Type</dt>
            <dd className="mt-1 font-semibold">{tooth ? TYPE_LABEL[tooth.type] : "—"}</dd>
          </div>
          <div className="rounded-2xl bg-ivory p-3">
            <dt className="text-muted">Arch</dt>
            <dd className="mt-1 font-semibold">{tooth?.arch === "upper" ? "Upper" : "Lower"}</dd>
          </div>
          <div className="rounded-2xl bg-ivory p-3">
            <dt className="text-muted">Side</dt>
            <dd className="mt-1 font-semibold">{tooth?.side === "right" ? "Right" : "Left"}</dd>
          </div>
        </dl>
        <p className="mt-6 text-sm leading-7 text-muted">
          The first digit identifies the quadrant (1: upper right, 2: upper left, 3: lower left, 4: lower right); the second digit indicates its position relative to the midline.
        </p>
        <BookLink intent={{ teeth: [selected] }} className="btn-primary mt-6 w-full">
          Book Appointment for This Tooth
        </BookLink>
      </aside>
    </div>
  );
}
