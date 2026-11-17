/** Client-safe booking types (no server imports). */
export type PublicSlot = {
  startsAt: string;
  endsAt: string;
  label: string;
};

export type BookingErrorCode = "VALIDATION" | "SLOT_TAKEN" | "SLOT_INVALID" | "NOT_FOUND" | "SERVER";

export type BookingResult =
  | { ok: true; reference: string; startsAt: string }
  | { ok: false; error: string; code: BookingErrorCode; field?: string };
