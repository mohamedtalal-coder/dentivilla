import { z } from "zod";
import { MEDICAL_CONDITION_IDS } from "@/lib/medical-conditions";
import { normalizeEgyptianMobile } from "@/lib/phone";
import { TEETH_BY_FDI } from "@/lib/teeth";

const egyptianMobile = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const normalized = normalizeEgyptianMobile(value);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "Please enter a valid Egyptian mobile number, e.g. 01012345678." });
      return z.NEVER;
    }
    return normalized;
  });

const optionalMobile = z
  .string()
  .trim()
  .optional()
  .transform((value, ctx) => {
    if (!value) return undefined;
    const normalized = normalizeEgyptianMobile(value);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "Invalid WhatsApp number." });
      return z.NEVER;
    }
    return normalized;
  });

export const bookingLookupSchema = z.object({
  reference: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^DV-[A-Z0-9]{6}$/, "Booking reference must start with DV- followed by 6 characters"),
  phone: egyptianMobile,
});

export const bookingSchema = z.object({
  treatmentId: z.string().min(1, "Please select a treatment"),
  teeth: z
    .array(z.string().refine((code) => Boolean(TEETH_BY_FDI[code]), "Invalid tooth code"))
    .max(32)
    .default([])
    .transform((codes) => [...new Set(codes)]),
  startsAt: z.iso.datetime({ offset: true }),
  fullName: z.string().trim().min(3, "Full name is required (at least 3 characters)").max(80, "Name is too long"),
  phone: egyptianMobile,
  whatsapp: optionalMobile,
  notes: z.string().trim().max(500, "Notes cannot exceed 500 characters").optional().default(""),
  medicalConditions: z
    .array(z.enum(MEDICAL_CONDITION_IDS))
    .max(MEDICAL_CONDITION_IDS.length)
    .default([])
    .transform((ids) => [...new Set(ids)]),
});

export const patientUpdateSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required (at least 2 characters)").max(80, "Name is too long"),
  phone: egyptianMobile,
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format (HH:MM)");

export const availabilitySettingsSchema = z.object({
  slotMinutes: z.union([z.literal(10), z.literal(15), z.literal(20), z.literal(30), z.literal(45), z.literal(60)]),
  bufferMinutes: z.number().int().min(0, "Cannot be negative").max(60, "Maximum is 60 minutes"),
  bookingLeadHours: z.number().int().min(0).max(72, "Maximum is 72 hours"),
  bookingHorizonDays: z.number().int().min(7, "Minimum is 7 days").max(120, "Maximum is 120 days"),
});

export const workingHoursSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    enabled: z.boolean(),
    startTime: hhmm,
    endTime: hhmm,
  })
  .refine((v) => !v.enabled || v.endTime > v.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

/** datetime-local values (YYYY-MM-DDTHH:mm) entered in Cairo time */
const localDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Please enter date and time");

export const blockedPeriodSchema = z
  .object({
    startsAt: localDateTime,
    endsAt: localDateTime,
    reason: z.string().trim().min(2, "Please write a brief reason").max(120),
  })
  .refine((v) => v.endsAt > v.startsAt, { message: "End time must be after start time", path: ["endsAt"] });

export const extraSlotSchema = z
  .object({
    startsAt: localDateTime,
    endsAt: localDateTime,
    note: z.string().trim().max(120).optional(),
  })
  .refine((v) => v.endsAt > v.startsAt, { message: "End time must be after start time", path: ["endsAt"] });

export const rescheduleSchema = z.object({
  id: z.string().min(1),
  startsAt: z.iso.datetime({ offset: true }),
});

/* ------------------------------ site content ------------------------------ */

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || null);

const optionalUrlOn = (hosts: readonly string[], label: string) =>
  z
    .string()
    .trim()
    .optional()
    .transform((value, ctx) => {
      if (!value) return null;
      const withScheme = /^https?:\/\//i.test(value) ? value.replace(/^http:/i, "https:") : `https://${value}`;
      try {
        const host = new URL(withScheme).hostname.toLowerCase();
        if (!hosts.some((h) => host === h || host.endsWith(`.${h}`))) throw new Error();
        return withScheme;
      } catch {
        ctx.addIssue({ code: "custom", message: `Invalid ${label} link` });
        return z.NEVER;
      }
    });

export const siteSettingsSchema = z.object({
  phone: z
    .string()
    .trim()
    .optional()
    .transform((value, ctx) => {
      if (!value) return null;
      const n = normalizeEgyptianMobile(value);
      if (!n) ctx.addIssue({ code: "custom", message: "Invalid phone number" });
      return n ?? z.NEVER;
    }),
  whatsapp: z
    .string()
    .trim()
    .optional()
    .transform((value, ctx) => {
      if (!value) return null;
      const n = normalizeEgyptianMobile(value);
      if (!n) ctx.addIssue({ code: "custom", message: "Invalid WhatsApp number" });
      return n ?? z.NEVER;
    }),
  email: z
    .string()
    .trim()
    .optional()
    .transform((value, ctx) => {
      if (!value) return null;
      if (!z.email().safeParse(value).success) ctx.addIssue({ code: "custom", message: "Invalid email address" });
      return value;
    }),
  address: optionalText(200),
  mapsUrl: optionalUrlOn(["google.com", "goo.gl", "maps.app.goo.gl", "g.page"], "Google Maps"),
  instagram: optionalUrlOn(["instagram.com"], "Instagram"),
  facebook: optionalUrlOn(["facebook.com", "fb.com", "fb.me"], "Facebook"),
  tiktok: optionalUrlOn(["tiktok.com"], "TikTok"),
  youtube: optionalUrlOn(["youtube.com", "youtu.be"], "YouTube"),
  x: optionalUrlOn(["x.com", "twitter.com"], "X"),
  snapchat: optionalUrlOn(["snapchat.com"], "Snapchat"),
});

export const caseSchema = z
  .object({
    titleAr: z.string().trim().min(3, "Case title is required (at least 3 characters)").max(120),
    descriptionAr: optionalText(600),
    treatmentSlug: optionalText(60),
    beforeMediaId: z.string().min(10, "Please upload 'Before' photo"),
    afterMediaId: z.string().min(10, "Please upload 'After' photo"),
    consentOnFile: z.boolean(),
    published: z.boolean(),
  })
  .refine((v) => !v.published || v.consentOnFile, {
    message: "Cannot publish without confirming patient consent",
    path: ["consentOnFile"],
  });

export const offerSchema = z.object({
  badge: z.string().trim().min(2, "Offer badge is required (e.g. Special Offer)").max(40, "Badge is too long"),
  titleAr: z.string().trim().min(3, "Offer title is required (at least 3 characters)").max(120, "Title is too long"),
  descriptionAr: z.string().trim().min(5, "Offer details are required (at least 5 characters)").max(300, "Description is too long"),
  price: z.coerce.number().int().min(1, "Please enter offer price"),
  originalPrice: z.coerce.number().int().min(1).optional().nullable(),
  treatmentSlug: z.string().trim().optional().nullable(),
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const faqSchema = z.object({
  question: z.string().trim().min(5, "Question is required (at least 5 characters)").max(300, "Question is too long"),
  answer: z.string().trim().min(5, "Answer is required (at least 5 characters)").max(1000, "Answer is too long"),
  published: z.boolean().default(true),
});

export const treatmentSchema = z.object({
  nameAr: z.string().trim().min(2, "Treatment name is required (at least 2 characters)").max(100, "Name is too long"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required (at least 2 characters)")
    .max(60, "Slug is too long")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase English letters, numbers, and hyphens"),
  summaryAr: z.string().trim().min(5, "Treatment summary is required (at least 5 characters)").max(300, "Summary is too long"),
  descriptionAr: z.string().trim().min(10, "Treatment description is required (at least 10 characters)").max(2000, "Description is too long"),
  requiresTeeth: z.boolean().default(true),
  durationMinutes: z.coerce.number().int().min(15).max(180).default(45),
});

export const updateAppointmentTreatmentSchema = z.object({
  id: z.string().min(1, "Appointment ID is required"),
  treatmentId: z.string().min(1, "Please select reservation type / treatment"),
  teeth: z.array(z.string()).default([]),
});

export const createAdminAppointmentSchema = z.object({
  fullName: z.string().trim().min(2, "Patient full name is required"),
  phone: z
    .string()
    .trim()
    .transform((value, ctx) => {
      const n = normalizeEgyptianMobile(value);
      if (!n) ctx.addIssue({ code: "custom", message: "Invalid Egyptian mobile number" });
      return n ?? z.NEVER;
    }),
  whatsapp: z
    .string()
    .trim()
    .optional()
    .transform((value, ctx) => {
      if (!value) return null;
      const n = normalizeEgyptianMobile(value);
      if (!n) ctx.addIssue({ code: "custom", message: "Invalid WhatsApp number" });
      return n ?? z.NEVER;
    }),
  treatmentId: z.string().min(1, "Please select reservation type / treatment"),
  teeth: z.array(z.string()).default([]),
  startsAt: z.string().min(1, "Appointment date and time is required"),
  status: z.enum(["PENDING", "CONFIRMED"]).default("CONFIRMED"),
  patientNotes: z.string().trim().max(1000).optional().nullable(),
  adminNotes: z.string().trim().max(1000).optional().nullable(),
});

export const siteImageSlotSchema = z.object({
  key: z.string().trim().min(1, "Key is required"),
  mediaId: z.string().trim().optional().nullable(),
  customUrl: z.string().trim().optional().nullable(),
});

export const addSiteImageItemSchema = z.object({
  slotKey: z.string().trim().min(1, "Key is required"),
  mediaId: z.string().trim().optional().nullable(),
  customUrl: z.string().trim().optional().nullable(),
});

export const reorderSiteImageItemsSchema = z.object({
  slotKey: z.string().trim().min(1, "Key is required"),
  itemIds: z.array(z.string().trim().min(1)),
});
