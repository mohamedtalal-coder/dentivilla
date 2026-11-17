import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { normalizeEgyptianMobile } from "@/lib/phone";
import { site } from "@/lib/site";

export const SOCIAL_NETWORKS = [
  { key: "instagram", label: "Instagram", labelAr: "إنستغرام", hosts: ["instagram.com"] },
  { key: "facebook", label: "Facebook", labelAr: "فيسبوك", hosts: ["facebook.com", "fb.com", "fb.me"] },
  { key: "tiktok", label: "TikTok", labelAr: "تيك توك", hosts: ["tiktok.com"] },
  { key: "youtube", label: "YouTube", labelAr: "يوتيوب", hosts: ["youtube.com", "youtu.be"] },
  { key: "x", label: "X", labelAr: "إكس", hosts: ["x.com", "twitter.com"] },
  { key: "snapchat", label: "Snapchat", labelAr: "سناب شات", hosts: ["snapchat.com"] },
] as const;

export type SocialKey = (typeof SOCIAL_NETWORKS)[number]["key"];
export type SocialLink = { key: SocialKey; label: string; labelAr: string; url: string };

export type ContactInfo = {
  phone: string;
  phoneDisplay: string;
  whatsappUrl: string;
  email: string | null;
  address: string;
  mapsUrl: string;
  socials: SocialLink[];
};

/** "01132081093" → "+20 113 208 1093" style display stays local: "0113 208 1093" */
function formatPhone(phone: string) {
  return phone.length === 11 ? `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}` : phone;
}

/** True when `url` is an https URL on one of `hosts` (or their subdomains). */
export function isUrlOnHosts(url: string, hosts: readonly string[]) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return hosts.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

/**
 * Public contact details: values edited in the admin panel, falling back to
 * the defaults in site.ts for anything left empty. Cached per request.
 */
export const getContactInfo = cache(async (): Promise<ContactInfo> => {
  const row = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  const phone = normalizeEgyptianMobile(row?.phone ?? "") ?? site.phone;
  const whatsappLocal = normalizeEgyptianMobile(row?.whatsapp ?? "") ?? null;
  const whatsappUrl = whatsappLocal ? `https://wa.me/2${whatsappLocal}` : site.whatsappUrl;

  const socials: SocialLink[] = [];
  for (const network of SOCIAL_NETWORKS) {
    const url = row?.[network.key];
    if (url && isUrlOnHosts(url, network.hosts)) {
      socials.push({ key: network.key, label: network.label, labelAr: network.labelAr, url });
    }
  }

  return {
    phone,
    phoneDisplay: formatPhone(phone),
    whatsappUrl,
    email: row?.email || site.email || null,
    address: row?.address || site.addressNote,
    mapsUrl: row?.mapsUrl || site.mapsUrl,
    socials,
  };
});
