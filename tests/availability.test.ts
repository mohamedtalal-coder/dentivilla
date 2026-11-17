import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fromZonedTime } from "date-fns-tz";
import {
  computeDaySlots,
  countSlotsByDay,
  openingWindows,
  weekdayOfYmd,
  type AvailabilityData,
} from "../src/lib/availability";
import { normalizeEgyptianMobile, toLatinDigits } from "../src/lib/phone";

const cairo = (ymd: string, hhmm: string) => fromZonedTime(`${ymd}T${hhmm}:00`, "Africa/Cairo");
const label = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit" }).format(d);

// 2026-12-02 is a Wednesday; 2026-12-04 is a Friday.
const DAY = "2026-12-02";
const NOW = cairo("2026-11-30", "09:00"); // well before DAY, so lead time doesn't interfere

function data(overrides: Partial<AvailabilityData> = {}): AvailabilityData {
  return {
    rules: { slotMinutes: 30, bufferMinutes: 0, bookingLeadHours: 4, bookingHorizonDays: 30 },
    workingHours: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
      weekday,
      enabled: weekday !== 5,
      startTime: "10:00",
      endTime: "14:00",
    })),
    blocked: [],
    extra: [],
    busy: [],
    ...overrides,
  };
}

const slotsFor = (d: AvailabilityData, duration = 60, ymd = DAY, now = NOW) =>
  computeDaySlots(ymd, duration, d, { now }).map((s) => label(s.start));

describe("working hours and duration", () => {
  it("offers starts on the grid where the whole treatment fits before closing", () => {
    // 10:00–14:00, 60-minute treatment, 30-minute grid → last start 13:00
    assert.deepEqual(slotsFor(data()), ["10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00"]);
  });

  it("longer treatments get fewer, later-ending-safe slots", () => {
    assert.deepEqual(slotsFor(data(), 120), ["10:00", "10:30", "11:00", "11:30", "12:00"]);
  });

  it("closed weekdays offer nothing", () => {
    assert.equal(weekdayOfYmd("2026-12-04"), 5);
    assert.deepEqual(slotsFor(data(), 60, "2026-12-04"), []);
  });

  it("a treatment longer than the opening window offers nothing", () => {
    assert.deepEqual(slotsFor(data(), 300), []);
  });

  it("ignores an inverted working day (end before start)", () => {
    const d = data({ workingHours: [{ weekday: 3, enabled: true, startTime: "14:00", endTime: "10:00" }] });
    assert.deepEqual(slotsFor(d), []);
  });
});

describe("existing appointments and buffer", () => {
  const busy = [{ start: cairo(DAY, "11:00"), end: cairo(DAY, "12:00") }];

  it("excludes every start that would overlap a held appointment", () => {
    assert.deepEqual(slotsFor(data({ busy })), ["10:00", "12:00", "12:30", "13:00"]);
  });

  it("keeps the buffer clear before and after held appointments", () => {
    const d = data({ busy, rules: { ...data().rules, bufferMinutes: 15 } });
    // 10:00–11:00 would end exactly at 11:00 — inside the 10:45 buffer, so it goes;
    // 12:00 starts inside the trailing buffer (until 12:15), so it goes too.
    assert.deepEqual(slotsFor(d), ["12:30", "13:00"]);
  });

  it("back-to-back appointments are allowed when buffer is zero", () => {
    assert.ok(slotsFor(data({ busy })).includes("10:00"));
    assert.ok(slotsFor(data({ busy })).includes("12:00"));
  });
});

describe("blocked periods", () => {
  it("removes slots overlapping a block, including partial overlaps", () => {
    const blocked = [{ start: cairo(DAY, "12:15"), end: cairo(DAY, "12:45") }];
    assert.deepEqual(slotsFor(data({ blocked })), ["10:00", "10:30", "11:00", "13:00"]);
  });

  it("a whole-day block empties the day", () => {
    const blocked = [{ start: cairo(DAY, "00:00"), end: cairo("2026-12-03", "00:00") }];
    assert.deepEqual(slotsFor(data({ blocked })), []);
  });
});

describe("extra windows", () => {
  it("open a closed day", () => {
    const extra = [{ start: cairo("2026-12-04", "16:00"), end: cairo("2026-12-04", "18:00") }];
    assert.deepEqual(slotsFor(data({ extra }), 60, "2026-12-04"), ["16:00", "16:30", "17:00"]);
  });

  it("merge with overlapping working hours instead of duplicating starts", () => {
    const extra = [{ start: cairo(DAY, "13:00"), end: cairo(DAY, "15:00") }];
    const windows = openingWindows(DAY, data({ extra }));
    assert.equal(windows.length, 1);
    assert.equal(label(windows[0].end), "15:00");
    const slots = slotsFor(data({ extra }));
    assert.equal(new Set(slots).size, slots.length);
    assert.equal(slots.at(-1), "14:00");
  });
});

describe("lead time and horizon", () => {
  it("hides starts inside the lead window", () => {
    const now = cairo(DAY, "08:30"); // + 4h lead → earliest 12:30
    assert.deepEqual(slotsFor(data(), 60, DAY, now), ["12:30", "13:00"]);
  });

  it("hides days past the horizon", () => {
    const d = data({ rules: { ...data().rules, bookingHorizonDays: 1 } });
    assert.deepEqual(slotsFor(d), []); // DAY is 2 days after NOW
  });

  it("admins may ignore lead time", () => {
    const now = cairo(DAY, "08:30");
    const slots = computeDaySlots(DAY, 60, data(), { now, ignoreLead: true }).map((s) => label(s.start));
    assert.equal(slots[0], "10:00");
  });

  it("countSlotsByDay matches per-day computation", () => {
    const counts = countSlotsByDay("2026-12-01", "2026-12-05", 60, data(), { now: NOW });
    assert.equal(counts["2026-12-04"], 0); // Friday
    assert.equal(counts[DAY], slotsFor(data()).length);
  });
});

describe("timezone correctness", () => {
  it("slots are Cairo wall-clock times on both sides of the DST change", () => {
    // Egypt observes DST (UTC+3 in summer, UTC+2 in winter).
    const summer = "2026-07-15";
    const winter = "2026-12-02";
    const summerSlots = computeDaySlots(summer, 60, data(), { now: cairo("2026-07-01", "00:00") });
    const winterSlots = computeDaySlots(winter, 60, data(), { now: NOW });
    assert.equal(label(summerSlots[0].start), "10:00");
    assert.equal(label(winterSlots[0].start), "10:00");
    assert.equal(summerSlots[0].start.getUTCHours(), 7); // 10:00 Cairo summer = 07:00 UTC
    assert.equal(winterSlots[0].start.getUTCHours(), 8); // 10:00 Cairo winter = 08:00 UTC
  });
});

describe("phone normalisation", () => {
  it("accepts common Egyptian formats", () => {
    for (const input of ["01012345678", "010 1234 5678", "+201012345678", "00201012345678", "201012345678", "1012345678"]) {
      assert.equal(normalizeEgyptianMobile(input), "01012345678", input);
    }
  });

  it("accepts Arabic-Indic digits", () => {
    assert.equal(toLatinDigits("٠١٢٣"), "0123");
    assert.equal(normalizeEgyptianMobile("٠١١٣٢٠٨١٠٩٣"), "01132081093");
  });

  it("rejects landlines, wrong prefixes and short numbers", () => {
    for (const input of ["0223456789", "01312345678", "12345", "", "abc"]) {
      assert.equal(normalizeEgyptianMobile(input), null, input);
    }
  });
});
