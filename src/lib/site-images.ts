import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type SiteImageSlotDef = {
  key: string;
  labelAr: string;
  locationAr: string;
  recommendedSize: string;
  defaultUrl: string;
  multiple?: boolean;
};

export const CORE_IMAGE_SLOTS: readonly SiteImageSlotDef[] = [
  {
    key: "doctor",
    labelAr: "صورة د. محمد ياسر الجبالي الشخصية",
    locationAr: "القسم الرئيسي (Hero) في الصفحة الرئيسية وصفحة عن الطبيب",
    recommendedSize: "نسبة 5:6 (مثال: 960 × 1152 بكسل)",
    defaultUrl: "/images/doctor.jpg",
  },
  {
    key: "logo",
    labelAr: "شعار العيادة (Logo)",
    locationAr: "شريط التنقل (Header) وأسفل الموقع (Footer)",
    recommendedSize: "مربع متناسق (مثال: 512 × 512 بكسل، بخلفية شفافة PNG)",
    defaultUrl: "/images/logo.png",
  },
  {
    key: "philosophy",
    labelAr: "معرض صور فلسفة العيادة («ابتسامتك لا تتكرر»)",
    locationAr: "قسم الفلسفة بالصفحة الرئيسية (معرض صور متعددة)",
    recommendedSize: "نسبة 4:5 (مثال: 800 × 1000 بكسل)",
    defaultUrl: "/images/teeth/incisor.webp",
    multiple: true,
  },
  {
    key: "about",
    labelAr: "صورة قسم عن الطبيب والعيادة",
    locationAr: "صفحة عن الطبيب (القسم السفلي)",
    recommendedSize: "أفقي أو شفاف (مثال: 800 × 600 بكسل)",
    defaultUrl: "/images/teeth/molar.webp",
  },
] as const;

export type SiteImagesMap = {
  doctor: string;
  logo: string;
  philosophy: string;
  philosophyImages: string[];
  about: string;
  [key: string]: string | string[];
};

/**
 * Returns a map of current URLs for all website image slots.
 * Falls back to default static images if no custom image is configured.
 * Cached per request.
 */
export const getSiteImages = cache(async (): Promise<SiteImagesMap> => {
  const result: Record<string, string | string[]> = {};
  for (const slot of CORE_IMAGE_SLOTS) {
    result[slot.key] = slot.defaultUrl;
    if (slot.multiple) {
      result[`${slot.key}Images`] = [];
    }
  }

  try {
    const rows = await prisma.siteImage.findMany({
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    for (const row of rows) {
      const itemUrls: string[] = [];
      if (row.items && row.items.length > 0) {
        for (const item of row.items) {
          if (item.mediaId) itemUrls.push(`/media/${item.mediaId}`);
          else if (item.customUrl) itemUrls.push(item.customUrl);
        }
      }

      if (itemUrls.length > 0) {
        result[`${row.id}Images`] = itemUrls;
        result[row.id] = itemUrls[0];
      } else if (row.mediaId) {
        result[row.id] = `/media/${row.mediaId}`;
        result[`${row.id}Images`] = [`/media/${row.mediaId}`];
      } else if (row.customUrl) {
        result[row.id] = row.customUrl;
        result[`${row.id}Images`] = [row.customUrl];
      }
    }
  } catch (error) {
    console.warn("Could not query SiteImage from database, using static defaults:", error);
  }

  return result as SiteImagesMap;
});
