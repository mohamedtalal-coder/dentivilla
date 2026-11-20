import { prisma } from "@/lib/prisma";
import { weekdayLabels } from "@/lib/site";

export type HoursRow = { days: string; hours: string | null };

// Display order for clinic week: Saturday first.
const WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5];

function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h < 12 ? "AM" : "PM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${period}`;
}

/**
 * Groups consecutive weekdays that share the same working hours,
 * e.g. "Saturday – Thursday: 10:00 AM – 6:00 PM" and "Friday: Closed".
 * Reads the same WorkingHours rows the booking engine uses.
 */
export async function getHoursSummary(): Promise<HoursRow[]> {
  try {
    const rows = await prisma.workingHours.findMany();
    const byDay = new Map(rows.map((row) => [row.weekday, row]));
    const groups: { start: number; end: number; key: string; hours: string | null }[] = [];

    for (const weekday of WEEK_ORDER) {
      const row = byDay.get(weekday);
      const hours = row?.enabled ? `${formatTime(row.startTime)} – ${formatTime(row.endTime)}` : null;
      const key = hours ?? "closed";
      const last = groups[groups.length - 1];
      if (last && last.key === key) {
        last.end = weekday;
      } else {
        groups.push({ start: weekday, end: weekday, key, hours });
      }
    }

    return groups.map((group) => ({
      days:
        group.start === group.end
          ? weekdayLabels[group.start]
          : `${weekdayLabels[group.start]} – ${weekdayLabels[group.end]}`,
      hours: group.hours,
    }));
  } catch (error) {
    console.warn("Could not query working hours from database, using fallback schedule:", error);
    return [
      { days: "Saturday – Thursday", hours: "10:00 AM – 6:00 PM" },
      { days: "Friday", hours: null },
    ];
  }
}
