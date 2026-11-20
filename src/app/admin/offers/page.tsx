import { prisma } from "@/lib/prisma";
import { OfferManager } from "@/components/admin/OfferManager";
import { requireAdminSession } from "@/lib/admin-auth";

export default async function OffersAdminPage() {
  await requireAdminSession();
  const [offers, treatments] = await Promise.all([
    prisma.offer.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        badge: true,
        titleAr: true,
        descriptionAr: true,
        price: true,
        originalPrice: true,
        treatmentSlug: true,
        active: true,
        sortOrder: true,
      },
    }),
    prisma.treatment.findMany({
      orderBy: { sortOrder: "asc" },
      select: { slug: true, nameAr: true },
    }),
  ]);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold text-teal-deep">العروض والخصومات</h1>
        <p className="mt-1 text-sm text-muted">
          تحكم في العروض الخاصة بالعيادة وتحديد أسعارها، مع إمكانية التفعيل والتعطيل وعرضها في السلايدر المتحرك.
        </p>
      </div>
      <OfferManager offers={offers} treatments={treatments} />
    </div>
  );
}
