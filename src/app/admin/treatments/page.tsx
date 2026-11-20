import { prisma } from "@/lib/prisma";
import { TreatmentManager } from "@/components/admin/TreatmentManager";
import { requireAdminSession } from "@/lib/admin-auth";

export default async function TreatmentsAdminPage() {
  await requireAdminSession();
  const treatments = await prisma.treatment.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      slug: true,
      nameAr: true,
      summaryAr: true,
      descriptionAr: true,
      durationMinutes: true,
      requiresTeeth: true,
      sortOrder: true,
      _count: {
        select: {
          appointments: true,
        },
      },
    },
  });

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold text-teal-deep">العلاجات والخدمات</h1>
        <p className="mt-1 text-sm text-muted">
          إدارة قائمة العلاجات والخدمات السريرية المعروضة في العيادة، وترتيبها، وتعديل تفاصيلها.
        </p>
      </div>
      <TreatmentManager initialTreatments={treatments} />
    </div>
  );
}
