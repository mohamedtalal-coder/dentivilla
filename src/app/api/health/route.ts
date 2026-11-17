import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** GET /api/health → is the database reachable and migrated? Reveals no secrets. */
export async function GET() {
  try {
    const [treatments, admins] = await Promise.all([prisma.treatment.count(), prisma.user.count()]);
    return NextResponse.json(
      { ok: true, database: "connected", seeded: treatments > 0, adminAccount: admins > 0 },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const code = (error as { code?: string; errorCode?: string }).code ?? (error as { errorCode?: string }).errorCode;
    console.error("[health] database check failed:", error);
    return NextResponse.json(
      { ok: false, database: "unreachable", code: code ?? "unknown" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
