import { prisma } from "@/lib/prisma";
import type { BookingTreatment } from "@/components/booking/BookingFlow";

/** Plain, client-safe treatment list for the booking flow and marketing sections. */
export async function getBookingTreatments(): Promise<BookingTreatment[]> {
  try {
    const rows = await prisma.treatment.findMany({ orderBy: { sortOrder: "asc" } });
    return rows.map(({ id, slug, nameAr, summaryAr, durationMinutes, requiresTeeth }) => ({
      id,
      slug,
      nameAr,
      summaryAr,
      durationMinutes,
      requiresTeeth,
    }));
  } catch (error) {
    console.warn("Could not query treatments from database, using fallback:", error);
    return [];
  }
}
