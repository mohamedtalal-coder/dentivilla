import { prisma } from "@/lib/prisma";

export type PublicOffer = {
  id: string;
  badge: string;
  titleAr: string;
  descriptionAr: string;
  price: number;
  originalPrice: number | null;
  treatmentSlug: string | null;
  sortOrder: number;
};

export async function getPublicOffers(): Promise<PublicOffer[]> {
  try {
    const offers = await prisma.offer.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        badge: true,
        titleAr: true,
        descriptionAr: true,
        price: true,
        originalPrice: true,
        treatmentSlug: true,
        sortOrder: true,
      },
    });
    return offers;
  } catch (error) {
    console.warn("Could not query offers from database, returning default fallback:", error);
    return [
      {
        id: "default-whitening",
        badge: "عرض White Friday",
        titleAr: "تبييض الأسنان في العيادة — جلسة واحدة",
        descriptionAr: "يشمل تسجيل درجة اللون قبل وبعد الجلسة وإرشادات العناية.",
        price: 2000,
        originalPrice: 2800,
        treatmentSlug: "whitening",
        sortOrder: 1,
      },
    ];
  }
}
