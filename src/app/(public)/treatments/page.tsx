import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BookLink } from "@/components/booking/BookLink";
import { getBookingTreatments } from "@/lib/treatments";

export const metadata: Metadata = {
  title: "العلاجات",
  description: "تجميل وزراعة الأسنان والتقويم وعلاج العصب والترميم في عيادة Dentivilla بالقاهرة.",
};

export default async function TreatmentsPage() {
  const treatments = await getBookingTreatments();
  return (
    <div className="container-page pt-28 pb-20 md:pt-36">
      <div className="max-w-3xl">
        <p className="eyebrow">العلاجات</p>
        <h1 className="heading-xl">العلاج كحرفة دقيقة ومدروسة.</h1>
        <p className="lede mt-4">كل علاج يبدأ بتشخيص واضح وخطة مكتوبة تحترم بنية أسنانك الطبيعية.</p>
      </div>
      <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {treatments.map((item) => (
          <li key={item.id}>
            <Link
              href={`/treatments/${item.slug}`}
              className="group flex h-full flex-col rounded-[1.5rem] border border-line bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-teal/40 hover:shadow-card"
            >
              <h2 className="text-xl font-bold text-teal-deep">{item.nameAr}</h2>
              <p className="mt-2 flex-1 leading-7 text-muted">{item.summaryAr}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-mid">
                التفاصيل
                <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <section className="mt-16 rounded-[2rem] bg-teal-deep p-8 text-center text-white sm:p-12">
        <h2 className="text-2xl font-bold">لست متأكداً من العلاج المناسب؟</h2>
        <p className="mx-auto mt-3 max-w-lg text-teal-light/80">
          احجز كشفاً شاملاً وحدد الأسنان التي تقلقك على نموذج الفك — وسنقترح الخطة بعد الفحص.
        </p>
        <BookLink intent={{ treatmentSlug: "consultation" }} className="btn-gold mt-6">
          احجز كشفاً شاملاً
        </BookLink>
      </section>
    </div>
  );
}
