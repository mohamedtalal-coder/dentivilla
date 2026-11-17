import Link from "next/link";
import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { cairoYmd, formatCairoDateTime, startOfCairoDay } from "@/lib/datetime";
import { listPublicSlots } from "@/lib/booking";
import { statusLabel } from "@/lib/labels";

export default async function AdminHomePage() {
  const now = new Date();
  const startToday = startOfCairoDay(cairoYmd(now));
  const endToday = addDays(startToday, 1);

  const [today, pending, patients, treatments] = await Promise.all([
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
    prisma.treatment.findMany(),
  ]);

  let weekSlots = 0;
  for (let i = 0; i < 7; i += 1) {
    const day = addDays(now, i);
    const slots = await listPublicSlots(
      cairoYmd(day),
      treatments[0]?.durationMinutes ?? 45,
    );
    weekSlots += slots.length;
  }

  const pendingList = await prisma.appointment.findMany({
    where: { status: "PENDING" },
    include: { patient: true, treatment: true },
    orderBy: { startsAt: "asc" },
    take: 8,
  });

  const cards = [
    { label: "مواعيد اليوم", value: today.length },
    { label: "طلبات معلّقة", value: pending },
    { label: "أوقات متاحة هذا الأسبوع", value: weekSlots },
    { label: "إجمالي المرضى", value: patients },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-teal-deep">لوحة Dentivilla</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="card-soft rounded-[24px] p-5">
            <p className="text-sm text-muted">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-teal-deep">{card.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card-soft rounded-[24px] p-5">
          <h2 className="font-bold text-teal-deep">اليوم</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {today.length === 0 && <li className="text-muted">لا مواعيد اليوم.</li>}
            {today.map((item) => (
              <li key={item.id}>
                <Link href={`/admin/appointments/${item.id}`} className="hover:underline">
                  {formatCairoDateTime(item.startsAt)} — {item.patient.fullName} —{" "}
                  {item.treatment.nameAr} ({statusLabel[item.status]})
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="card-soft rounded-[24px] p-5">
          <h2 className="font-bold text-teal-deep">طلبات تحتاج مراجعة</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {pendingList.length === 0 && <li className="text-muted">لا طلبات معلّقة.</li>}
            {pendingList.map((item) => (
              <li key={item.id}>
                <Link href={`/admin/appointments/${item.id}`} className="hover:underline">
                  {item.reference} — {item.patient.fullName} — {item.treatment.nameAr}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
