/**
 * Pure availability engine — no database access, fully unit-testable.
 *
 * A start time is offered for a treatment of duration D when the interval
 * [start, start + D):
 *   1. lies entirely inside an opening window of that Cairo calendar day
 *      (the weekday's working hours, or an admin-added extra window),
 *   2. starts on the window's slot grid (every `slotMinutes` from its opening),
 *   3. does not overlap any blocked period,
 *   4. keeps `bufferMinutes` clear before and after every held appointment
 *      (PENDING or CONFIRMED),
 *   5. starts at least `bookingLeadHours` from now, and its day is within
 *      `bookingHorizonDays` of today.
 */
import { addHours, addMinutes } from "date-fns";
import { cairoDateTime, cairoYmd, parseTimeToMinutes, startOfCairoDay } from "@/lib/datetime";

export type AvailabilityRules = {
  slotMinutes: number;
  bufferMinutes: number;
  bookingLeadHours: number;
  bookingHorizonDays: number;
};

export type WorkingDay = {
  weekday: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
};

export type Interval = { start: Date; end: Date };

export type AvailabilityData = {
  rules: AvailabilityRules;
  workingHours: WorkingDay[];
  blocked: Interval[];
  extra: Interval[];
  /** held appointments (PENDING / CONFIRMED) */
  busy: Interval[];
};

export type SlotOptions = {
  now: Date;
  /** admins may place appointments inside the lead window */
  ignoreLead?: boolean;
  /** admins may schedule beyond the public horizon */
  ignoreHorizon?: boolean;
};

export const overlaps = (a: Interval, b: Interval) => a.start < b.end && a.end > b.start;

/** Weekday (0 = Sunday) of a YYYY-MM-DD calendar date, independent of any timezone. */
export function weekdayOfYmd(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function addDaysYmd(ymd: string, days: number) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Last calendar day (Cairo) that may be booked publicly. */
export function lastBookableYmd(rules: AvailabilityRules, now: Date) {
  return addDaysYmd(cairoYmd(now), rules.bookingHorizonDays);
}

/** Opening windows for a Cairo calendar day, merged and sorted. */
export function openingWindows(ymd: string, data: Pick<AvailabilityData, "workingHours" | "extra">): Interval[] {
  const dayStart = startOfCairoDay(ymd);
  const dayEnd = startOfCairoDay(addDaysYmd(ymd, 1));
  const windows: Interval[] = [];

  const working = data.workingHours.find((day) => day.weekday === weekdayOfYmd(ymd));
  if (working?.enabled && parseTimeToMinutes(working.endTime) > parseTimeToMinutes(working.startTime)) {
    windows.push({ start: cairoDateTime(ymd, working.startTime), end: cairoDateTime(ymd, working.endTime) });
  }
  for (const extra of data.extra) {
    const start = extra.start > dayStart ? extra.start : dayStart;
    const end = extra.end < dayEnd ? extra.end : dayEnd;
    if (end > start) windows.push({ start, end });
  }

  windows.sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: Interval[] = [];
  for (const window of windows) {
    const last = merged[merged.length - 1];
    if (last && window.start <= last.end) {
      if (window.end > last.end) last.end = window.end;
    } else {
      merged.push({ ...window });
    }
  }
  return merged;
}

/** All bookable intervals of `durationMinutes` on a Cairo calendar day. */
export function computeDaySlots(
  ymd: string,
  durationMinutes: number,
  data: AvailabilityData,
  options: SlotOptions,
): Interval[] {
  const { rules } = data;
  if (durationMinutes <= 0 || rules.slotMinutes <= 0) return [];
  if (!options.ignoreHorizon && ymd > lastBookableYmd(rules, options.now)) return [];

  const earliest = options.ignoreLead ? options.now : addHours(options.now, rules.bookingLeadHours);
  const buffered = data.busy.map((item) => ({
    start: addMinutes(item.start, -rules.bufferMinutes),
    end: addMinutes(item.end, rules.bufferMinutes),
  }));

  const slots: Interval[] = [];
  for (const window of openingWindows(ymd, data)) {
    for (
      let start = window.start;
      addMinutes(start, durationMinutes) <= window.end;
      start = addMinutes(start, rules.slotMinutes)
    ) {
      const slot = { start, end: addMinutes(start, durationMinutes) };
      if (slot.start < earliest) continue;
      if (data.blocked.some((period) => overlaps(slot, period))) continue;
      if (buffered.some((item) => overlaps(slot, item))) continue;
      slots.push(slot);
    }
  }
  return slots;
}

/** Number of bookable slots for each Cairo calendar day in [fromYmd, toYmd]. */
export function countSlotsByDay(
  fromYmd: string,
  toYmd: string,
  durationMinutes: number,
  data: AvailabilityData,
  options: SlotOptions,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (let ymd = fromYmd; ymd <= toYmd; ymd = addDaysYmd(ymd, 1)) {
    result[ymd] = computeDaySlots(ymd, durationMinutes, data, options).length;
  }
  return result;
}

/** UTC range covering a list of Cairo days, padded so buffers at the edges are seen. */
export function dataRangeForDays(fromYmd: string, toYmd: string, paddingMinutes: number): Interval {
  return {
    start: addMinutes(startOfCairoDay(fromYmd), -paddingMinutes),
    end: addMinutes(startOfCairoDay(addDaysYmd(toYmd, 1)), paddingMinutes),
  };
}

