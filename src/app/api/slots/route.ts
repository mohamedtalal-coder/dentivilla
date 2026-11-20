import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listPublicSlots } from "@/lib/booking";

export const dynamic = "force-dynamic";

/** GET /api/slots?date=YYYY-MM-DD&treatmentId=… → bookable start times for that Cairo day. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? "";
  const treatmentId = searchParams.get("treatmentId") ?? "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  const treatment = treatmentId
    ? await prisma.treatment.findUnique({ where: { id: treatmentId }, select: { durationMinutes: true } })
    : null;
  if (!treatment) {
    return NextResponse.json({ error: "Treatment not found" }, { status: 400 });
  }

  const slots = await listPublicSlots(date, treatment.durationMinutes);
  return NextResponse.json({ slots }, { headers: { "Cache-Control": "no-store" } });
}
