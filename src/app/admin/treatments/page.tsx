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
        <h1 className="text-3xl font-bold text-teal-deep">Treatments & Visit Types</h1>
        <p className="mt-1 text-sm text-muted">
          Manage clinical treatment options and appointment lengths for &ldquo;What is the reason for your visit?&rdquo; in the booking flow.
        </p>
      </div>
      <TreatmentManager initialTreatments={treatments} />
    </div>
  );
}
