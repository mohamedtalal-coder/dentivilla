import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, Lock } from "lucide-react";
import type { AppointmentStatus } from "@prisma/client";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  addDaysYmd,
  computeDaySlots,
  dataRangeForDays,
  openingWindows,
  overlaps,
} from "@/lib/availability";
import { loadAvailabilityData } from "@/lib/booking";
import { cairoYmd, formatCairoTime, startOfCairoDay } from "@/lib/datetime";
import { statusLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

const WEEKDAYS = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
const MONTH_FMT = new Intl.DateTimeFormat("ar-EG", { month: "long", year: "numeric", timeZone: "UTC" });
const DAY_FMT = new Intl.DateTimeFormat("ar-EG", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const NUM = new Intl.NumberFormat("ar-EG");

const STATUS_TONE: Record<AppointmentStatus, string> = {
  PENDING: "border-amber/40 bg-amber-light text-amber-dark",
  CONFIRMED: "border-teal/30 bg-teal-light text-teal-deep",
  COMPLETED: "border-line bg-ivory text-muted",
  REJECTED: "border-red-200 bg-red-50 text-red-800",
  CANCELLED: "border-red-200 bg-red-50 text-red-800",
};

const ymdUtc = (ymd: string) => new Date(`${ymd}T12:00:00Z`);
const isMonth = (v?: string) => Boolean(v && /^\d{4}-(0[1-9]|1[0-2])$/.test(v));
const isDay = (v?: string) => Boolean(v && /^\d{4}-\d{2}-\d{2}$/.test(v));

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; day?: string; treatment?: string }>;
}) {
  await requireAdminSession();
  const params = await searchParams;
  const today = cairoYmd(new Date());
  const selectedDay = isDay(params.day) ? params.day! : today;
  const month = isMonth(params.month) ? params.month! : selectedDay.slice(0, 7);

  const treatments = await prisma.treatment.findMany({
    orderBy: { durationMinutes: "asc" },
    select: { slug: true, nameAr: true, durationMinutes: true },
  });
  const treatment = treatments.find((t) => t.slug === params.treatment) ?? treatments[0];

  // Month grid (Saturday-first)
  const first = `${month}-01`;
  const last = addDaysYmd(addDaysYmd(first, 31).slice(0, 7) + "-01", -1);
  const lead = (new Date(`${first}T00:00:00Z`).getUTCDay() + 1) % 7;
  const days: string[] = [];
  for (let d = first; d <= last; d = addDaysYmd(d, 1)) days.push(d);

  const rangeFrom = selectedDay < first ? selectedDay : first;
  const rangeTo = selectedDay > last ? selectedDay : last;
  const data = await loadAvailabilityData(dataRangeForDays(rangeFrom, rangeTo, 24 * 60));
  const now = new Date();

  const appointments = await prisma.appointment.findMany({
    where: {
      startsAt: { gte: startOfCairoDay(rangeFrom), lt: startOfCairoDay(addDaysYmd(rangeTo, 1)) },
    },
    include: { patient: { select: { fullName: true, phone: true } }, treatment: { select: { nameAr: true } } },
    orderBy: { startsAt: "asc" },
  });
  const byDay = new Map<string, typeof appointments>();
  for (const a of appointments) {
    const key = cairoYmd(a.startsAt);
    byDay.set(key, [...(byDay.get(key) ?? []), a]);
  }

  const summary = (ymd: string) => {
    const windows = openingWindows(ymd, data);
    const free = treatment ? computeDaySlots(ymd, treatment.durationMinutes, data, { now }).length : 0;
    const list = byDay.get(ymd) ?? [];
    return {
      open: windows.length > 0,
      fullyBlocked:
        windows.length > 0 &&
        windows.every((w) => data.blocked.some((b) => b.start <= w.start && b.end >= w.end)),
      free,
      pending: list.filter((a) => a.status === "PENDING").length,
      confirmed: list.filter((a) => a.status === "CONFIRMED").length,
      total: list.length,
    };
  };

  const prevMonth = addDaysYmd(first, -1).slice(0, 7);
  const nextMonth = addDaysYmd(last, 1).slice(0, 7);
  const href = (q: { month?: string; day?: string }) => {
    const sp = new URLSearchParams();
    sp.set("month", q.month ?? month);
    if (q.day) sp.set("day", q.day);
    if (treatment) sp.set("treatment", treatment.slug);
    return `/admin/calendar?${sp}`;
  };

  // Selected day agenda
  const dayWindows = openingWindows(selectedDay, data);
  const dayBlocked = data.blocked.filter((b) =>
    overlaps(b, { start: startOfCairoDay(selectedDay), end: startOfCairoDay(addDaysYmd(selectedDay, 1)) }),
  );
  const daySlots = treatment ? computeDaySlots(selectedDay, treatment.durationMinutes, data, { now }) : [];
  const dayAppointments = byDay.get(selectedDay) ?? [];

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold text-teal-deep">التقويم</h1>
        <form className="flex items-center gap-2 text-sm" action="/admin/calendar">
          <input type="hidden" name="month" value={month} />
          <input type="hidden" name="day" value={selectedDay} />
          <label htmlFor="cal-treatment" className="text-muted">
            الأوقات المتاحة لـ
          </label>
          <select id="cal-treatment" name="treatment" defaultValue={treatment?.slug} className="field w-auto py-2">
            {treatments.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.nameAr} ({NUM.format(t.durationMinutes)} د)
              </option>
            ))}
          </select>
          <button type="submit" className="btn-secondary px-4 py-2">
            عرض
          </button>
        </form>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <section className="card-soft rounded-3xl p-4 sm:p-5" aria-label="تقويم الشهر">
          <div className="mb-4 flex items-center justify-between">
            <Link href={href({ month: prevMonth })} className="grid size-9 place-items-center rounded-full hover:bg-teal-light" aria-label="الشهر السابق">
              <ChevronRight className="size-5 text-teal-deep" />
            </Link>
            <div className="text-center">
              <p className="font-bold text-teal-deep">{MONTH_FMT.format(ymdUtc(first))}</p>
              {month !== today.slice(0, 7) && (
                <Link href={href({ month: today.slice(0, 7), day: today })} className="text-xs text-teal-mid hover:underline">
                  العودة لليوم
                </Link>
              )}
            </div>
            <Link href={href({ month: nextMonth })} className="grid size-9 place-items-center rounded-full hover:bg-teal-light" aria-label="الشهر التالي">
              <ChevronLeft className="size-5 text-teal-deep" />
            </Link>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-muted">
            {WEEKDAYS.map((d) => (
              <span key={d} className="py-1">
                {d}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: lead }, (_, i) => (
              <span key={`b${i}`} />
            ))}
            {days.map((ymd) => {
              const s = summary(ymd);
              const selected = ymd === selectedDay;
              const past = ymd < today;
              return (
                <Link
                  key={ymd}
                  href={href({ day: ymd })}
                  aria-current={selected ? "date" : undefined}
                  className={`flex min-h-20 flex-col rounded-xl border p-1.5 text-right transition-colors sm:min-h-24 sm:p-2 ${
                    selected
                      ? "border-teal-deep bg-teal-deep text-white"
                      : !s.open || s.fullyBlocked
                        ? "border-transparent bg-neutral-100/70 text-neutral-400 hover:bg-neutral-100"
                        : "border-line bg-white hover:border-teal/50"
                  } ${past && !selected ? "opacity-60" : ""}`}
                >
                  <span className={`text-sm font-semibold ${ymd === today && !selected ? "text-amber-dark" : ""}`}>
                    {NUM.format(Number(ymd.slice(8)))}
                  </span>
                  <span className="mt-auto grid gap-0.5 text-[10px] leading-tight sm:text-[11px]">
                    {!s.open ? (
                      <span>مغلق</span>
                    ) : s.fullyBlocked ? (
                      <span className="inline-flex items-center gap-0.5">
                        <Lock className="size-3" aria-hidden /> محجوب
                      </span>
                    ) : (
                      !past && <span className={selected ? "text-teal-light" : "text-teal-mid"}>{NUM.format(s.free)} متاح</span>
                    )}
                    {s.total > 0 && (
                      <span className="flex flex-wrap gap-0.5">
                        {s.pending > 0 && (
                          <span className={`rounded px-1 ${selected ? "bg-white/20" : "bg-amber-light text-amber-dark"}`}>
                            {NUM.format(s.pending)} معلّق
                          </span>
                        )}
                        {s.confirmed > 0 && (
                          <span className={`rounded px-1 ${selected ? "bg-white/20" : "bg-teal-light text-teal-deep"}`}>
                            {NUM.format(s.confirmed)} مؤكد
                          </span>
                        )}
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-muted">
            «متاح» = عدد الأوقات التي يستطيع المرضى حجزها الآن لهذا العلاج، بعد احتساب المواعيد والفاصل والفترات المحجوبة ومهلة الحجز.
          </p>
        </section>

        <section className="card-soft rounded-3xl p-5 sm:p-6" aria-label="جدول اليوم">
          <h2 className="heading-md">{DAY_FMT.format(ymdUtc(selectedDay))}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            <Clock className="size-4" aria-hidden />
            {dayWindows.length
              ? dayWindows.map((w) => `${formatCairoTime(w.start)} – ${formatCairoTime(w.end)}`).join("، ")
              : "يوم إجازة"}
          </p>

          {dayBlocked.length > 0 && (
            <ul className="mt-3 grid gap-1.5 text-sm">
              {dayBlocked.map((b, i) => (
                <li key={i} className="flex items-center gap-2 rounded-xl bg-neutral-100 px-3 py-2 text-neutral-600">
                  <Lock className="size-4" aria-hidden />
                  محجوب {formatCairoTime(b.start)} – {formatCairoTime(b.end)}
                </li>
              ))}
            </ul>
          )}

          <h3 className="mt-6 mb-2 text-sm font-semibold text-ink">الحجوزات ({NUM.format(dayAppointments.length)})</h3>
          {dayAppointments.length === 0 ? (
            <p className="text-sm text-muted">لا توجد حجوزات في هذا اليوم.</p>
          ) : (
            <ol className="grid gap-2">
              {dayAppointments.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/admin/appointments/${a.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-line p-3 transition-colors hover:border-teal/50 hover:bg-teal-light/30"
                  >
                    <span className="w-16 shrink-0 text-center font-mono text-sm font-semibold text-teal-deep" dir="ltr">
                      {formatCairoTime(a.startsAt)}
                      <span className="block text-[11px] font-normal text-muted">{formatCairoTime(a.endsAt)}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{a.patient.fullName}</span>
                      <span className="block truncate text-xs text-muted">
                        {a.treatment.nameAr}
                        {a.teeth.length ? ` · FDI ${a.teeth.join("، ")}` : ""}
                      </span>
                    </span>
                    <span className={`chip shrink-0 ${STATUS_TONE[a.status]}`}>{statusLabel[a.status]}</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}

          {treatment && dayWindows.length > 0 && selectedDay >= today && (
            <>
              <h3 className="mt-6 mb-2 text-sm font-semibold text-ink">
                أوقات متاحة للحجز — {treatment.nameAr} ({NUM.format(daySlots.length)})
              </h3>
              {daySlots.length === 0 ? (
                <p className="text-sm text-muted">لا توجد أوقات متاحة لهذا العلاج في هذا اليوم.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {daySlots.map((s) => (
                    <span key={s.start.toISOString()} className="rounded-lg border border-teal/25 bg-teal-light/50 px-2.5 py-1 font-mono text-xs text-teal-deep">
                      {formatCairoTime(s.start)}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4 text-sm">
            <Link href="/admin/availability" className="btn-secondary px-4 py-2">
              تعديل الساعات أو حجب فترة
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
