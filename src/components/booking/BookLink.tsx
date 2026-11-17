"use client";

import Link from "next/link";
import { bookingHref, requestBooking, type BookingIntent } from "@/lib/booking-intent";

/** A booking call-to-action that preselects a treatment, in-page when possible. */
export function BookLink({
  intent = {},
  className,
  children,
}: {
  intent?: BookingIntent;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={bookingHref(intent)}
      className={className}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
        if (requestBooking(intent)) event.preventDefault();
      }}
    >
      {children}
    </Link>
  );
}
