import Link from "next/link";
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  FileCheck,
  MapPin,
  MessageCircle,
  Microscope,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { CasesCarousel } from "@/components/site/CasesCarousel";
import { DoctorPortrait } from "@/components/site/DoctorPortrait";
import { Faq } from "@/components/site/Faq";
import { OffersCarousel } from "@/components/site/OffersCarousel";
import { PhilosophyPanel } from "@/components/site/PhilosophyPanel";
import { getHomepageCases } from "@/lib/cases";
import { getHoursSummary } from "@/lib/clinic-hours";
import { getPublicOffers } from "@/lib/offers";
import { site } from "@/lib/site";
import { getContactInfo } from "@/lib/site-settings";
import { getBookingTreatments } from "@/lib/treatments";
import { getSiteImages } from "@/lib/site-images";

const reasons = [
  {
    icon: Microscope,
    title: "تشخيص رقمي ومجهري دقيق",
    description: "تصوير ثلاثي الأبعاد ورؤية مجهرية مكبّرة لتحديد مصدر المشكلة بدقة متناهية قبل البدء بأي تدخل.",
  },
  {
    icon: FileCheck,
    title: "خطة علاجية مكتوبة ومسبقة",
    description: "شفافية تامة في توضيح الخيارات، والمدة الزمنية، والتكلفة بالتفصيل لتكون مطمئناً دون أي مفاجآت.",
  },
  {
    icon: Sparkles,
    title: "علاج تحفظي بلا ألم",
    description: "أولويتنا الحفاظ على بنية أسنانك الطبيعية، مع بروتوكولات تخدير وراحة حديثة لتجربة هادئة ومريحة.",
  },
  {
    icon: ShieldCheck,
    title: "أعلى معايير التعقيم الأوروبية",
    description: "تطبيق بروتوكولات مكافحة عدوى صارمة وأدوات مجهزة بأعلى مواصفات الأمان لسلامتك في كل زيارة.",
  },
];

export default async function HomePage() {
  const [treatments, contact, homepageCases, offers, hours, siteImages] = await Promise.all([
    getBookingTreatments(),
    getContactInfo(),
    getHomepageCases(4),
    getPublicOffers(),
    getHoursSummary(),
    getSiteImages(),
  ]);

  // Featured treatments to display on the homepage
  const featuredTreatments = treatments
    .filter((t) => t.slug !== "consultation")
    .slice(0, 4);

  return (
    <>
      {/* 1. Hero Section */}
      <section className="container-page pt-28 pb-16 md:pt-36 md:pb-24" aria-labelledby="hero-title">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <p className="eyebrow">عيادة Dentivilla · {site.addressShort}</p>
            <h1 id="hero-title" className="heading-xl">
              ابتسامة طبيعية متناسقة
              <span className="block text-amber-dark">تبدأ بتشخيص دقيق ورعاية متأنية.</span>
            </h1>
            <p className="lede mt-6 max-w-xl">
              {site.doctor.name} — {site.doctor.title}. علاج تحفظي وتجميلي رقمي يحافظ على بنية أسنانك الطبيعية،
              بواسطة خطة واضحة ومسبقة تراها وتفهمها قبل البدء.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/booking" className="btn-primary px-7 py-3.5 text-base">
                احجز موعدك
                <ArrowLeft className="size-4" aria-hidden />
              </Link>
              <a
                href={contact.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary px-7 py-3.5 text-base"
              >
                <MessageCircle className="size-4" aria-hidden />
                تواصل عبر واتساب
              </a>
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted">
              <span>لديك حجز بالفعل؟</span>
              <Link
                href="/booking/status"
                className="inline-flex items-center gap-1 font-semibold text-teal-mid hover:text-teal-deep hover:underline"
              >
                متابعة طلب الحجز
                <ArrowLeft className="size-3" aria-hidden />
              </Link>
            </p>
          </div>
          <div className="lg:col-span-5">
            <DoctorPortrait preload src={siteImages.doctor} />
          </div>
        </div>
      </section>

      {/* 2. Featured Treatments */}
      <section className="section border-t border-line bg-white" aria-labelledby="treatments-title">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="eyebrow">خدمات العيادة</p>
              <h2 id="treatments-title" className="heading-lg">
                علاجات متخصصة بحرفية ورعاية تحفظية
              </h2>
              <p className="lede mt-3">
                حلول علاجية وتجميلية تراعي الحفاظ على أسنانك الطبيعية وتضمن لك وظيفة مريحة ومظهراً متوازناً.
              </p>
            </div>
            <Link href="/treatments" className="btn-secondary">
              استعراض كل العلاجات
              <ArrowLeft className="size-4" aria-hidden />
            </Link>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredTreatments.map((treatment) => (
              <article
                key={treatment.id}
                className="group flex flex-col justify-between rounded-[1.75rem] border border-line bg-alabaster p-6 transition-all hover:-translate-y-1 hover:border-teal/40 hover:bg-white hover:shadow-card"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="chip border-teal/20 bg-teal-light text-teal-deep">
                      <Sparkles className="size-3" aria-hidden />
                      علاج مخصص
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-teal-deep group-hover:text-teal">
                    {treatment.nameAr}
                  </h3>
                  <p className="mt-2.5 text-sm leading-6 text-muted">
                    {treatment.summaryAr}
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-line/60 pt-4 text-sm font-semibold">
                  <Link
                    href={`/treatments/${treatment.slug}`}
                    className="inline-flex items-center gap-1 text-teal-mid hover:text-teal-deep"
                  >
                    التفاصيل
                    <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1" aria-hidden />
                  </Link>
                  <Link
                    href={`/booking?treatment=${treatment.slug}`}
                    className="rounded-full bg-teal-light px-3.5 py-1.5 text-xs text-teal-deep transition-colors hover:bg-teal hover:text-white"
                  >
                    احجز الموعد
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Special Offers (Admin-managed) */}
          <OffersCarousel offers={offers} />
        </div>
      </section>

      {/* 3. Short Introduction to the Doctor */}
      <section className="section bg-alabaster" aria-labelledby="doctor-title">
        <div className="container-page grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="eyebrow">عن الطبيب</p>
            <h2 id="doctor-title" className="heading-lg">
              {site.doctor.name}
            </h2>
            <p className="mt-2 text-lg font-medium text-amber-dark">
              {site.doctor.title} — {site.doctor.focus}
            </p>
            <p className="lede mt-5 max-w-2xl">
              يقود {site.doctor.name} عيادة Dentivilla برؤية قائمة على الرعاية الفردية المتأنية واعتماد أحدث
              أساليب طب الأسنان التحفظي الرقمي. نؤمن بأن الحفاظ على السن الطبيعي هو الأساس في أي خطة علاجية ناجحة.
            </p>
            <p className="mt-4 leading-8 text-muted">
              نكرّس الوقت الكافي للاستماع لمخاوفك وتطلعاتك، ونعتمد على الفحص المجهري والتصوير الرقمي لنمنحك
              تشخيصاً دقيقاً وخطة علاج مكتوبة وواضحة بالتكلفة والمدة قبل أن نبدأ بأي خطوة.
            </p>
            <ul className="mt-6 grid gap-2.5 text-sm font-medium text-teal-deep sm:grid-cols-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-teal" aria-hidden />
                <span>فحص رقمي ومجهري دقيق قبل أي تدخل</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-teal" aria-hidden />
                <span>حماية أكبر قدر من بنية السن الطبيعية</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-teal" aria-hidden />
                <span>خطة مكتوبة وواضحة بالتكلفة والمدة</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-teal" aria-hidden />
                <span>بروتوكولات راحة وتخدير لطيف بلا توتر</span>
              </li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/about" className="btn-secondary">
                المزيد عن الطبيب وفلسفة العيادة
                <ArrowLeft className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
          <PhilosophyPanel className="aspect-[4/5] lg:col-span-5" src={siteImages.philosophy} />
        </div>
      </section>

      {/* 4. Selected Before-and-After Cases */}
      {homepageCases.length > 0 && (
        <section className="section border-t border-line bg-white" aria-labelledby="cases-title">
          <div className="container-page">
            <div className="mx-auto max-w-2xl text-center">
              <p className="eyebrow">نتائج إكلينيكية</p>
              <h2 id="cases-title" className="heading-lg">
                نتائج حقيقية تعكس الطبيعة والتناسق
              </h2>
              <p className="lede mt-3">
                اسحب المؤشر للمقارنة قبل وبعد العلاج. كل نتيجة تعبر عن خطة علاجية مخصصة لصاحبها.
              </p>
            </div>
            <CasesCarousel cases={homepageCases} />
            <div className="mt-8 flex flex-col items-center gap-3">
              <Link
                href="/cases"
                className="inline-flex items-center gap-2 font-semibold text-teal-mid hover:text-teal-deep"
              >
                مشاهدة المزيد من الحالات في المعرض
                <ArrowLeft className="size-4" aria-hidden />
              </Link>
              <p className="text-xs text-muted">
                تُنشر الصور بموافقة المرضى. الخطة والنتيجة الفعلية تُحدد بعد الفحص السريري.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 5. A Few Genuine Reasons to Choose the Clinic */}
      <section className="section bg-alabaster" aria-labelledby="reasons-title">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">لماذا Dentivilla؟</p>
            <h2 id="reasons-title" className="heading-lg">
              معايير تضمن لك الأمان والاطمئنان في كل زيارة
            </h2>
            <p className="lede mt-3">
              نهج طبي متأنٍ يضع سلامتك وراحتك والشفافية التامة في صدارة الأولويات.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map(({ icon: Icon, title, description }) => (
              <div key={title} className="card-soft rounded-[1.75rem] p-6">
                <span className="grid size-12 place-items-center rounded-2xl bg-teal-light text-teal-deep">
                  <Icon className="size-6" aria-hidden />
                </span>
                <h3 className="mt-5 text-lg font-bold text-teal-deep">{title}</h3>
                <p className="mt-2.5 text-sm leading-6 text-muted">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Frequently Asked Questions (from Database) */}
      <Faq />

      {/* 7. Location, Contact Information and Booking CTA */}
      <section className="section border-t border-line bg-white" aria-labelledby="contact-cta-title">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">احجز زيارتك</p>
            <h2 id="contact-cta-title" className="heading-lg">
              جاهز لابتسامة صحية وواثقة؟
            </h2>
            <p className="lede mt-3">
              اختر الموعد الأنسب لك إلكترونياً، أو تواصل مباشرة مع فريق الاستقبال في العيادة.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {/* Direct Booking */}
            <div className="card-soft flex flex-col justify-between rounded-[1.75rem] p-7">
              <div>
                <span className="grid size-11 place-items-center rounded-xl bg-teal-light text-teal-deep">
                  <CalendarCheck className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-bold text-teal-deep">الحجز الإلكتروني المباشر</h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  اختر تخصص العلاج والوقت المتاح فعلياً من الجدول لحظياً، مع إمكانية تحديد السن المطلوبة بسهولة.
                </p>
              </div>
              <div className="mt-6">
                <Link href="/booking" className="btn-primary w-full py-3">
                  احجز موعدك الآن
                  <ArrowLeft className="size-4" aria-hidden />
                </Link>
              </div>
            </div>

            {/* Direct Communication */}
            <div className="card-soft flex flex-col justify-between rounded-[1.75rem] p-7">
              <div>
                <span className="grid size-11 place-items-center rounded-xl bg-teal-light text-teal-deep">
                  <Phone className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-bold text-teal-deep">الهاتف وواتساب</h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  تواصل مع الاستقبال للاستفسارات السريعة أو المساعدة في تحديد موعد مناسب.
                </p>
                <a
                  href={`tel:${contact.phone}`}
                  dir="ltr"
                  className="mt-3 block font-mono text-xl font-bold text-teal-deep hover:text-teal"
                >
                  {contact.phoneDisplay}
                </a>
              </div>
              <div className="mt-6">
                <a
                  href={contact.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary w-full py-3"
                >
                  <MessageCircle className="size-4" aria-hidden />
                  محادثة واتساب
                </a>
              </div>
            </div>

            {/* Location & Hours */}
            <div className="card-soft flex flex-col justify-between rounded-[1.75rem] p-7">
              <div>
                <span className="grid size-11 place-items-center rounded-xl bg-teal-light text-teal-deep">
                  <MapPin className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-bold text-teal-deep">الموقع وساعات العمل</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{contact.address}</p>
                <div className="mt-3 border-t border-line/60 pt-3">
                  <dl className="grid gap-1.5 text-xs">
                    {hours.map((row) => (
                      <div key={row.days} className="flex justify-between gap-2 text-muted">
                        <span>{row.days}</span>
                        <span className={row.hours ? "font-medium text-ink" : "text-amber-dark"}>
                          {row.hours ?? "مغلق"}
                        </span>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
              <div className="mt-6">
                <a
                  href={contact.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-mid hover:text-teal-deep"
                >
                  عرض الموقع على Google Maps
                  <ArrowLeft className="size-4" aria-hidden />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
