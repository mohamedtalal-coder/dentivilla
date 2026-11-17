"use client";

import dynamic from "next/dynamic";
import { useState, useSyncExternalStore } from "react";
import { RotateCcw, X } from "lucide-react";
import { LOWER_LEFT, LOWER_RIGHT, TEETH_BY_FDI, UPPER_LEFT, UPPER_RIGHT } from "@/lib/teeth";

const Jaw3D = dynamic(() => import("@/components/dental/Jaw3D"), {
  ssr: false,
  loading: () => <JawPlaceholder label="جارٍ تحميل نموذج الفك…" />,
});

function JawPlaceholder({ label }: { label: string }) {
  return (
    <div className="grid h-full place-items-center bg-gradient-to-b from-teal-light/60 to-ivory text-sm text-muted">
      <span className="flex items-center gap-2">
        <span className="size-2 animate-pulse rounded-full bg-teal" />
        {label}
      </span>
    </div>
  );
}

function subscribeNoop() {
  return () => {};
}

function detectWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Viewer's perspective (patient facing you): patient's right is on your left. */
const ROWS = [
  { label: "الفك العلوي", left: UPPER_RIGHT, right: UPPER_LEFT },
  { label: "الفك السفلي", left: LOWER_RIGHT, right: LOWER_LEFT },
];

export function ToothSelector({
  selected,
  onToggle,
  onClear,
  error,
}: {
  selected: string[];
  onToggle: (fdi: string) => void;
  onClear: () => void;
  error?: string;
}) {
  const webgl = useSyncExternalStore(subscribeNoop, detectWebGL, () => true);
  const [hovered, setHovered] = useState<string | null>(null);
  const focus = hovered ?? selected[selected.length - 1] ?? null;
  const focusTooth = focus ? TEETH_BY_FDI[focus] : null;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
      <div className="relative overflow-hidden rounded-[1.5rem] border border-line bg-gradient-to-b from-teal-light/50 via-white to-ivory">
        <div className="aspect-[4/5] max-h-[620px] w-full sm:aspect-[5/4] lg:aspect-[4/5]">
          {webgl ? (
            <Jaw3D className="size-full" selected={selected} onToggle={onToggle} onHoverChange={setHovered} />
          ) : (
            <JawPlaceholder label="متصفحك لا يدعم العرض ثلاثي الأبعاد — استخدم المخطط بالأسفل" />
          )}
        </div>
        {/* physical sides: the patient faces you, so their right is on your left */}
        <div dir="ltr" className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2 text-xs">
          <span className="rounded-full bg-white/85 px-3 py-1 text-muted backdrop-blur">يمين المريض</span>
          <span className="rounded-full bg-white/85 px-3 py-1 text-muted backdrop-blur">يسار المريض</span>
        </div>
        <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-end justify-between gap-2">
          <p
            aria-live="polite"
            className="pointer-events-none max-w-[75%] rounded-2xl bg-white/90 px-4 py-2 text-sm shadow-card backdrop-blur"
          >
            {focusTooth ? (
              <>
                <span className="font-mono font-semibold text-teal-deep">{focusTooth.fdi}</span>
                <span className="text-muted"> — {focusTooth.nameAr}</span>
              </>
            ) : (
              <span className="text-muted">اضغط على السن لتحديده · اسحب لتدوير النموذج</span>
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-5">
      {/* Accessible chart: works with keyboard and screen readers, and mirrors the 3D selection */}
      <fieldset className="grid gap-3" aria-describedby={error ? "teeth-error" : undefined}>
        <legend className="field-label">أو اختر من المخطط (ترقيم FDI)</legend>
        {ROWS.map((row) => (
          <div key={row.label} className="grid gap-1.5">
            <span className="text-xs text-muted">{row.label}</span>
            <div dir="ltr" className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1">
              {[...row.left, ...row.right].map((fdi, index) => {
                const isSelected = selected.includes(fdi);
                return (
                  <button
                    key={fdi}
                    type="button"
                    aria-pressed={isSelected}
                    aria-label={`${fdi} — ${TEETH_BY_FDI[fdi]?.nameAr}`}
                    title={TEETH_BY_FDI[fdi]?.nameAr}
                    onClick={() => onToggle(fdi)}
                    onMouseEnter={() => setHovered(fdi)}
                    onMouseLeave={() => setHovered(null)}
                    className={`h-9 rounded-lg border font-mono text-[11px] font-semibold transition-colors sm:text-xs ${
                      index === 8 ? "ms-1.5" : ""
                    } ${
                      isSelected
                        ? "border-teal bg-teal text-white"
                        : "border-line bg-white text-ink hover:border-teal/50 hover:bg-teal-light"
                    }`}
                  >
                    {fdi}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </fieldset>

      <div className="flex flex-wrap items-center gap-2">
        {selected.length === 0 ? (
          <span className="text-sm text-muted">لم تحدد أي سن بعد.</span>
        ) : (
          selected.map((fdi) => (
            <button
              key={fdi}
              type="button"
              onClick={() => onToggle(fdi)}
              className="chip border-teal/30 bg-teal-light text-teal-deep hover:border-teal"
              aria-label={`إزالة السن ${fdi}`}
            >
              <span className="font-mono">{fdi}</span>
              <span className="hidden sm:inline">{TEETH_BY_FDI[fdi]?.nameAr}</span>
              <X className="size-3.5" aria-hidden />
            </button>
          ))
        )}
        {selected.length > 0 && (
          <button type="button" onClick={onClear} className="chip border-line text-muted hover:text-ink">
            <RotateCcw className="size-3.5" aria-hidden />
            مسح التحديد
          </button>
        )}
      </div>
      {error && (
        <p id="teeth-error" role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      </div>
    </div>
  );
}
