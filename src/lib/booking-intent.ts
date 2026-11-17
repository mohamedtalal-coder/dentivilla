"use client";

export const BOOKING_INTENT_EVENT = "dentivilla:book";

export type BookingIntent = { treatmentSlug?: string; teeth?: string[] };

/**
 * If the booking section is on the current page, hand it the intent and
 * scroll to it; otherwise let the link navigate to /booking?treatment=…
 * Returns true when the intent was handled in-page.
 */
export function requestBooking(intent: BookingIntent): boolean {
  const target = document.getElementById("booking");
  if (!target) return false;
  window.dispatchEvent(new CustomEvent<BookingIntent>(BOOKING_INTENT_EVENT, { detail: intent }));
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

export function bookingHref(intent: BookingIntent) {
  const params = new URLSearchParams();
  if (intent.treatmentSlug) params.set("treatment", intent.treatmentSlug);
  if (intent.teeth?.length) params.set("teeth", intent.teeth.join(","));
  const query = params.toString();
  return `/booking${query ? `?${query}` : ""}`;
}
