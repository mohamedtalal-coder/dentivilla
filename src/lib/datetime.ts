import { addMinutes, format } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { TIMEZONE } from "@/lib/site";

export function cairoWeekday(date: Date) {
  return toZonedTime(date, TIMEZONE).getDay();
}

export function cairoYmd(date: Date) {
  return format(toZonedTime(date, TIMEZONE), "yyyy-MM-dd");
}

export function startOfCairoDay(ymd: string) {
  return fromZonedTime(`${ymd}T00:00:00`, TIMEZONE);
}

export function cairoDateTime(ymd: string, hhmm: string) {
  return fromZonedTime(`${ymd}T${hhmm}:00`, TIMEZONE);
}

export function formatCairoTime(date: Date) {
  return format(toZonedTime(date, TIMEZONE), "HH:mm");
}

export function formatCairoDate(date: Date) {
  return new Intl.DateTimeFormat("ar-EG", {
    timeZone: TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatCairoDateTime(date: Date) {
  return new Intl.DateTimeFormat("ar-EG", {
    timeZone: TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function addMinutesUtc(date: Date, minutes: number) {
  return addMinutes(date, minutes);
}

export function parseTimeToMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
