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
        badge: "Special Offer",
        titleAr: "In-Clinic Laser Teeth Whitening — Single Session",
        descriptionAr: "Includes pre & post shade analysis, sensitivity prevention, and home maintenance guide.",
        price: 2000,
        originalPrice: 2800,
        treatmentSlug: "whitening",
        sortOrder: 1,
      },
    ];
  }
}
