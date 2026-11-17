import { prisma } from "@/lib/prisma";

const mediaUrl = (id: string) => `/media/${id}`;

export type PublicCase = {
  id: string;
  title: string;
  description: string | null;
  treatmentSlug: string | null;
  beforeSrc: string;
  afterSrc: string;
};

const toPublic = (c: {
  id: string;
  titleAr: string;
  descriptionAr: string | null;
  treatmentSlug: string | null;
  beforeMediaId: string;
  afterMediaId: string;
}): PublicCase => ({
  id: c.id,
  title: c.titleAr,
  description: c.descriptionAr,
  treatmentSlug: c.treatmentSlug,
  beforeSrc: mediaUrl(c.beforeMediaId),
  afterSrc: mediaUrl(c.afterMediaId),
});

/** Published cases (consent is required to publish), in admin-defined order. */
export async function getPublishedCases() {
  try {
    const rows = await prisma.beforeAfterCase.findMany({
      where: { published: true, consentOnFile: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return rows.map(toPublic);
  } catch (error) {
    console.warn("Could not query cases from database, using fallback:", error);
    return [];
  }
}

/** The homepage case: the featured one, else the first published one. */
export async function getFeaturedCase() {
  try {
    const row =
      (await prisma.beforeAfterCase.findFirst({ where: { published: true, consentOnFile: true, featured: true } })) ??
      (await prisma.beforeAfterCase.findFirst({
        where: { published: true, consentOnFile: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      }));
    return row ? toPublic(row) : null;
  } catch (error) {
    console.warn("Could not query featured case from database, using fallback:", error);
    return null;
  }
}
