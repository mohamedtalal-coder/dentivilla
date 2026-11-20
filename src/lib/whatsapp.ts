import { MEDICAL_CONDITION_LABEL } from "@/lib/medical-conditions";
import { normalizeEgyptianMobile } from "@/lib/phone";
import { TIMEZONE } from "@/lib/site";
import { TEETH_BY_FDI } from "@/lib/teeth";

export type BookingWhatsAppParams = {
  reference: string;
  fullName: string;
  phone: string;
  whatsapp?: string;
  treatmentName: string;
  startsAt: string | Date;
  teeth?: string[];
  conditions?: string[];
  notes?: string;
};

/**
 * Builds a structured, bilingual (Arabic & English) WhatsApp message containing
 * all details of a newly submitted reservation.
 */
export function buildBookingWhatsAppMessage(params: BookingWhatsAppParams): string {
  const dateObj = typeof params.startsAt === "string" ? new Date(params.startsAt) : params.startsAt;
  const isValidDate = !Number.isNaN(dateObj.getTime());
  const when = isValidDate
    ? `${new Intl.DateTimeFormat("en-US", {
        timeZone: TIMEZONE,
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(dateObj)} (Cairo Time)`
    : String(params.startsAt);

  const phone = normalizeEgyptianMobile(params.phone) ?? params.phone;
  const whatsapp = params.whatsapp ? (normalizeEgyptianMobile(params.whatsapp) ?? params.whatsapp) : "";

  const lines: string[] = [
    "مرحباً دكتور / عيادة دنتيفيلا",
    "لقد قمت بحجز موعد عبر الموقع الإلكتروني، وهذه تفاصيل الحجز:",
    "",
    `كود الحجز (Reference): ${params.reference}`,
    `الاسم (Full Name): ${params.fullName}`,
    `رقم الهاتف (Mobile): ${phone}`,
  ];

  if (whatsapp && whatsapp.trim() && whatsapp.trim() !== phone.trim()) {
    lines.push(`رقم الواتساب (WhatsApp): ${whatsapp.trim()}`);
  }

  lines.push(`نوع الكشف / الإجراء (Treatment): ${params.treatmentName}`);
  lines.push(`الموعد (Date & Time): ${when}`);

  if (params.teeth && params.teeth.length > 0) {
    const teethFormatted = params.teeth
      .map((code) => {
        const tooth = TEETH_BY_FDI[code];
        return tooth ? `${code} (${tooth.nameEn})` : code;
      })
      .join(", ");
    lines.push(`الأسنان المحددة (Teeth): ${teethFormatted}`);
  }

  const conditionsList =
    params.conditions && params.conditions.length > 0
      ? params.conditions.map((c) => MEDICAL_CONDITION_LABEL[c] || c).join(", ")
      : "None / لا يوجد";
  lines.push(`التاريخ المرضي (Medical History): ${conditionsList}`);

  if (params.notes && params.notes.trim()) {
    lines.push(`ملاحظات / الأعراض (Notes): ${params.notes.trim()}`);
  }

  lines.push("");
  lines.push("أرجو تأكيد الموعد. شكراً جزيلاً!");

  return lines.join("\n");
}

/**
 * Builds the complete WhatsApp deep link (`https://wa.me/...`) with the pre-filled
 * booking message encoded in the query parameter.
 */
export function buildBookingWhatsAppUrl(
  baseWhatsappUrl: string,
  params: BookingWhatsAppParams,
): string {
  const message = buildBookingWhatsAppMessage(params);
  const rawBase = (baseWhatsappUrl || "https://wa.me/201132081093").trim();

  try {
    const target = rawBase.startsWith("http://") || rawBase.startsWith("https://")
      ? rawBase
      : `https://${rawBase}`;
    const parsed = new URL(target);
    parsed.searchParams.set("text", message);
    return parsed.toString();
  } catch {
    const digitsOnly = rawBase.replace(/\D/g, "");
    const base = digitsOnly ? `https://wa.me/${digitsOnly}` : "https://wa.me/201132081093";
    const parsed = new URL(base);
    parsed.searchParams.set("text", message);
    return parsed.toString();
  }
}
