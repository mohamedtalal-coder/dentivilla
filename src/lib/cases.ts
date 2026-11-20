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

const DEFAULT_CASES: PublicCase[] = [
  {
    id: "demo-1",
    title: "Smile Design & Aesthetics",
    description: "Harmonizing tooth shade and alignment while fully preserving natural tooth structure.",
    treatmentSlug: "smile-makeover",
    beforeSrc: "/images/smile_before.jpg",
    afterSrc: "/images/smile_after.jpg",
  },
  {
    id: "demo-2",
    title: "Teeth Whitening & Smile Brightening",
    description: "Lightening shade and lifting deep stains in a comfortable in-clinic session.",
    treatmentSlug: "whitening",
    beforeSrc: "/images/smile_before.jpg",
    afterSrc: "/images/smile_after.jpg",
  },
  {
    id: "demo-3",
    title: "Anterior Cosmetic Restorations",
    description: "Precision treatment under magnification to close diastemas and restore natural contours.",
    treatmentSlug: "restorative",
    beforeSrc: "/images/smile_before.jpg",
    afterSrc: "/images/smile_after.jpg",
  },
  {
    id: "demo-4",
    title: "Comprehensive Smile Rehabilitation",
    description: "A calculated balance between biomechanics and aesthetic brilliance for a natural radiant smile.",
    treatmentSlug: "veneers",
    beforeSrc: "/images/smile_before.jpg",
    afterSrc: "/images/smile_after.jpg",
  },
];

/** Fetch up to `limit` cases for the homepage carousel directly from the database. */
export async function getHomepageCases(limit = 6): Promise<PublicCase[]> {
  try {
    const rows = await prisma.beforeAfterCase.findMany({
      where: { published: true, consentOnFile: true },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
      take: limit,
    });
    const publicRows = rows.map(toPublic);
    if (publicRows.length > 0) return publicRows;
    return DEFAULT_CASES.slice(0, limit);
  } catch (error) {
    console.warn("Could not query homepage cases from database, using fallback:", error);
    return DEFAULT_CASES.slice(0, limit);
  }
}
