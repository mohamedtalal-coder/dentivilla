import Link from "next/link";
import { addDays } from "date-fns";
import { CalendarDays, Sparkles } from "lucide-react";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { cairoYmd, formatCairoDateTime, startOfCairoDay } from "@/lib/datetime";
import { listPublicSlots } from "@/lib/booking";
import { decryptAppointmentWithPatient } from "@/lib/encryption";
import { statusLabel } from "@/lib/labels";
import { NewAppointmentModal } from "@/components/admin/NewAppointmentModal";

export default async function AdminHomePage() {
  await requireAdminSession();
  const now = new Date();
  const startToday = startOfCairoDay(cairoYmd(now));
  const endToday = addDays(startToday, 1);

  const [rawToday, pending, patients, treatments] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        startsAt: { gte: startToday, lt: endToday },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      include: { patient: true, treatment: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.appointment.count({ where: { status: "PENDING" } }),
    prisma.patient.count(),
    prisma.treatment.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { appointments: true },
        },
      },
    }),
  ]);

  const today = rawToday.map(decryptAppointmentWithPatient);

  let weekSlots = 0;
  for (let i = 0; i < 7; i += 1) {
    const day = addDays(now, i);
    const slots = await listPublicSlots(
      cairoYmd(day),
      treatments[0]?.durationMinutes ?? 45,
    );
    weekSlots += slots.length;
  }

  const rawPendingList = await prisma.appointment.findMany({
    where: { status: "PENDING" },
    include: { patient: true, treatment: true },
    orderBy: { startsAt: "asc" },
    take: 8,
  });

  const pendingList = rawPendingList.map(decryptAppointmentWithPatient);

  const cards = [
    { label: "مواعيد اليوم", value: today.length },
    { label: "طلبات معلّقة", value: pending },
    { label: "أوقات متاحة هذا الأسبوع", value: weekSlots },
    { label: "إجمالي المرضى", value: patients },
  ];

  return (
    <div className="space-y-8">
      {/* Top Bar with New Appointment */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-teal-deep">لوحة Dentivilla</h1>
          <p className="mt-1 text-sm text-muted">
            نظرة عامة على مواعيد اليوم، والطلبات المعلّقة، والخدمات الأكثر طلباً في العيادة.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NewAppointmentModal treatments={treatments} />
          <Link href="/admin/calendar" className="btn-secondary px-4 py-2 text-sm">
            <CalendarDays className="size-4" aria-hidden />
            التقويم
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="card-soft rounded-[24px] p-5">
            <p className="text-sm text-muted">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-teal-deep">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Reservation Types Breakdown */}
      <section className="card-soft rounded-[28px] p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4 mb-4">
          <div>
            <h2 className="heading-sm flex items-center gap-2 text-teal-deep">
              <Sparkles className="size-5 text-teal" />
              الخدمات والعلاجات الأكثر طلباً
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              توزيع الحجوزات المسجلة حسب نوع الخدمة أو سبب الزيارة.
            </p>
          </div>
          <Link
            href="/admin/treatments"
            className="text-xs font-semibold text-teal-mid hover:underline"
          >
            إدارة العلاجات ←
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {treatments.map((item) => (
            <Link
              key={item.id}
              href={`/admin/appointments?treatment=${item.slug}`}
              className="group flex flex-col justify-between rounded-2xl border border-line bg-white p-4 transition-all hover:border-teal hover:shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-teal-deep group-hover:text-teal">
                    {item.nameAr}
                  </span>
                  <span className="rounded-full bg-teal-light px-2 py-0.5 font-mono text-xs font-bold text-teal-deep">
                    {item._count.appointments}
                  </span>
                </div>
                <p className="mt-1 line-clamp-1 text-xs text-muted">
                  {item.summaryAr}
                </p>
              </div>
              <span className="mt-3 text-[11px] text-teal-mid font-medium group-hover:underline">
                عرض المواعيد ({item._count.appointments}) ←
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Today and Pending Appointments */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card-soft rounded-[28px] p-6">
          <h2 className="heading-sm text-teal-deep">مواعيد اليوم</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {today.length === 0 && <li className="text-muted text-xs">لا توجد مواعيد مجدولة اليوم.</li>}
            {today.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white p-3 hover:border-teal/40 transition-colors"
              >
                <div>
                  <Link href={`/admin/appointments/${item.id}`} className="font-semibold text-teal-deep hover:underline">
                    {item.patient.fullName}
                  </Link>
                  <p className="text-xs text-muted mt-0.5">
                    {formatCairoDateTime(item.startsAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-teal/20 bg-teal-light/60 px-2.5 py-0.5 text-xs font-semibold text-teal-deep">
                    <Sparkles className="size-3 text-teal" />
                    {item.treatment.nameAr}
                  </span>
                  <span className="chip text-[11px] border-line bg-ivory">
                    {statusLabel[item.status]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card-soft rounded-[28px] p-6">
          <h2 className="heading-sm text-teal-deep">طلبات تحتاج مراجعة</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {pendingList.length === 0 && <li className="text-muted text-xs">لا توجد طلبات معلّقة.</li>}
            {pendingList.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white p-3 hover:border-teal/40 transition-colors"
              >
                <div>
                  <Link href={`/admin/appointments/${item.id}`} className="font-semibold text-teal-deep hover:underline">
                    {item.patient.fullName}
                  </Link>
                  <p className="font-mono text-xs text-muted mt-0.5" dir="ltr">
                    {item.reference} • {formatCairoDateTime(item.startsAt)}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-teal/20 bg-teal-light/60 px-2.5 py-0.5 text-xs font-semibold text-teal-deep">
                  <Sparkles className="size-3 text-teal" />
                  {item.treatment.nameAr}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
