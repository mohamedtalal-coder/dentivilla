import { prisma } from "@/lib/prisma";

export type PublicFaq = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
};

/** Default hardcoded FAQs used before the database is seeded */
const FALLBACK_FAQS: PublicFaq[] = [
  {
    id: "default-1",
    question: "Do cosmetic veneers require shaving or grinding the teeth?",
    answer: "It depends on your current tooth anatomy, shade, and desired outcome. In many cases preparation is minimal, and in selected indications no tooth preparation is required. We explain the exact plan before starting and verify aesthetics with a clinical mock-up first.",
    sortOrder: 1,
  },
  {
    id: "default-2",
    question: "Are dental implants painful? Are they safe for diabetic and hypertensive patients?",
    answer: "Implants are performed under gentle local anesthesia. Most patients report mild discomfort that is easily managed with standard analgesics. Patients with controlled diabetes and blood pressure are frequently excellent candidates following clinical evaluation — which is why we request medical history upon booking.",
    sortOrder: 2,
  },
  {
    id: "default-3",
    question: "Can I preview my smile before committing to treatment?",
    answer: "Yes. We digitally design your smile and fabricate an intraoral mock-up so you can evaluate proportions, shape, and harmony directly in the mirror before any irreversible steps.",
    sortOrder: 3,
  },
  {
    id: "default-4",
    question: "When will I receive the treatment cost estimate?",
    answer: "Following your diagnostic examination, you receive a comprehensive written plan detailing clinical options, fees, and timeline. No procedure begins without your prior consent.",
    sortOrder: 4,
  },
  {
    id: "default-5",
    question: "Is online booking binding and instant?",
    answer: "Your chosen time slot is reserved immediately and shielded from double-booking. Our team confirms the appointment promptly. You can check your booking status anytime using your booking reference and mobile number.",
    sortOrder: 5,
  },
];

export async function getPublicFaqs(): Promise<PublicFaq[]> {
  try {
    if (!prisma.faq) {
      return FALLBACK_FAQS;
    }
    const faqs = await prisma.faq.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        question: true,
        answer: true,
        sortOrder: true,
      },
    });
    return faqs.length > 0 ? faqs : FALLBACK_FAQS;
  } catch (error) {
    console.warn("Could not query FAQs from database, returning default fallback:", error);
    return FALLBACK_FAQS;
  }
}
