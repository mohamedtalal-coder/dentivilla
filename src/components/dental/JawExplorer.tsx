"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { BookLink } from "@/components/booking/BookLink";
import { TEETH_BY_FDI } from "@/lib/teeth";

const Jaw3D = dynamic(() => import("@/components/dental/Jaw3D"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-teal-light/40" />,
});

const TYPE_LABEL = { incisor: "قاطع", canine: "ناب", premolar: "ضاحك", molar: "ضرس (رحى)" } as const;

export function JawExplorer() {
  const [selected, setSelected] = useState("11");
  const tooth = TEETH_BY_FDI[selected];
  const onToggle = useCallback((fdi: string) => setSelected(fdi), []);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-line bg-gradient-to-b from-teal-light/50 via-white to-ivory">
        <Jaw3D className="aspect-[4/5] w-full sm:aspect-[5/4]" selected={[selected]} onToggle={onToggle} />
        <p className="pointer-events-none absolute inset-x-0 top-3 text-center text-xs text-muted">
          اضغط على أي سن · اسحب لتدوير النموذج
        </p>
      </div>
      <aside className="card-soft rounded-[1.75rem] p-6 sm:p-8" aria-live="polite">
        <p className="text-sm text-muted">رقم السن (FDI)</p>
        <p className="mt-1 font-mono text-4xl font-bold text-teal-deep">{tooth?.fdi}</p>
        <h2 className="mt-3 text-xl font-bold text-ink">{tooth?.nameAr}</h2>
        <p className="mt-3 leading-8 text-muted">{tooth?.roleAr}</p>
        <dl className="mt-6 grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-2xl bg-ivory p-3">
            <dt className="text-muted">النوع</dt>
            <dd className="mt-1 font-semibold">{tooth ? TYPE_LABEL[tooth.type] : "—"}</dd>
          </div>
          <div className="rounded-2xl bg-ivory p-3">
            <dt className="text-muted">الفك</dt>
            <dd className="mt-1 font-semibold">{tooth?.arch === "upper" ? "العلوي" : "السفلي"}</dd>
          </div>
          <div className="rounded-2xl bg-ivory p-3">
            <dt className="text-muted">الجانب</dt>
            <dd className="mt-1 font-semibold">{tooth?.side === "right" ? "الأيمن" : "الأيسر"}</dd>
          </div>
        </dl>
        <p className="mt-6 text-sm leading-7 text-muted">
          الرقم الأول يدل على ربع الفك (١ علوي أيمن، ٢ علوي أيسر، ٣ سفلي أيسر، ٤ سفلي أيمن)، والثاني على ترتيب السن من
          المنتصف.
        </p>
        <BookLink intent={{ teeth: [selected] }} className="btn-primary mt-6 w-full">
          احجز موعداً لهذا السن
        </BookLink>
      </aside>
    </div>
  );
}
