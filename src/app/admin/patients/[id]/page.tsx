import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCairoDateTime } from "@/lib/datetime";
import { formatTeeth } from "@/lib/teeth";
import { statusLabel } from "@/lib/labels";
import { PatientNotesForm } from "@/components/admin/PatientNotesForm";

export default async function PatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      appointments: {
        include: { treatment: true },
        orderBy: { startsAt: "desc" },
      },
    },
  });
  if (!patient) notFound();

  return (
    <div className="space-y-6">
      <div className="card-soft rounded-[28px] p-6">
        <h1 className="text-3xl font-bold text-teal-deep">{patient.fullName}</h1>
        <p className="mt-2 text-muted">
          {patient.phone} {patient.whatsapp ? `— واتساب ${patient.whatsapp}` : ""}
        </p>
        <PatientNotesForm id={patient.id} notes={patient.notes ?? ""} />
      </div>
      <div className="card-soft rounded-[28px] p-6">
        <h2 className="font-bold text-teal-deep">سجل المواعيد</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {patient.appointments.map((item) => (
            <li key={item.id}>
              <Link href={`/admin/appointments/${item.id}`} className="hover:underline">
                {item.reference} — {formatCairoDateTime(item.startsAt)} — {item.treatment.nameAr}{" "}
                — {statusLabel[item.status]}
                {item.teeth.length ? ` — ${formatTeeth(item.teeth)}` : ""}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
