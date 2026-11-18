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
    question: "هل تحتاج الوجوه التجميلية إلى برد الأسنان؟",
    answer: "يعتمد ذلك على شكل أسنانك ولونها والنتيجة المطلوبة. في حالات كثيرة يكون التحضير محدوداً جداً، وأحياناً لا يلزم. نوضح لك المقدار المتوقع لكل سن قبل البدء، ونجرب الشكل داخل فمك بنموذج مؤقت.",
    sortOrder: 1,
  },
  {
    id: "default-2",
    question: "هل زراعة الأسنان مؤلمة؟ وهل تناسب مرضى السكر والضغط؟",
    answer: "تُجرى الزراعة تحت تخدير موضعي، ومعظم المرضى يصفون ما بعدها بانزعاج يمكن التحكم فيه بالمسكنات المعتادة. مرضى السكر والضغط المنضبطين يمكنهم غالباً إجراء الزراعة بعد تقييم حالتهم الصحية — لذلك نطلب التاريخ المرضي عند الحجز.",
    sortOrder: 2,
  },
  {
    id: "default-3",
    question: "هل يمكنني رؤية شكل ابتسامتي قبل العلاج؟",
    answer: "نعم. نصمم الابتسامة رقمياً، ثم نضع نموذجاً تجريبياً مؤقتاً على أسنانك لترى الشكل والحجم في المرآة قبل أي خطوة نهائية.",
    sortOrder: 3,
  },
  {
    id: "default-4",
    question: "متى أعرف التكلفة؟",
    answer: "بعد الكشف تحصل على خطة مكتوبة تشمل الخيارات المتاحة وتكلفة كل منها والمدة المتوقعة، ولا يبدأ أي إجراء قبل موافقتك.",
    sortOrder: 4,
  },
  {
    id: "default-5",
    question: "هل الحجز عبر الموقع نهائي؟",
    answer: "يُحجز الوقت الذي اخترته لك فوراً ولا يظهر لغيرك، ثم تؤكده العيادة. يمكنك متابعة حالة الطلب في أي وقت بالرقم المرجعي ورقم هاتفك.",
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
