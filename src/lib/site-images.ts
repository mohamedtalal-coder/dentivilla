import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type SiteImageSlotDef = {
  key: string;
  labelAr: string;
  locationAr: string;
  recommendedSize: string;
  defaultUrl: string;
};

export const CORE_IMAGE_SLOTS: readonly SiteImageSlotDef[] = [
  {
    key: "doctor",
    labelAr: "صورة د. محمد ياسر الجبالي",
    locationAr: "القسم الرئيسي (Hero) في الصفحة الرئيسية وصفحة عن العيادة",
    recommendedSize: "نسبة 5:6 (مثال: 960 × 1152 بكسل)",
    defaultUrl: "/images/doctor.jpg",
  },
  {
    key: "logo",
    labelAr: "شعار العيادة (Logo)",
    locationAr: "أعلى الصفحة (Navbar) وأسفلها (Footer)",
    recommendedSize: "مربع متناسق (مثال: 512 × 512 بكسل، بخلفية شفافة PNG)",
    defaultUrl: "/images/logo.png",
  },
  {
    key: "philosophy",
    labelAr: "كارت فلسفة العيادة («لا نصنع ابتسامة مكررة»)",
    locationAr: "قسم الفلسفة في الصفحة الرئيسية",
    recommendedSize: "نسبة 4:5 (مثال: 800 × 1000 بكسل)",
    defaultUrl: "/images/teeth/incisor.webp",
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
  about: string;
  [key: string]: string;
};

/**
 * Returns a map of current URLs for all website image slots.
 * Falls back to default static images if no custom image is configured.
 * Cached per request.
 */
export const getSiteImages = cache(async (): Promise<SiteImagesMap> => {
  const result: Record<string, string> = {};
  for (const slot of CORE_IMAGE_SLOTS) {
    result[slot.key] = slot.defaultUrl;
  }

  try {
    const rows = await prisma.siteImage.findMany();
    for (const row of rows) {
      if (row.mediaId) {
        result[row.id] = `/media/${row.mediaId}`;
      } else if (row.customUrl) {
        result[row.id] = row.customUrl;
      }
    }
  } catch (error) {
    console.warn("Could not query SiteImage from database, using static defaults:", error);
  }

  return result as SiteImagesMap;
});
