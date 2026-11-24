import type { Prisma } from "@prisma/client";
import { site } from "@/lib/site";

export const SITE_COPY_DEFAULTS = {
  doctorName: site.doctor.name,
  doctorTitle: site.doctor.title,
  doctorSubtitle: site.doctor.subtitle,
  doctorBioLead:
    "Experienced in veneers, crowns, bridges, root canal treatments, dental implants, orthodontics, oral surgery, and comprehensive dental care.",
  doctorBio:
    "Combining a comprehensive approach to dentistry with precision, attention to detail, and personalized treatment planning to deliver long-lasting results and naturally beautiful smiles.",

  heroEyebrow: `Dentivilla Clinic · ${site.addressShort}`,
  heroTitle: "A Natural, Harmonious Smile",
  heroHighlight: "Rooted in Precision and Attentive Care.",
  heroLede:
    "Conservative and aesthetic dentistry dedicated to preserving your natural tooth structure, guided by a clear written plan you see and understand before treatment begins.",

  treatmentsEyebrow: "Clinic Services",
  treatmentsTitle: "Specialized Treatments with Conservative Craftsmanship",
  treatmentsLede:
    "Aesthetic and restorative solutions designed to safeguard your natural teeth while delivering lasting comfort and harmonious beauty.",

  doctorEyebrow: "About the Doctor",

  casesEyebrow: "Clinical Results",
  casesTitle: "Real Results Reflecting Nature & Balance",
  casesLede:
    "Slide the divider to compare before and after treatment. Each result represents a personalized treatment pathway tailored to the patient.",

  reasonsEyebrow: "Why Dentivilla?",
  reasonsTitle: "Standards That Ensure Safety and Peace of Mind",
  reasonsLede:
    "A careful, conservative medical approach placing patient safety, comfort, and absolute transparency first.",

  visitEyebrow: "Visit Us",
  visitTitle: "Ready for a Healthy, Confident Smile?",
  visitLede: "Choose your preferred appointment online in minutes, or connect directly with our clinic team.",

  footerBlurb:
    "Personalized care and a transparent written plan before every procedure, dedicated to preserving your natural tooth structure.",

  aboutEyebrow: "Our Clinical Vision",
  aboutExtra:
    "We rely on digital diagnostics and 3D CBCT imaging to reach an exact assessment, and we make sure to discuss a written, comprehensive plan with you before starting, so you feel completely confident in every step.",
  standardsEyebrow: "Our Standards",
  standardsTitle: "Our Clinical Commitments in Every Session",
  philosophyEyebrow: "Clinic Philosophy",
  philosophyTitle: "“Listening First, Then Care Begins”",
  philosophyBody:
    "A smile is never a repetitive mold. Every patient has unique facial contours, dental history, and personal expectations; that is why we dedicate ample time to listen attentively and discuss every detail of your treatment before touching any tooth.",

  treatmentsPageEyebrow: "Our Treatments",
  treatmentsPageTitle: "Dentistry as a Precise, Thoughtful Craft.",
  treatmentsPageLede:
    "Every procedure starts with clear diagnostic evaluation and a written plan that respects your natural tooth structure.",

  casesPageEyebrow: "Before & After",
  casesPageTitle: "A Visible Difference, A Natural Smile.",
  casesPageLede:
    "Slide the divider — or use the arrow keys on your keyboard — to compare before and after treatment.",

  contactPageEyebrow: "Contact Us",
  contactPageTitle: "We Are Here to Answer Your Questions.",
  contactPageLede: "Book directly online, or get in touch with our reception team by phone or WhatsApp.",
} as const;

export type SiteCopyKey = keyof typeof SITE_COPY_DEFAULTS;
export type SiteCopy = Record<SiteCopyKey, string>;

export const SITE_COPY_KEYS = Object.keys(SITE_COPY_DEFAULTS) as SiteCopyKey[];

export const SITE_COPY_GROUPS: { id: string; label: string; fields: { key: SiteCopyKey; label: string; rows?: number }[] }[] = [
  {
    id: "doctor",
    label: "بيانات الطبيب",
    fields: [
      { key: "doctorName", label: "اسم الطبيب" },
      { key: "doctorTitle", label: "المسمى الوظيفي" },
      { key: "doctorSubtitle", label: "السطر التعريفي (الهيدر والفوتر)" },
      { key: "doctorBioLead", label: "مقدمة السيرة", rows: 3 },
      { key: "doctorBio", label: "السيرة التفصيلية", rows: 5 },
    ],
  },
  {
    id: "home",
    label: "الصفحة الرئيسية",
    fields: [
      { key: "heroEyebrow", label: "سطر أعلى العنوان (Hero)" },
      { key: "heroTitle", label: "عنوان Hero" },
      { key: "heroHighlight", label: "السطر المميز في Hero" },
      { key: "heroLede", label: "وصف Hero", rows: 4 },
      { key: "treatmentsEyebrow", label: "سطر قسم العلاجات" },
      { key: "treatmentsTitle", label: "عنوان قسم العلاجات" },
      { key: "treatmentsLede", label: "وصف قسم العلاجات", rows: 3 },
      { key: "doctorEyebrow", label: "سطر قسم الطبيب" },
      { key: "casesEyebrow", label: "سطر قسم الحالات" },
      { key: "casesTitle", label: "عنوان قسم الحالات" },
      { key: "casesLede", label: "وصف قسم الحالات", rows: 3 },
      { key: "reasonsEyebrow", label: "سطر قسم لماذا Dentivilla" },
      { key: "reasonsTitle", label: "عنوان قسم المعايير" },
      { key: "reasonsLede", label: "وصف قسم المعايير", rows: 3 },
      { key: "visitEyebrow", label: "سطر قسم الزيارة" },
      { key: "visitTitle", label: "عنوان قسم الزيارة" },
      { key: "visitLede", label: "وصف قسم الزيارة", rows: 3 },
      { key: "footerBlurb", label: "نص أسفل الموقع", rows: 3 },
    ],
  },
  {
    id: "about",
    label: "صفحة عن الطبيب",
    fields: [
      { key: "aboutEyebrow", label: "سطر أعلى الاسم" },
      { key: "aboutExtra", label: "فقرة إضافية", rows: 4 },
      { key: "standardsEyebrow", label: "سطر المعايير" },
      { key: "standardsTitle", label: "عنوان المعايير" },
      { key: "philosophyEyebrow", label: "سطر الفلسفة" },
      { key: "philosophyTitle", label: "عنوان الفلسفة" },
      { key: "philosophyBody", label: "نص الفلسفة", rows: 5 },
    ],
  },
  {
    id: "pages",
    label: "صفحات أخرى",
    fields: [
      { key: "treatmentsPageEyebrow", label: "سطر صفحة العلاجات" },
      { key: "treatmentsPageTitle", label: "عنوان صفحة العلاجات" },
      { key: "treatmentsPageLede", label: "وصف صفحة العلاجات", rows: 3 },
      { key: "casesPageEyebrow", label: "سطر صفحة الحالات" },
      { key: "casesPageTitle", label: "عنوان صفحة الحالات" },
      { key: "casesPageLede", label: "وصف صفحة الحالات", rows: 3 },
      { key: "contactPageEyebrow", label: "سطر صفحة التواصل" },
      { key: "contactPageTitle", label: "عنوان صفحة التواصل" },
      { key: "contactPageLede", label: "وصف صفحة التواصل", rows: 3 },
    ],
  },
];

function isJsonObject(value: Prisma.JsonValue | null | undefined): value is Prisma.JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function mergeSiteCopy(stored: Prisma.JsonValue | null | undefined): SiteCopy {
  const result: SiteCopy = { ...SITE_COPY_DEFAULTS };
  if (!isJsonObject(stored)) return result;
  for (const key of SITE_COPY_KEYS) {
    const value = stored[key];
    if (typeof value === "string" && value.trim()) result[key] = value.trim();
  }
  return result;
}

/** Stored overrides only (empty string = use default). */
export function storedSiteCopy(stored: Prisma.JsonValue | null | undefined): Record<SiteCopyKey, string> {
  const empty = Object.fromEntries(SITE_COPY_KEYS.map((key) => [key, ""])) as Record<SiteCopyKey, string>;
  if (!isJsonObject(stored)) return empty;
  for (const key of SITE_COPY_KEYS) {
    const value = stored[key];
    if (typeof value === "string") empty[key] = value;
  }
  return empty;
}

