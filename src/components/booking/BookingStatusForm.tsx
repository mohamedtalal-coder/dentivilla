"use client";

import { useState } from "react";
import { CalendarClock, Search } from "lucide-react";
import type { AppointmentStatus } from "@prisma/client";
import { lookupBooking, type LookupResult } from "@/app/actions/booking";
import { formatCairoDateTime } from "@/lib/datetime";
import { statusLabel } from "@/lib/labels";
import { formatTeeth } from "@/lib/teeth";

const STATUS_TONE: Record<AppointmentStatus, string> = {
  PENDING: "bg-amber-light text-amber-dark border-amber/30",
  CONFIRMED: "bg-teal-light text-teal-deep border-teal/30",
  COMPLETED: "bg-ivory text-ink border-line",
  REJECTED: "bg-red-50 text-red-800 border-red-200",
  CANCELLED: "bg-red-50 text-red-800 border-red-200",
};

export function BookingStatusForm({ initialReference = "" }: { initialReference?: string }) {
  const [reference, setReference] = useState(initialReference);
  const [phone, setPhone] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      setResult(await lookupBooking({ reference, phone }));
    } catch {
      setResult({ ok: false, error: "تعذر الاتصال بالخادم. حاول مرة أخرى." });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={onSubmit} className="card-soft grid gap-4 rounded-[1.75rem] p-6 sm:p-8" noValidate>
        <div>
          <label htmlFor="lookup-ref" className="field-label">
            الرقم المرجعي
          </label>
          <input
            id="lookup-ref"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="field text-left font-mono uppercase"
            dir="ltr"
            placeholder="DV-XXXXXX"
            autoComplete="off"
            required
          />
        </div>
        <div>
          <label htmlFor="lookup-phone" className="field-label">
            رقم الموبايل المستخدم في الحجز
          </label>
          <input
            id="lookup-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="field text-left"
            dir="ltr"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="01X XXXX XXXX"
            required
          />
        </div>
        <button type="submit" className="btn-primary mt-2 w-full sm:w-auto" disabled={pending}>
          <Search className="size-4" aria-hidden />
          {pending ? "جارٍ البحث…" : "عرض حالة الطلب"}
        </button>
        {result && !result.ok && (
          <p role="alert" className="text-sm text-red-700">
            {result.error}
          </p>
        )}
      </form>

      {result?.ok && (
        <section className="card-soft rounded-[1.75rem] p-6 sm:p-8" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-lg font-bold text-teal-deep" dir="ltr">
              {result.appointment.reference}
            </p>
            <span className={`chip ${STATUS_TONE[result.appointment.status as AppointmentStatus]}`}>
              {statusLabel[result.appointment.status as AppointmentStatus]}
            </span>
          </div>
          <dl className="mt-5 grid gap-3 text-sm">
            <div className="flex gap-3">
              <dt className="w-20 shrink-0 text-muted">الزيارة</dt>
              <dd className="font-medium">{result.appointment.treatment}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-20 shrink-0 text-muted">الموعد</dt>
              <dd className="flex items-center gap-2 font-medium">
                <CalendarClock className="size-4 text-teal" aria-hidden />
                {formatCairoDateTime(new Date(result.appointment.startsAt))}
              </dd>
            </div>
            {result.appointment.teeth.length > 0 && (
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 text-muted">الأسنان</dt>
                <dd>{formatTeeth(result.appointment.teeth)}</dd>
              </div>
            )}
          </dl>
        </section>
      )}
    </div>
  );
}
