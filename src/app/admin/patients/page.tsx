import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function PatientsPage() {
  const patients = await prisma.patient.findMany({
    include: { _count: { select: { appointments: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-teal-deep">المرضى</h1>
      <div className="mt-6 overflow-x-auto card-soft rounded-[24px]">
        <table className="w-full min-w-[640px] text-right text-sm">
          <thead className="bg-ivory text-teal">
            <tr>
              <th className="p-3">الاسم</th>
              <th className="p-3">الهاتف</th>
              <th className="p-3">واتساب</th>
              <th className="p-3">المواعيد</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.id} className="border-t border-[rgba(15,79,76,0.08)]">
                <td className="p-3">
                  <Link className="text-teal" href={`/admin/patients/${patient.id}`}>
                    {patient.fullName}
                  </Link>
                </td>
                <td className="p-3">{patient.phone}</td>
                <td className="p-3">{patient.whatsapp ?? "—"}</td>
                <td className="p-3">{patient._count.appointments}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
