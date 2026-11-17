import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { monthAvailability } from "@/lib/booking";

export const dynamic = "force-dynamic";

/** GET /api/availability?treatmentId=…&month=YYYY-MM → number of bookable slots per day. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const treatmentId = searchParams.get("treatmentId") ?? "";
  const month = searchParams.get("month") ?? "";

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return NextResponse.json({ error: "شهر غير صالح" }, { status: 400 });
  }
  const treatment = treatmentId
    ? await prisma.treatment.findUnique({ where: { id: treatmentId }, select: { durationMinutes: true } })
    : null;
  if (!treatment) {
    return NextResponse.json({ error: "نوع الزيارة غير موجود" }, { status: 400 });
  }

  const result = await monthAvailability(month, treatment.durationMinutes);
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
