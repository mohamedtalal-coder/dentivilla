"use client";

import { Trash2 } from "lucide-react";
import {
  addBlockedPeriod,
  addExtraSlot,
  removeBlockedPeriod,
  removeExtraSlot,
  saveAvailabilitySettings,
  saveWorkingHours,
  type ActionResult,
} from "@/app/actions/admin";
import { ActionFeedback, useAdminAction } from "@/components/admin/useAdminAction";

type Hours = { weekday: number; enabled: boolean; startTime: string; endTime: string; label: string };
type Settings = { slotMinutes: number; bufferMinutes: number; bookingLeadHours: number; bookingHorizonDays: number };
type Item = { id: string; label: string };

export function AvailabilityForms({
  settings,
  hours,
  blocked,
  extras,
}: {
  settings: Settings;
  hours: Hours[];
  blocked: Item[];
  extras: Item[];
}) {
  return (
    <div className="grid gap-6">
      <SettingsForm settings={settings} />
      <section className="card-soft rounded-3xl p-5 sm:p-6">
        <h2 className="heading-md">Working Days & Clinic Hours</h2>
        <p className="mt-1 text-sm text-muted">All times are Cairo time. These hours are displayed to patients and used to calculate available appointment slots.</p>
        <div className="mt-5 grid gap-2">
          {hours.map((item) => (
            <WorkingDayRow key={item.weekday} item={item} />
          ))}
        </div>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <PeriodSection
          title="Block a Period"
          description="Vacations, conferences, or temporary clinic closures. Existing appointments are not automatically cancelled."
          items={blocked}
          extraField={{ name: "reason", label: "Reason", required: true }}
          submitLabel="Add Blocked Period"
          onAdd={(values) => addBlockedPeriod({ ...values, reason: values.reason })}
          onRemove={removeBlockedPeriod}
        />
        <PeriodSection
          title="Extra Working Slot"
          description="Opens slots for booking outside standard working hours (such as a special Friday clinic)."
          items={extras}
          extraField={{ name: "note", label: "Note (Optional)", required: false }}
          submitLabel="Add Extra Slot"
          onAdd={(values) => addExtraSlot({ ...values, note: values.note })}
          onRemove={removeExtraSlot}
        />
      </div>
    </div>
  );
}

function SettingsForm({ settings }: { settings: Settings }) {
  const { pending, result, run } = useAdminAction();
  return (
    <form
      className="card-soft grid gap-4 rounded-3xl p-5 sm:p-6 md:grid-cols-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        run(() =>
          saveAvailabilitySettings({
            slotMinutes: Number(form.get("slotMinutes")),
            bufferMinutes: Number(form.get("bufferMinutes")),
            bookingLeadHours: Number(form.get("bookingLeadHours")),
            bookingHorizonDays: Number(form.get("bookingHorizonDays")),
          }),
        );
      }}
    >
      <h2 className="heading-md md:col-span-4">Booking Rules & Parameters</h2>
      <label className="text-sm">
        <span className="field-label">Slot Interval (Minutes)</span>
        <select name="slotMinutes" defaultValue={settings.slotMinutes} className="field">
          {[10, 15, 20, 30, 45, 60].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        <span className="field-label">Buffer Between Appointments (Minutes)</span>
        <input name="bufferMinutes" type="number" min={0} max={60} defaultValue={settings.bufferMinutes} className="field" />
      </label>
      <label className="text-sm">
        <span className="field-label">Minimum Notice Lead Time (Hours)</span>
        <input name="bookingLeadHours" type="number" min={0} max={72} defaultValue={settings.bookingLeadHours} className="field" />
      </label>
      <label className="text-sm">
        <span className="field-label">Booking Horizon (Days Ahead)</span>
        <input name="bookingHorizonDays" type="number" min={7} max={120} defaultValue={settings.bookingHorizonDays} className="field" />
      </label>
      <p className="text-xs text-muted md:col-span-4">
        Appointment duration is defined per treatment. The buffer is clean-up/prep time automatically reserved before and after every appointment.
      </p>
      <div className="flex items-center gap-4 md:col-span-4">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save Booking Rules"}
        </button>
        <ActionFeedback result={result} />
      </div>
    </form>
  );
}

function WorkingDayRow({ item }: { item: Hours }) {
  const { pending, result, run } = useAdminAction();
  return (
    <form
      className="grid items-center gap-3 rounded-2xl border border-line p-3 sm:grid-cols-[110px_auto_1fr_1fr_auto]"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        run(() =>
          saveWorkingHours({
            weekday: item.weekday,
            enabled: form.get("enabled") === "on",
            startTime: String(form.get("startTime")),
            endTime: String(form.get("endTime")),
          }),
        );
      }}
    >
      <p className="font-semibold text-teal-deep">{item.label}</p>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="enabled" defaultChecked={item.enabled} className="size-4 accent-teal" />
        Open
      </label>
      <label className="text-sm">
        <span className="sr-only">From</span>
        <input name="startTime" type="time" defaultValue={item.startTime} className="field py-2" aria-label={`Start time for ${item.label}`} />
      </label>
      <label className="text-sm">
        <span className="sr-only">To</span>
        <input name="endTime" type="time" defaultValue={item.endTime} className="field py-2" aria-label={`End time for ${item.label}`} />
      </label>
      <button type="submit" className="btn-secondary px-4 py-2" disabled={pending}>
        {pending ? "…" : "Save"}
      </button>
      {result && (
        <div className="sm:col-span-5">
          <ActionFeedback result={result} />
        </div>
      )}
    </form>
  );
}

function PeriodSection({
  title,
  description,
  items,
  extraField,
  submitLabel,
  onAdd,
  onRemove,
}: {
  title: string;
  description: string;
  items: Item[];
  extraField: { name: string; label: string; required: boolean };
  submitLabel: string;
  onAdd: (values: Record<string, string>) => Promise<ActionResult>;
  onRemove: (id: string) => Promise<ActionResult>;
}) {
  const add = useAdminAction();
  const remove = useAdminAction();
  return (
    <section className="card-soft rounded-3xl p-5 sm:p-6">
      <h2 className="heading-md">{title}</h2>
      <p className="mt-1 text-sm text-muted">{description}</p>
      <form
        className="mt-4 grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const formElement = event.currentTarget;
          const form = new FormData(formElement);
          add.run(
            () =>
              onAdd({
                startsAt: String(form.get("startsAt") ?? ""),
                endsAt: String(form.get("endsAt") ?? ""),
                [extraField.name]: String(form.get(extraField.name) ?? ""),
              }),
            () => formElement.reset(),
          );
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="field-label">From (Cairo time)</span>
            <input name="startsAt" type="datetime-local" required className="field" />
          </label>
          <label className="text-sm">
            <span className="field-label">To</span>
            <input name="endsAt" type="datetime-local" required className="field" />
          </label>
        </div>
        <label className="text-sm">
          <span className="field-label">{extraField.label}</span>
          <input name={extraField.name} required={extraField.required} maxLength={120} className="field" />
        </label>
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" className="btn-primary" disabled={add.pending}>
            {add.pending ? "Adding…" : submitLabel}
          </button>
          <ActionFeedback result={add.result} />
        </div>
      </form>
      <ul className="mt-5 grid gap-2 text-sm">
        {items.length === 0 && <li className="text-muted">No entries added.</li>}
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-ivory px-3 py-2.5">
            <span>{item.label}</span>
            <button
              type="button"
              className="grid size-8 shrink-0 place-items-center rounded-full text-red-700 hover:bg-red-50 disabled:opacity-40"
              aria-label={`Delete: ${item.label}`}
              disabled={remove.pending}
              onClick={() => remove.run(() => onRemove(item.id))}
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2">
        <ActionFeedback result={remove.result} />
      </div>
    </section>
  );
}
