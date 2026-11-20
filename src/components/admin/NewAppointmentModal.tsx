"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  Clock,
  HeartHandshake,
  Loader2,
  Plus,
  Sparkles,
  Stethoscope,
  User,
  X,
} from "lucide-react";
import { createAdminAppointment } from "@/app/actions/admin";
import { useAdminAction } from "@/components/admin/useAdminAction";
import type { PublicSlot } from "@/lib/booking-types";
import { LOWER_LEFT, LOWER_RIGHT, TEETH_BY_FDI, UPPER_LEFT, UPPER_RIGHT } from "@/lib/teeth";

export type AdminBookingTreatment = {
  id: string;
  slug: string;
  nameAr: string;
  summaryAr: string;
  durationMinutes: number;
  requiresTeeth: boolean;
};

export function NewAppointmentModal({
  treatments,
}: {
  treatments: AdminBookingTreatment[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string>(
    treatments[0]?.id ?? ""
  );
  const [teeth, setTeeth] = useState<string[]>([]);
  const [date, setDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  });
  const [time, setTime] = useState<string>("");
  const [customTime, setCustomTime] = useState(false);
  const [manualTime, setManualTime] = useState("14:00");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [status, setStatus] = useState<"CONFIRMED" | "PENDING">("CONFIRMED");
  const [patientNotes, setPatientNotes] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const [slotsState, setSlotsState] = useState<{
    key: string;
    slots: PublicSlot[];
    loading: boolean;
  }>({
    key: "",
    slots: [],
    loading: false,
  });

  const { pending, result, run } = useAdminAction();

  const selectedTreatment =
    treatments.find((t) => t.id === selectedTreatmentId) ?? treatments[0];

  const slotsKey = date && selectedTreatmentId ? `${date}|${selectedTreatmentId}` : "";

  useEffect(() => {
    if (!date || !selectedTreatmentId || !isOpen) return;
    const controller = new AbortController();
    setSlotsState((prev) => ({ ...prev, loading: true, key: slotsKey }));

    fetch(`/api/slots?date=${date}&treatmentId=${selectedTreatmentId}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error())))
      .then((payload: { slots: PublicSlot[] }) => {
        setSlotsState({ key: slotsKey, slots: payload.slots, loading: false });
        if (payload.slots.length > 0 && !time) {
          setTime(payload.slots[0].startsAt);
        }
      })
      .catch((err: unknown) => {
        if ((err as Error).name !== "AbortError") {
          setSlotsState({ key: slotsKey, slots: [], loading: false });
        }
      });

    return () => controller.abort();
  }, [date, selectedTreatmentId, slotsKey, isOpen, time]);

  const toggleTooth = (fdi: string) => {
    setTeeth((prev) =>
      prev.includes(fdi) ? prev.filter((c) => c !== fdi) : [...prev, fdi].sort()
    );
  };

  const handleReset = () => {
    setFullName("");
    setPhone("");
    setWhatsapp("");
    setPatientNotes("");
    setAdminNotes("");
    setTeeth([]);
    setTime("");
    setCustomTime(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let startsAtIso: string;
    if (customTime) {
      if (!date || !manualTime) {
        alert("يرجى اختيار التاريخ والوقت المخصص");
        return;
      }
      startsAtIso = `${date}T${manualTime}:00+02:00`;
    } else {
      if (!time) {
        alert("يرجى اختيار وقت متاح من القائمة أو تفعيل وقت مخصص");
        return;
      }
      startsAtIso = time;
    }

    run(async () => {
      const res = await createAdminAppointment({
        fullName,
        phone,
        whatsapp: whatsapp.trim() || undefined,
        treatmentId: selectedTreatmentId,
        teeth: selectedTreatment?.requiresTeeth ? teeth : [],
        startsAt: startsAtIso,
        status,
        patientNotes: patientNotes.trim() || undefined,
        adminNotes: adminNotes.trim() || undefined,
      });

      if (res.ok) {
        handleReset();
        setTimeout(() => setIsOpen(false), 800);
      }
      return res;
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          handleReset();
        }}
        className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm shadow-sm"
      >
        <Plus className="size-4" aria-hidden />
        إضافة حجز جديد
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 sm:p-6 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-line bg-white p-6 shadow-2xl sm:p-8 text-right">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <span className="eyebrow flex items-center gap-1.5 text-teal">
                  <Sparkles className="size-3.5" />
                  حجز مباشر
                </span>
                <h3 className="text-xl font-bold text-teal-deep">
                  تسجيل موعد جديد (حضور شخصي / مباشر)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-muted hover:bg-neutral-100 hover:text-ink"
                aria-label="إغلاق النافذة"
              >
                <X className="size-5" />
              </button>
            </div>

            {result && (
              <div
                role="alert"
                className={`mt-4 rounded-2xl p-4 text-sm font-semibold ${
                  result.ok ? "bg-teal-light text-teal-deep" : "bg-red-50 text-red-700"
                }`}
              >
                {result.ok ? result.message ?? "تم تسجيل الموعد بنجاح" : result.error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 grid gap-6">
              {/* 1. Reservation Type (Treatment) */}
              <div>
                <label className="field-label text-sm font-bold text-teal-deep flex items-center gap-2">
                  <Stethoscope className="size-4 text-teal" />
                  العلاج / سبب الزيارة <span className="text-red-500">*</span>
                </label>
                <p className="mt-0.5 text-xs text-muted mb-2">
                  اختر نوع العلاج أو سبب الزيارة لهذا المريض:
                </p>
                <div className="grid gap-2 sm:grid-cols-2 max-h-52 overflow-y-auto p-1">
                  {treatments.map((t) => {
                    const isSelected = t.id === selectedTreatmentId;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSelectedTreatmentId(t.id);
                          setTime("");
                        }}
                        className={`flex flex-col text-right rounded-xl border p-3 transition-all ${
                          isSelected
                            ? "border-teal bg-teal-light/50 ring-2 ring-teal/20"
                            : "border-line bg-white hover:border-teal/30"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-xs text-teal-deep">
                            {t.nameAr}
                          </span>
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-muted">
                            <Clock className="size-2.5" />
                            {t.durationMinutes} د
                          </span>
                        </div>
                        <span className="mt-1 line-clamp-1 text-[11px] text-muted">
                          {t.summaryAr}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Teeth Selector if applicable */}
              {selectedTreatment?.requiresTeeth && (
                <div className="rounded-2xl border border-line bg-ivory/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-deep">
                      تحديد الأسنان المعنية (اختياري للإدارة):
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
                  <div className="mt-2.5 grid gap-2 text-xs">
                    <div>
                      <p className="text-[11px] text-muted mb-1">الفك العلوي:</p>
                      <div className="flex flex-wrap gap-1" dir="ltr">
                        {[...UPPER_RIGHT, ...UPPER_LEFT].map((code) => (
                          <button
                            key={code}
                            type="button"
                            onClick={() => toggleTooth(code)}
                            className={`size-6 rounded border text-[11px] font-mono transition-colors ${
                              teeth.includes(code)
                                ? "border-teal bg-teal text-white font-bold"
                                : "border-line bg-white text-neutral-700 hover:border-teal/40"
                            }`}
                            title={TEETH_BY_FDI[code]?.nameAr}
                          >
                            {code}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted mb-1">الفك السفلي:</p>
                      <div className="flex flex-wrap gap-1" dir="ltr">
                        {[...LOWER_RIGHT, ...LOWER_LEFT].map((code) => (
                          <button
                            key={code}
                            type="button"
                            onClick={() => toggleTooth(code)}
                            className={`size-6 rounded border text-[11px] font-mono transition-colors ${
                              teeth.includes(code)
                                ? "border-teal bg-teal text-white font-bold"
                                : "border-line bg-white text-neutral-700 hover:border-teal/40"
                            }`}
                            title={TEETH_BY_FDI[code]?.nameAr}
                          >
                            {code}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Date & Time Selection */}
              <div className="rounded-2xl border border-line bg-ivory/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <label htmlFor="booking-date" className="field-label text-xs font-bold text-teal-deep flex items-center gap-1.5">
                    <CalendarDays className="size-4 text-teal" />
                    تاريخ ووقت الموعد <span className="text-red-500">*</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customTime}
                      onChange={(e) => setCustomTime(e.target.checked)}
                      className="size-3.5 rounded text-teal focus:ring-teal"
                    />
                    وقت مخصص (تجاوز جدول التوافر)
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <span className="block text-[11px] text-muted mb-1">اختر التاريخ:</span>
                    <input
                      id="booking-date"
                      type="date"
                      required
                      value={date}
                      onChange={(e) => {
                        setDate(e.target.value);
                        setTime("");
                      }}
                      className="input text-sm"
                    />
                  </div>

                  {customTime ? (
                    <div>
                      <span className="block text-[11px] text-muted mb-1">وقت مخصص (بتوقيت القاهرة):</span>
                      <input
                        type="time"
                        required
                        value={manualTime}
                        onChange={(e) => setManualTime(e.target.value)}
                        className="input font-mono text-sm"
                      />
                    </div>
                  ) : (
                    <div>
                      <span className="block text-[11px] text-muted mb-1">الأوقات المتاحة:</span>
                      {slotsState.loading ? (
                        <p className="text-xs text-muted py-2">جاري فحص الأوقات المتاحة...</p>
                      ) : slotsState.slots.length === 0 ? (
                        <p className="text-xs text-amber-700 py-2">
                          لا توجد أوقات شاغرة في هذا اليوم. فعّل «وقت مخصص» لتسجيل حجز استثنائي.
                        </p>
                      ) : (
                        <select
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className="input font-mono text-xs"
                          required
                        >
                          <option value="">اختر موعداً متاحاً...</option>
                          {slotsState.slots.map((s) => (
                            <option key={s.startsAt} value={s.startsAt}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Patient Information */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="patient-name" className="field-label text-xs">
                    اسم المريض بالكامل <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="patient-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: أحمد محمود"
                    className="input text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="patient-phone" className="field-label text-xs">
                    رقم الهاتف المحمول (مصر) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="patient-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01012345678"
                    dir="ltr"
                    className="input font-mono text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="patient-whatsapp" className="field-label text-xs">
                    رقم واتساب (اختياري)
                  </label>
                  <input
                    id="patient-whatsapp"
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="01012345678"
                    dir="ltr"
                    className="input font-mono text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="booking-status" className="field-label text-xs">
                    حالة الحجز الأولية
                  </label>
                  <select
                    id="booking-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "CONFIRMED" | "PENDING")}
                    className="input text-sm"
                  >
                    <option value="CONFIRMED">مؤكد فورياً (CONFIRMED)</option>
                    <option value="PENDING">معلق بانتظار التأكيد (PENDING)</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="patient-notes" className="field-label text-xs">
                  ملاحظات أو شكوى المريض (اختياري)
                </label>
                <textarea
                  id="patient-notes"
                  rows={2}
                  value={patientNotes}
                  onChange={(e) => setPatientNotes(e.target.value)}
                  placeholder="أي ملاحظات حول الحالة أو شكوى المريض..."
                  className="input text-sm leading-relaxed"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn-secondary text-sm px-4 py-2"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="btn-primary text-sm px-5 py-2 shadow-sm"
                >
                  {pending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      جاري تسجيل الموعد...
                    </>
                  ) : (
                    <>
                      <Check className="size-4" aria-hidden />
                      تأكيد وحفظ الموعد
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
