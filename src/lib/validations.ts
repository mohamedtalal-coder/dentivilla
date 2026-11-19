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
      ctx.addIssue({ code: "custom", message: "أدخل رقم موبايل مصري صحيحاً، مثل 01012345678." });
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
      ctx.addIssue({ code: "custom", message: "رقم الواتساب غير صحيح." });
      return z.NEVER;
    }
    return normalized;
  });

export const bookingLookupSchema = z.object({
  reference: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^DV-[A-Z0-9]{6}$/, "الرقم المرجعي يبدأ بـ DV- ويليه ٦ رموز"),
  phone: egyptianMobile,
});

export const bookingSchema = z.object({
  treatmentId: z.string().min(1, "اختر العلاج"),
  teeth: z
    .array(z.string().refine((code) => Boolean(TEETH_BY_FDI[code]), "رمز سن غير صالح"))
    .max(32)
    .default([])
    .transform((codes) => [...new Set(codes)]),
  startsAt: z.iso.datetime({ offset: true }),
  fullName: z.string().trim().min(3, "الاسم مطلوب (٣ أحرف على الأقل)").max(80, "الاسم طويل جداً"),
  phone: egyptianMobile,
  whatsapp: optionalMobile,
  notes: z.string().trim().max(500, "الملاحظات أطول من ٥٠٠ حرف").optional().default(""),
  medicalConditions: z
    .array(z.enum(MEDICAL_CONDITION_IDS))
    .max(MEDICAL_CONDITION_IDS.length)
    .default([])
    .transform((ids) => [...new Set(ids)]),
});

export const patientUpdateSchema = z.object({
  fullName: z.string().trim().min(2, "الاسم مطلوب (حرفان على الأقل)").max(80, "الاسم طويل جداً"),
  phone: egyptianMobile,
});

export const loginSchema = z.object({
  email: z.string().email("بريد غير صالح"),
  password: z.string().min(6, "كلمة المرور قصيرة"),
});

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "وقت غير صالح");

export const availabilitySettingsSchema = z.object({
  slotMinutes: z.union([z.literal(10), z.literal(15), z.literal(20), z.literal(30), z.literal(45), z.literal(60)]),
  bufferMinutes: z.number().int().min(0, "لا يمكن أن يكون سالباً").max(60, "الحد الأقصى ٦٠ دقيقة"),
  bookingLeadHours: z.number().int().min(0).max(72, "الحد الأقصى ٧٢ ساعة"),
  bookingHorizonDays: z.number().int().min(7, "الحد الأدنى ٧ أيام").max(120, "الحد الأقصى ١٢٠ يوماً"),
});

export const workingHoursSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    enabled: z.boolean(),
    startTime: hhmm,
    endTime: hhmm,
  })
  .refine((v) => !v.enabled || v.endTime > v.startTime, {
    message: "وقت الانتهاء يجب أن يكون بعد وقت البدء",
    path: ["endTime"],
  });

/** datetime-local values (YYYY-MM-DDTHH:mm) entered in Cairo time */
const localDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "أدخل التاريخ والوقت");

export const blockedPeriodSchema = z
  .object({
    startsAt: localDateTime,
    endsAt: localDateTime,
    reason: z.string().trim().min(2, "اكتب سبباً مختصراً").max(120),
  })
  .refine((v) => v.endsAt > v.startsAt, { message: "النهاية يجب أن تكون بعد البداية", path: ["endsAt"] });

export const extraSlotSchema = z
  .object({
    startsAt: localDateTime,
    endsAt: localDateTime,
    note: z.string().trim().max(120).optional(),
  })
  .refine((v) => v.endsAt > v.startsAt, { message: "النهاية يجب أن تكون بعد البداية", path: ["endsAt"] });

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
        ctx.addIssue({ code: "custom", message: `رابط ${label} غير صحيح` });
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
      if (!n) ctx.addIssue({ code: "custom", message: "رقم الهاتف غير صحيح" });
      return n ?? z.NEVER;
    }),
  whatsapp: z
    .string()
    .trim()
    .optional()
    .transform((value, ctx) => {
      if (!value) return null;
      const n = normalizeEgyptianMobile(value);
      if (!n) ctx.addIssue({ code: "custom", message: "رقم الواتساب غير صحيح" });
      return n ?? z.NEVER;
    }),
  email: z
    .string()
    .trim()
    .optional()
    .transform((value, ctx) => {
      if (!value) return null;
      if (!z.email().safeParse(value).success) ctx.addIssue({ code: "custom", message: "البريد الإلكتروني غير صحيح" });
      return value;
    }),
  address: optionalText(200),
  mapsUrl: optionalUrlOn(["google.com", "goo.gl", "maps.app.goo.gl", "g.page"], "خرائط Google"),
  instagram: optionalUrlOn(["instagram.com"], "إنستغرام"),
  facebook: optionalUrlOn(["facebook.com", "fb.com", "fb.me"], "فيسبوك"),
  tiktok: optionalUrlOn(["tiktok.com"], "تيك توك"),
  youtube: optionalUrlOn(["youtube.com", "youtu.be"], "يوتيوب"),
  x: optionalUrlOn(["x.com", "twitter.com"], "إكس"),
  snapchat: optionalUrlOn(["snapchat.com"], "سناب شات"),
});

export const caseSchema = z
  .object({
    titleAr: z.string().trim().min(3, "اكتب عنواناً للحالة").max(120),
    descriptionAr: optionalText(600),
    treatmentSlug: optionalText(60),
    beforeMediaId: z.string().min(10, "ارفع صورة «قبل»"),
    afterMediaId: z.string().min(10, "ارفع صورة «بعد»"),
    consentOnFile: z.boolean(),
    published: z.boolean(),
  })
  .refine((v) => !v.published || v.consentOnFile, {
    message: "لا يمكن النشر دون تأكيد وجود موافقة المريض",
    path: ["consentOnFile"],
  });

export const offerSchema = z.object({
  badge: z.string().trim().min(2, "اكتب وسام العرض (مثلاً: عرض خاص)").max(40, "الوسام طويل جداً"),
  titleAr: z.string().trim().min(3, "اكتب عنواناً للعرض").max(120, "العنوان طويل جداً"),
  descriptionAr: z.string().trim().min(5, "اكتب تفاصيل العرض").max(300, "الوصف طويل جداً"),
  price: z.coerce.number().int().min(1, "أدخل سعر العرض"),
  originalPrice: z.coerce.number().int().min(1).optional().nullable(),
  treatmentSlug: z.string().trim().optional().nullable(),
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const faqSchema = z.object({
  question: z.string().trim().min(5, "اكتب السؤال (٥ أحرف على الأقل)").max(300, "السؤال طويل جداً"),
  answer: z.string().trim().min(5, "اكتب الإجابة (٥ أحرف على الأقل)").max(1000, "الإجابة طويلة جداً"),
  published: z.boolean().default(true),
});
