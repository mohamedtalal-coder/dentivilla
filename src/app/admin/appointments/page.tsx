import Link from "next/link";
import { CalendarDays } from "lucide-react";
import type { AppointmentStatus, Prisma } from "@prisma/client";
import { formatCairoDateTime } from "@/lib/datetime";
import { statusLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

const STATUS_TONE: Record<AppointmentStatus, string> = {
  PENDING: "border-amber/40 bg-amber-light text-amber-dark",
  CONFIRMED: "border-teal/30 bg-teal-light text-teal-deep",
  COMPLETED: "border-line bg-ivory text-muted",
  REJECTED: "border-red-200 bg-red-50 text-red-800",
  CANCELLED: "border-red-200 bg-red-50 text-red-800",
};

const NUM = new Intl.NumberFormat("ar-EG");

type FilterKey = "upcoming" | "pending" | "confirmed" | "past" | "closed" | "all";

function filters(now: Date): Record<FilterKey, { label: string; where: Prisma.AppointmentWhereInput; order: "asc" | "desc" }> {
  return {
    upcoming: { label: "القادمة", where: { startsAt: { gte: now }, status: { in: ["PENDING", "CONFIRMED"] } }, order: "asc" },
    pending: { label: "بانتظار التأكيد", where: { status: "PENDING" }, order: "asc" },
    confirmed: { label: "مؤكدة", where: { status: "CONFIRMED", startsAt: { gte: now } }, order: "asc" },
    past: { label: "السابقة", where: { startsAt: { lt: now } }, order: "desc" },
    closed: { label: "ملغاة ومرفوضة", where: { status: { in: ["CANCELLED", "REJECTED"] } }, order: "desc" },
    all: { label: "الكل", where: {}, order: "desc" },
  };
}

export default async function AppointmentsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
  const now = new Date();
  const all = filters(now);
  const key: FilterKey = filter && filter in all ? (filter as FilterKey) : "upcoming";
  const current = all[key];

  const [appointments, counts] = await Promise.all([
    prisma.appointment.findMany({
      where: current.where,
      include: { patient: true, treatment: true },
      orderBy: { startsAt: current.order },
      take: 200,
    }),
    Promise.all((Object.keys(all) as FilterKey[]).map((k) => prisma.appointment.count({ where: all[k].where }))),
  ]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-teal-deep">الحجوزات</h1>
        <Link href="/admin/calendar" className="btn-secondary px-4 py-2">
          <CalendarDays className="size-4" aria-hidden />
          عرض التقويم
        </Link>
      </div>

      <nav aria-label="تصفية الحجوزات" className="flex flex-wrap gap-2 text-sm">
        {(Object.keys(all) as FilterKey[]).map((k, i) => (
          <Link
            key={k}
            href={`/admin/appointments?filter=${k}`}
            aria-current={k === key ? "page" : undefined}
            className={`rounded-full border px-4 py-2 transition-colors ${
              k === key ? "border-teal-deep bg-teal-deep text-white" : "border-line bg-white hover:border-teal/40"
            }`}
          >
            {all[k].label} <span className="opacity-70">({NUM.format(counts[i])})</span>
          </Link>
        ))}
      </nav>

      {appointments.length === 0 ? (
        <p className="card-soft rounded-3xl p-6 text-sm text-muted">لا توجد حجوزات في هذا القسم.</p>
      ) : (
        <div className="card-soft overflow-x-auto rounded-3xl">
          <table className="w-full min-w-[760px] text-right text-sm">
            <thead className="bg-ivory text-xs text-muted">
              <tr>
                <th className="p-3 font-medium">الموعد</th>
                <th className="p-3 font-medium">المريض</th>
                <th className="p-3 font-medium">العلاج</th>
                <th className="p-3 font-medium">الأسنان</th>
                <th className="p-3 font-medium">الحالة</th>
                <th className="p-3 font-medium">المرجع</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((item) => (
                <tr key={item.id} className="border-t border-line transition-colors hover:bg-teal-light/25">
                  <td className="p-3 whitespace-nowrap">
                    <Link className="font-medium text-teal-deep hover:underline" href={`/admin/appointments/${item.id}`}>
                      {formatCairoDateTime(item.startsAt)}
                    </Link>
                  </td>
                  <td className="p-3">
                    <span className="block font-medium">{item.patient.fullName}</span>
                    <span className="block font-mono text-xs text-muted" dir="ltr">
                      {item.patient.phone}
                    </span>
                  </td>
                  <td className="p-3">{item.treatment.nameAr}</td>
                  <td className="p-3 font-mono text-xs">{item.teeth.length ? item.teeth.join("، ") : "—"}</td>
                  <td className="p-3">
                    <span className={`chip ${STATUS_TONE[item.status]}`}>{statusLabel[item.status]}</span>
                    {item.medicalConditions.length > 0 && (
                      <span className="mt-1 block text-[11px] text-amber-dark">تاريخ مرضي مُبلغ عنه</span>
                    )}
                  </td>
                  <td className="p-3">
                    <Link className="font-mono text-xs text-teal-mid hover:underline" href={`/admin/appointments/${item.id}`} dir="ltr">
                      {item.reference}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
