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
    labelAr: "Dr. Mohamed Yasser El Gebaly Portrait",
    locationAr: "Hero section on Homepage and About Doctor page",
    recommendedSize: "5:6 ratio (e.g. 960 × 1152 px)",
    defaultUrl: "/images/doctor.jpg",
  },
  {
    key: "logo",
    labelAr: "Clinic Logo",
    locationAr: "Navbar header and Footer",
    recommendedSize: "Square icon (e.g. 512 × 512 px, transparent PNG)",
    defaultUrl: "/images/logo.png",
  },
  {
    key: "philosophy",
    labelAr: "Clinic Philosophy Gallery ('Never a Duplicate Smile')",
    locationAr: "Philosophy section on Homepage (multi-image carousel)",
    recommendedSize: "4:5 ratio (e.g. 800 × 1000 px)",
    defaultUrl: "/images/teeth/incisor.webp",
    multiple: true,
  },
  {
    key: "about",
    labelAr: "About Doctor & Clinic Section Image",
    locationAr: "About Doctor page (lower section)",
    recommendedSize: "Landscape or transparent (e.g. 800 × 600 px)",
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
