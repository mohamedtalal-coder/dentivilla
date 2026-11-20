"use client";

import { useEffect, useState } from "react";
import type { AppointmentStatus } from "@prisma/client";
import { rescheduleAppointment, setAppointmentStatus } from "@/app/actions/admin";
import { ActionFeedback, useAdminAction } from "@/components/admin/useAdminAction";
import type { PublicSlot } from "@/lib/booking-types";

const ACTIONS: Record<AppointmentStatus, { status: AppointmentStatus; label: string; tone: "primary" | "danger" | "neutral" }[]> = {
  PENDING: [
    { status: "CONFIRMED", label: "Confirm Appointment", tone: "primary" },
    { status: "REJECTED", label: "Decline Request", tone: "danger" },
  ],
  CONFIRMED: [
    { status: "COMPLETED", label: "Mark Completed", tone: "primary" },
    { status: "CANCELLED", label: "Cancel Appointment", tone: "danger" },
  ],
  REJECTED: [],
  CANCELLED: [],
  COMPLETED: [],
};

export function AppointmentActions({
  id,
  treatmentId,
  status,
}: {
  id: string;
  treatmentId: string;
  status: AppointmentStatus;
}) {
  const statusAction = useAdminAction();
  const reschedule = useAdminAction();
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");
  const [slotsState, setSlotsState] = useState<{ key: string; slots: PublicSlot[]; failed?: boolean }>({ key: "", slots: [] });
  const slotsKey = date ? `${date}|${treatmentId}` : "";

  useEffect(() => {
    if (!date) return;
    const controller = new AbortController();
    fetch(`/api/slots?${new URLSearchParams({ date, treatmentId })}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error())))
      .then((payload: { slots: PublicSlot[] }) => setSlotsState({ key: slotsKey, slots: payload.slots }))
      .catch((err: unknown) => {
        if ((err as Error).name !== "AbortError") setSlotsState({ key: slotsKey, slots: [], failed: true });
      });
    return () => controller.abort();
  }, [date, treatmentId, slotsKey]);

  const actions = ACTIONS[status];
  const canReschedule = status === "PENDING" || status === "CONFIRMED";
  const loadingSlots = Boolean(date) && slotsState.key !== slotsKey;

  return (
    <div className="grid gap-6">
      {actions.length > 0 && (
        <section className="grid gap-3">
          <label htmlFor="admin-note" className="field-label">
            Internal admin note with this action (optional)
          </label>
          <textarea id="admin-note" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="field" />
          <div className="flex flex-wrap items-center gap-2">
            {actions.map((action) => (
              <button
                key={action.status}
                type="button"
                disabled={statusAction.pending}
                onClick={() => {
                  if (action.tone === "danger" && !window.confirm(`${action.label}?`)) return;
                  statusAction.run(() => setAppointmentStatus(id, action.status, notes), () => setNotes(""));
                }}
                className={
                  action.tone === "primary"
                    ? "btn-primary"
                    : "btn border border-red-200 bg-white text-red-700 hover:bg-red-50"
                }
              >
                {action.label}
              </button>
            ))}
            <ActionFeedback result={statusAction.result} />
          </div>
        </section>
      )}

      {canReschedule && (
        <section className="rounded-2xl bg-ivory p-4">
          <h2 className="font-semibold text-teal-deep">Reschedule Appointment</h2>
          <p className="mt-1 text-sm text-muted">Displays live bookable slots based on clinic working hours, bookings, and blocked periods.</p>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="field mt-3 w-auto"
            aria-label="New appointment date"
          />
          <div className="mt-3 flex flex-wrap gap-2" aria-live="polite">
            {loadingSlots && <span className="text-sm text-muted">Loading slots…</span>}
            {!loadingSlots && date && slotsState.failed && <span className="text-sm text-red-700">Failed to load slots.</span>}
            {!loadingSlots && date && !slotsState.failed && slotsState.slots.length === 0 && (
              <span className="text-sm text-muted">No slots available on this day.</span>
            )}
            {!loadingSlots &&
              slotsState.slots.map((slot) => (
                <button
                  key={slot.startsAt}
                  type="button"
                  disabled={reschedule.pending}
                  className="rounded-full border border-line bg-white px-3.5 py-1.5 font-mono text-sm hover:border-teal"
                  onClick={() => {
                    if (window.confirm(`Move appointment to ${slot.label}?`)) {
                      reschedule.run(() => rescheduleAppointment(id, slot.startsAt), () => setDate(""));
                    }
                  }}
                >
                  {slot.label}
                </button>
              ))}
          </div>
          <div className="mt-2">
            <ActionFeedback result={reschedule.result} />
          </div>
        </section>
      )}
    </div>
  );
}
