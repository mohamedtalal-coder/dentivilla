import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { BookLink } from "@/components/booking/BookLink";
import { BeforeAfter } from "@/components/site/BeforeAfter";
import { getPublishedCases } from "@/lib/cases";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "قبل وبعد",
  description: "حالات قبل وبعد العلاج في عيادة Dentivilla.",
};

export default async function CasesPage() {
  const [cases, treatments] = await Promise.all([
    getPublishedCases(),
    prisma.treatment.findMany({ select: { slug: true, nameAr: true } }).catch((error) => {
      console.warn("Could not fetch treatment names for cases, using fallback:", error);
      return [];
    }),
  ]);
  const treatmentName = new Map(treatments.map((t) => [t.slug, t.nameAr]));

  return (
    <div className="container-page pt-28 pb-20 md:pt-36">
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow">قبل وبعد</p>
        <h1 className="heading-xl">فرقٌ يُرى، وطبيعةٌ لا تختفي.</h1>
        <p className="lede mt-4">اسحب المؤشر — أو استخدم الأسهم في لوحة المفاتيح — لمقارنة الحالة قبل العلاج وبعده.</p>
      </div>

      {cases.length > 0 ? (
        <div className="mx-auto mt-12 grid max-w-5xl gap-8">
          {cases.map((item, index) => (
            <article key={item.id} className="card-soft rounded-[2rem] p-5 sm:p-8">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h2 className="heading-md">{item.title}</h2>
                {item.treatmentSlug && treatmentName.get(item.treatmentSlug) && (
                  <span className="chip border-teal/30 bg-teal-light text-teal-deep">
                    {treatmentName.get(item.treatmentSlug)}
                  </span>
                )}
              </div>
              <BeforeAfter
                beforeSrc={item.beforeSrc}
                afterSrc={item.afterSrc}
                beforeAlt={`${item.title} — قبل العلاج`}
                afterAlt={`${item.title} — بعد العلاج`}
                preload={index === 0}
              />
              {item.description && <p className="mt-6 leading-8 text-muted">{item.description}</p>}
              {item.treatmentSlug && (
                <BookLink
                  intent={{ treatmentSlug: item.treatmentSlug }}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-mid hover:text-teal-deep"
                >
                  احجز استشارة لعلاج مشابه
                  <ArrowLeft className="size-4" aria-hidden />
                </BookLink>
              )}
            </article>
          ))}
          <p className="text-center text-sm text-muted">تُنشر الصور بموافقة المرضى. النتائج تختلف من حالة لأخرى وتُناقش بعد الفحص.</p>
        </div>
      ) : (
        <article className="card-soft mx-auto mt-12 max-w-5xl rounded-[2rem] p-5 sm:p-8">
          <BeforeAfter preload />
          <p className="mt-6 leading-8 text-muted">
            صور توضيحية. النتيجة الفعلية تختلف من حالة لأخرى وتُناقش بعد الفحص.
          </p>
        </article>
      )}

      <section className="mx-auto mt-16 max-w-xl text-center">
        <h2 className="text-xl font-bold text-teal-deep">هل ترغب في تقييم ابتسامتك؟</h2>
        <p className="mt-2 text-muted">احجز كشفاً، وسنعرض عليك الخيارات المناسبة لحالتك قبل أي إجراء.</p>
        <BookLink intent={{ treatmentSlug: "smile-makeover" }} className="btn-primary mt-6">
          احجز استشارة تجميل
          <ArrowLeft className="size-4" aria-hidden />
        </BookLink>
      </section>
    </div>
  );
}
