import { CaseManager } from "@/components/admin/CaseManager";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export default async function CasesAdminPage() {
  await requireAdminSession();
  const [cases, treatments] = await Promise.all([
    prisma.beforeAfterCase.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        titleAr: true,
        descriptionAr: true,
        treatmentSlug: true,
        beforeMediaId: true,
        afterMediaId: true,
        consentOnFile: true,
        published: true,
        featured: true,
      },
    }),
    prisma.treatment.findMany({ orderBy: { sortOrder: "asc" }, select: { slug: true, nameAr: true } }),
  ]);

  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-bold text-teal-deep">حالات قبل وبعد</h1>
      <CaseManager cases={cases} treatments={treatments} />
    </div>
  );
}
