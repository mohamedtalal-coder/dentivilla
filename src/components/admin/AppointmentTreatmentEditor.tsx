"use client";

import { useState } from "react";
import { Check, Edit2, Loader2, Sparkles, X } from "lucide-react";
import { updateAppointmentTreatment } from "@/app/actions/admin";
import { useAdminAction } from "@/components/admin/useAdminAction";
import { LOWER_LEFT, LOWER_RIGHT, TEETH_BY_FDI, UPPER_LEFT, UPPER_RIGHT } from "@/lib/teeth";

export type TreatmentOption = {
  id: string;
  nameAr: string;
  summaryAr: string;
  durationMinutes: number;
  requiresTeeth: boolean;
};

export function AppointmentTreatmentEditor({
  appointmentId,
  currentTreatmentId,
  currentTeeth,
  treatments,
}: {
  appointmentId: string;
  currentTreatmentId: string;
  currentTeeth: string[];
  treatments: TreatmentOption[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState(currentTreatmentId);
  const [teeth, setTeeth] = useState<string[]>(currentTeeth);
  const { pending, result, run } = useAdminAction();

  const selectedTreatment =
    treatments.find((t) => t.id === selectedTreatmentId) ?? treatments[0];

  const toggleTooth = (fdi: string) => {
    setTeeth((prev) =>
      prev.includes(fdi) ? prev.filter((code) => code !== fdi) : [...prev, fdi].sort()
    );
  };

  const handleSave = () => {
    run(async () => {
      const res = await updateAppointmentTreatment(
        appointmentId,
        selectedTreatmentId,
        selectedTreatment?.requiresTeeth ? teeth : []
      );
      if (res.ok) {
        setIsOpen(false);
      }
      return res;
    });
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-teal/30 bg-teal-light/50 px-3 py-1.5 text-xs font-semibold text-teal-deep hover:bg-teal-light transition-colors"
      >
        <Edit2 className="size-3.5" aria-hidden />
        تغيير العلاج والأسنان المحددة
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border-2 border-teal/20 bg-ivory/60 p-4 sm:p-5">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <h4 className="flex items-center gap-2 text-sm font-bold text-teal-deep">
          <Sparkles className="size-4 text-teal" />
          تعديل العلاج والأسنان (سبب الزيارة)
        </h4>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setSelectedTreatmentId(currentTreatmentId);
            setTeeth(currentTeeth);
          }}
          className="rounded-full p-1 text-muted hover:bg-neutral-200"
          aria-label="إلغاء"
        >
          <X className="size-4" />
        </button>
      </div>

      {result && (
        <div
          role="alert"
          className={`mt-3 rounded-xl p-3 text-xs font-semibold ${
            result.ok ? "bg-teal-light text-teal-deep" : "bg-red-50 text-red-700"
          }`}
        >
          {result.ok ? result.message ?? "تم الحفظ بنجاح" : result.error}
        </div>
      )}

      <div className="mt-4 grid gap-4">
        {/* Treatment Selector */}
        <div>
          <label htmlFor="treatment-select" className="field-label text-xs">
            العلاج الجديد (الخدمة المطلوبة)
          </label>
          <select
            id="treatment-select"
            value={selectedTreatmentId}
            onChange={(e) => setSelectedTreatmentId(e.target.value)}
            className="input mt-1 text-sm"
          >
            {treatments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nameAr} ({t.durationMinutes} دقيقة)
              </option>
            ))}
          </select>
          {selectedTreatment && (
            <p className="mt-1.5 text-xs text-muted leading-relaxed">
              {selectedTreatment.summaryAr}
            </p>
          )}
        </div>

        {/* Teeth Selector if treatment requires teeth */}
        {selectedTreatment?.requiresTeeth && (
          <div className="rounded-xl border border-line bg-white p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-deep">
                تحديد الأسنان المراد علاجها (FDI)
              </span>
              {teeth.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTeeth([])}
                  className="text-[11px] text-muted hover:text-red-600"
                >
                  مسح التحديد ({teeth.length})
                </button>
              )}
            </div>

            {/* Quick Jaw FDI code selector */}
            <div className="mt-3 grid gap-3 text-xs">
              <div>
                <p className="text-[11px] font-medium text-muted mb-1.5">الفك العلوي:</p>
                <div className="flex flex-wrap gap-1" dir="ltr">
                  {[...UPPER_RIGHT, ...UPPER_LEFT].map((code) => {
                    const active = teeth.includes(code);
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => toggleTooth(code)}
                        className={`size-7 rounded-lg border text-xs font-mono transition-colors ${
                          active
                            ? "border-teal bg-teal text-white font-bold"
                            : "border-line bg-ivory/50 text-neutral-700 hover:border-teal/40"
                        }`}
                        title={TEETH_BY_FDI[code]?.nameAr}
                      >
                        {code}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-medium text-muted mb-1.5">الفك السفلي:</p>
                <div className="flex flex-wrap gap-1" dir="ltr">
                  {[...LOWER_RIGHT, ...LOWER_LEFT].map((code) => {
                    const active = teeth.includes(code);
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => toggleTooth(code)}
                        className={`size-7 rounded-lg border text-xs font-mono transition-colors ${
                          active
                            ? "border-teal bg-teal text-white font-bold"
                            : "border-line bg-ivory/50 text-neutral-700 hover:border-teal/40"
                        }`}
                        title={TEETH_BY_FDI[code]?.nameAr}
                      >
                        {code}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {teeth.length > 0 && (
              <p className="mt-2.5 text-xs text-teal-deep font-medium">
                الأسنان المحددة: {teeth.map((c) => `${c} (${TEETH_BY_FDI[c]?.nameAr ?? c})`).join("، ")}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            إلغاء
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={handleSave}
            className="btn-primary text-xs px-4 py-1.5 shadow-sm"
          >
            {pending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Check className="size-3.5" aria-hidden />
                حفظ التعديلات
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
