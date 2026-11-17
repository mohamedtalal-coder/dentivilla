"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import type { PublicSlot } from "@/lib/booking-types";

type MonthAvailability = { today: string; lastDate: string; days: Record<string, number> };

const WEEKDAYS = ["سبت", "أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة"];
const MONTH_FMT = new Intl.DateTimeFormat("ar-EG", { month: "long", year: "numeric", timeZone: "UTC" });
const DAY_FMT = new Intl.DateTimeFormat("ar-EG", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const DIGITS = new Intl.NumberFormat("ar-EG");

const ymdToUtc = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const utcToYmd = (date: Date) => date.toISOString().slice(0, 10);
const monthKey = (ymd: string) => ymd.slice(0, 7);
const cairoToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(new Date());
const addMonths = (month: string, delta: number) => {
  const [y, m] = month.split("-").map(Number);
  return utcToYmd(new Date(Date.UTC(y, m - 1 + delta, 1))).slice(0, 7);
};

export function formatDayLabel(ymd: string) {
  return DAY_FMT.format(ymdToUtc(ymd));
}

export function AvailabilityCalendar({
  treatmentId,
  date,
  slot,
  onDateChange,
  onSlotChange,
  error,
  refreshToken = 0,
}: {
  treatmentId: string;
  date: string | null;
  slot: PublicSlot | null;
  onDateChange: (ymd: string) => void;
  onSlotChange: (slot: PublicSlot | null) => void;
  error?: string;
  /** bump to force a refetch (e.g. after a slot was taken by someone else) */
  refreshToken?: number;
}) {
  const [month, setMonth] = useState<string>(() => monthKey(date ?? cairoToday()));
  const monthRequest = `${treatmentId}|${month}|${refreshToken}`;
  const [monthState, setMonthState] = useState<{ key: string; data?: MonthAvailability; failed?: boolean }>({
    key: "",
  });
  const slotRequest = date ? `${treatmentId}|${date}|${refreshToken}` : "";
  const [slotState, setSlotState] = useState<{ key: string; slots?: PublicSlot[]; failed?: boolean }>({ key: "" });
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ treatmentId, month });
    fetch(`/api/availability?${params}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: MonthAvailability) => {
        setMonthState({ key: monthRequest, data });
      })
      .catch((err: unknown) => {
        if ((err as Error).name !== "AbortError") setMonthState({ key: monthRequest, failed: true });
      });
    return () => controller.abort();
  }, [monthRequest, month, treatmentId, retry]);

  useEffect(() => {
    if (!date) return;
    const controller = new AbortController();
    fetch(`/api/slots?${new URLSearchParams({ treatmentId, date })}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: { slots: PublicSlot[] }) => setSlotState({ key: slotRequest, slots: data.slots }))
      .catch((err: unknown) => {
        if ((err as Error).name !== "AbortError") setSlotState({ key: slotRequest, failed: true });
      });
    return () => controller.abort();
  }, [slotRequest, date, treatmentId, retry]);

  const monthData = monthState.data;
  const monthLoading = monthState.key !== monthRequest;
  const slotsLoading = Boolean(date) && slotState.key !== slotRequest;
  const slots = useMemo(
    () => (slotState.key === slotRequest ? (slotState.slots ?? []) : []),
    [slotState, slotRequest],
  );

  // If the chosen time vanished (taken/blocked meanwhile), drop it.
  useEffect(() => {
    if (!slot || slotsLoading || slotState.failed) return;
    if (!slots.some((item) => item.startsAt === slot.startsAt)) onSlotChange(null);
  }, [slot, slots, slotsLoading, slotState.failed, onSlotChange]);

  const cells = useMemo(() => {
    const first = ymdToUtc(`${month}-01`);
    const lead = (first.getUTCDay() + 1) % 7; // Saturday-first week
    const daysInMonth = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
    const list: (string | null)[] = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= daysInMonth; d += 1) list.push(`${month}-${String(d).padStart(2, "0")}`);
    return list;
  }, [month]);

  const canPrev = Boolean(monthData && month > monthKey(monthData.today));
  const canNext = Boolean(monthData && month < monthKey(monthData.lastDate));
  const grouped = useMemo(() => {
    const morning = slots.filter((s) => Number(s.label.slice(0, 2)) < 12);
    const evening = slots.filter((s) => Number(s.label.slice(0, 2)) >= 12);
    return [
      { label: "صباحاً", items: morning },
      { label: "بعد الظهر والمساء", items: evening },
    ].filter((group) => group.items.length);
  }, [slots]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <div className="rounded-[1.5rem] border border-line bg-white p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMonth(addMonths(month, -1))}
            disabled={!canPrev}
            className="grid size-9 place-items-center rounded-full text-teal-deep hover:bg-teal-light disabled:opacity-30"
            aria-label="الشهر السابق"
          >
            <ChevronRight className="size-5" />
          </button>
          <p className="font-semibold text-teal-deep" aria-live="polite">
            {MONTH_FMT.format(ymdToUtc(`${month}-01`))}
          </p>
          <button
            type="button"
            onClick={() => setMonth(addMonths(month, 1))}
            disabled={!canNext}
            className="grid size-9 place-items-center rounded-full text-teal-deep hover:bg-teal-light disabled:opacity-30"
            aria-label="الشهر التالي"
          >
            <ChevronLeft className="size-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted" aria-hidden>
          {WEEKDAYS.map((day) => (
            <span key={day} className="py-1">
              {day}
            </span>
          ))}
        </div>

        {monthState.failed && !monthLoading ? (
          <div className="grid place-items-center gap-3 py-10 text-sm text-muted">
            تعذر تحميل المواعيد المتاحة.
            <button type="button" className="btn-secondary px-4 py-2" onClick={() => setRetry((n) => n + 1)}>
              <RefreshCw className="size-4" aria-hidden /> إعادة المحاولة
            </button>
          </div>
        ) : (
          <div
            role="grid"
            aria-label="اختر يوماً"
            aria-busy={monthLoading}
            className={`grid grid-cols-7 gap-1 transition-opacity ${monthLoading ? "opacity-50" : ""}`}
          >
            {cells.map((ymd, index) =>
              ymd === null ? (
                <span key={`blank-${index}`} />
              ) : (
                (() => {
                  const count = monthData?.days[ymd] ?? 0;
                  const available = !monthLoading && count > 0;
                  const isSelected = ymd === date;
                  const isToday = ymd === monthData?.today;
                  return (
                    <button
                      key={ymd}
                      type="button"
                      role="gridcell"
                      disabled={!available}
                      aria-selected={isSelected}
                      aria-label={`${formatDayLabel(ymd)}${available ? ` — أوقات متاحة: ${DIGITS.format(count)}` : " — لا أوقات متاحة"}`}
                      onClick={() => {
                        onDateChange(ymd);
                        onSlotChange(null);
                      }}
                      className={`relative aspect-square rounded-xl text-sm transition-colors ${
                        isSelected
                          ? "bg-teal-deep font-bold text-white"
                          : available
                            ? "bg-teal-light/60 font-semibold text-teal-deep hover:bg-teal-light"
                            : "cursor-not-allowed text-neutral-300"
                      } ${isToday && !isSelected ? "ring-1 ring-amber" : ""}`}
                    >
                      {DIGITS.format(Number(ymd.slice(8)))}
                      {available && !isSelected && (
                        <span className="absolute bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-teal" />
                      )}
                    </button>
                  );
                })()
              ),
            )}
          </div>
        )}
        <p className="mt-3 flex items-center gap-2 text-xs text-muted">
          <span className="size-2.5 rounded bg-teal-light ring-1 ring-teal/30" /> يوم فيه مواعيد متاحة
        </p>
      </div>

      <div className="rounded-[1.5rem] border border-line bg-white p-4 sm:p-5">
        <p className="font-semibold text-teal-deep">{date ? formatDayLabel(date) : "اختر يوماً من التقويم"}</p>
        <div className="mt-4" aria-live="polite" aria-busy={slotsLoading}>
          {!date ? (
            <p className="text-sm text-muted">ستظهر هنا الأوقات المتاحة حسب مدة العلاج وجدول الطبيب.</p>
          ) : slotsLoading ? (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }, (_, i) => (
                <span key={i} className="h-11 animate-pulse rounded-xl bg-ivory" />
              ))}
            </div>
          ) : slotState.failed ? (
            <button type="button" className="btn-secondary px-4 py-2" onClick={() => setRetry((n) => n + 1)}>
              <RefreshCw className="size-4" aria-hidden /> إعادة تحميل الأوقات
            </button>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted">لم تعد هناك أوقات متاحة في هذا اليوم. اختر يوماً آخر.</p>
          ) : (
            <div className="grid gap-4">
              {grouped.map((group) => (
                <div key={group.label}>
                  <p className="mb-2 text-xs text-muted">{group.label}</p>
                  <div role="radiogroup" aria-label={`الأوقات ${group.label}`} className="grid grid-cols-3 gap-2">
                    {group.items.map((item) => {
                      const isSelected = slot?.startsAt === item.startsAt;
                      return (
                        <button
                          key={item.startsAt}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => onSlotChange(item)}
                          className={`h-11 rounded-xl border font-mono text-sm transition-colors ${
                            isSelected
                              ? "border-teal bg-teal font-semibold text-white"
                              : "border-line bg-white text-ink hover:border-teal/60 hover:bg-teal-light/50"
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
