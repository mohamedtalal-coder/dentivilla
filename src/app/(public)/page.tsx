import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Award, GraduationCap, Microscope, Presentation } from "lucide-react";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { BookLink } from "@/components/booking/BookLink";
import { BeforeAfter } from "@/components/site/BeforeAfter";
import { DoctorPortrait } from "@/components/site/DoctorPortrait";
import { Faq } from "@/components/site/Faq";
import { PhilosophyPanel } from "@/components/site/PhilosophyPanel";
import { SmileNeeds } from "@/components/site/SmileNeeds";
import { ToothJourneyCard } from "@/components/site/ToothJourneyCard";
import { getFeaturedCase } from "@/lib/cases";
import { getContactInfo } from "@/lib/site-settings";
import { getBookingTreatments } from "@/lib/treatments";
import { site } from "@/lib/site";

const credentials = [
  { icon: Award, title: "البورد الألماني", text: "تجميل وزراعة الأسنان المتقدمة" },
  { icon: GraduationCap, title: "ماجستير سريري", text: "إعادة تأهيل الفم الكامل وتجميل الابتسامة" },
  { icon: Microscope, title: "عضو ESCD", text: "الجمعية الأوروبية لطب الأسنان التجميلي" },
  { icon: Presentation, title: "محاضر دولي", text: "التصميم الرقمي للابتسامة (DSD)" },
];

const journey = [
  {
    title: "استشارة هادئة",
    text: "نستمع لما يقلقك وما تتمناه، دون استعجال.",
  },
  {
    title: "تشخيص دقيق",
    text: "صور وأشعة ثلاثية الأبعاد وفحص مكبّر.",
  },
  {
    title: "خطة مكتوبة وواضحة",
    text: "الخيارات والتكلفة والمدة قبل أي إجراء.",
    accent: "gold" as const,
  },
  {
    title: "علاج ومتابعة",
    text: "جلسات مريحة، ثم متابعة تحافظ على النتيجة.",
  },
];

export default async function HomePage() {
  const [treatments, contact, featuredCase] = await Promise.all([
    getBookingTreatments(),
    getContactInfo(),
    getFeaturedCase(),
  ]);
  const featured = treatments.find((t) => t.slug === "smile-makeover");
  const others = treatments.filter((t) => t.slug !== "smile-makeover" && t.slug !== "consultation").slice(0, 4);

  return (
    <>
      {/* Hero */}
      <section className="container-page pt-28 pb-16 md:pt-36 md:pb-24" aria-labelledby="hero-title">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <p className="eyebrow">عيادة Dentivilla · {site.addressShort}</p>
            <h1 id="hero-title" className="heading-xl">
              ابتسامة طبيعية
              <span className="block text-amber-dark">تبدأ بتشخيص دقيق.</span>
            </h1>
            <p className="lede mt-6 max-w-xl">
              {site.doctor.name} — {site.doctor.title}. علاج تجميلي وترميمي يحافظ على أسنانك الطبيعية، بخطة
              واضحة تراها وتفهمها قبل أن نبدأ.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <BookLink className="btn-primary px-7 py-3.5 text-base">
                احجز موعدك
                <ArrowLeft className="size-4" aria-hidden />
              </BookLink>
              <Link href="#concerns" className="btn-secondary px-7 py-3.5 text-base">
                ابدأ من احتياجك
              </Link>
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-3 divide-x divide-x-reverse divide-line border-t border-line pt-6">
              {[
                { value: site.doctor.experienceYears, label: "عاماً من الخبرة" },
                { value: site.doctor.smilesCount, label: "ابتسامة ناجحة" },
                { value: site.doctor.rating, label: "متوسط تقييم المرضى" },
              ].map((stat) => (
                <div key={stat.label} className="px-4 first:ps-0">
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="text-2xl font-bold text-teal-deep sm:text-3xl">{stat.value}</dd>
                  <dd className="mt-1 text-sm text-muted">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="lg:col-span-5">
            <DoctorPortrait preload />
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="section border-t border-line bg-white" aria-labelledby="about-title">
        <div className="container-page grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="eyebrow">عن الطبيب</p>
            <h2 id="about-title" className="heading-lg">
              الإنسان أولاً، ثم تبدأ الخطة.
            </h2>
            <p className="lede mt-5 max-w-2xl">
              يؤمن {site.doctor.name} بأن أفضل علاج يبدأ بالاستماع. يجمع بين التخطيط الرقمي والعمل تحت التكبير،
              مع أولوية واضحة: أقل تدخل ممكن للحفاظ على بنية السن الطبيعية.
            </p>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2">
              {credentials.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-4 rounded-2xl border border-line p-5">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-light text-teal-deep">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-semibold text-teal-deep">{title}</span>
                    <span className="mt-1 block text-sm leading-6 text-muted">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Link href="/about" className="mt-8 inline-flex items-center gap-2 font-semibold text-teal-mid hover:text-teal-deep">
              السيرة المهنية كاملة
              <ArrowLeft className="size-4" aria-hidden />
            </Link>
          </div>
          <PhilosophyPanel className="aspect-[4/5] lg:col-span-5" />
        </div>
      </section>

      <SmileNeeds whatsappUrl={contact.whatsappUrl} />

      {/* Services */}
      <section id="services" className="section" aria-labelledby="services-title">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="eyebrow">الخدمات</p>
              <h2 id="services-title" className="heading-lg">
                العلاج كحرفة دقيقة ومدروسة.
              </h2>
            </div>
            <Link href="/treatments" className="btn-secondary">
              كل العلاجات
              <ArrowLeft className="size-4" aria-hidden />
            </Link>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-12">
            {featured && (
              <article className="relative flex min-h-[420px] flex-col justify-between overflow-hidden rounded-[2rem] bg-teal-deep p-8 text-white sm:p-10 lg:col-span-7">
                <Image
                  src="/images/teeth/incisor.webp"
                  alt=""
                  width={220}
                  height={570}
                  className="pointer-events-none absolute -bottom-24 left-4 hidden h-[95%] w-auto drop-shadow-[0_30px_40px_rgba(0,0,0,0.35)] sm:block sm:left-12"
                />
                <span className="chip relative w-fit border-white/20 bg-white/10 text-gold-soft">التخصص الأبرز</span>
                <div className="relative max-w-sm">
                  <h3 className="text-3xl font-bold">{featured.nameAr}</h3>
                  <p className="mt-3 leading-8 text-teal-light/85">{featured.summaryAr}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <BookLink intent={{ treatmentSlug: featured.slug }} className="btn-gold">
                      احجز استشارة
                    </BookLink>
                    <Link href={`/treatments/${featured.slug}`} className="btn-on-dark">
                      التفاصيل
                    </Link>
                  </div>
                </div>
              </article>
            )}
            <div className="grid gap-5 sm:grid-cols-2 lg:col-span-5">
              {others.map((item) => (
                <Link
                  key={item.id}
                  href={`/treatments/${item.slug}`}
                  className="group flex flex-col justify-between rounded-[1.5rem] border border-line bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-teal/40 hover:shadow-card"
                >
                  <h3 className="font-bold text-teal-deep">{item.nameAr}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{item.summaryAr}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-mid">
                    اعرف أكثر
                    <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden />
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <aside className="mt-5 flex flex-col items-start justify-between gap-6 rounded-[1.5rem] border border-amber/30 bg-amber-light p-6 sm:flex-row sm:items-center sm:p-8">
            <div>
              <span className="chip border-amber/40 bg-white text-amber-dark">عرض White Friday</span>
              <h3 className="mt-3 text-xl font-bold text-teal-deep">تبييض الأسنان في العيادة — جلسة واحدة</h3>
              <p className="mt-1 text-sm text-muted">يشمل تسجيل درجة اللون قبل وبعد الجلسة وإرشادات العناية.</p>
            </div>
            <div className="flex items-center gap-5">
              <p className="text-teal-deep">
                <span className="text-3xl font-bold">2000</span> <span className="text-sm">ج.م</span>
              </p>
              <BookLink intent={{ treatmentSlug: "whitening" }} className="btn-gold">
                احجز العرض
              </BookLink>
            </div>
          </aside>
        </div>
      </section>

      {/* Journey */}
      <section id="experience" className="section bg-white" aria-labelledby="journey-title">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="eyebrow">رحلة العلاج</p>
            <h2 id="journey-title" className="heading-lg">
              أربع خطوات، وتجربة واحدة مطمئنة.
            </h2>
          </div>
          <ol
            aria-label="خطوات رحلة العلاج"
            className="relative -mx-4 mt-14 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-6 scrollbar-none sm:mx-auto sm:grid sm:max-w-3xl sm:grid-cols-2 sm:gap-x-8 sm:gap-y-12 sm:overflow-visible sm:px-0 sm:pb-0 lg:max-w-5xl lg:grid-cols-4 lg:before:absolute lg:before:inset-x-[12%] lg:before:top-[22%] lg:before:border-t-2 lg:before:border-dashed lg:before:border-teal/25 lg:before:content-['']"
          >
            {journey.map((item, index) => (
              <ToothJourneyCard key={item.title} step={index + 1} {...item} />
            ))}
          </ol>
        </div>
      </section>

      {/* Results */}
      <section id="results" className="section" aria-labelledby="results-title">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">قبل وبعد</p>
            <h2 id="results-title" className="heading-lg">
              فرقٌ يُرى، وطبيعةٌ لا تختفي.
            </h2>
            <p className="lede mt-4">اسحب المؤشر — أو استخدم الأسهم في لوحة المفاتيح — للمقارنة.</p>
          </div>
          <div className="mx-auto mt-10 max-w-4xl">
            {featuredCase ? (
              <BeforeAfter
                beforeSrc={featuredCase.beforeSrc}
                afterSrc={featuredCase.afterSrc}
                beforeAlt={`${featuredCase.title} — قبل العلاج`}
                afterAlt={`${featuredCase.title} — بعد العلاج`}
                caption={`${featuredCase.title}. نُشرت بموافقة المريض، والنتائج تختلف من حالة لأخرى.`}
              />
            ) : (
              <BeforeAfter caption="صور توضيحية. النتيجة الفعلية تختلف من حالة لأخرى وتُناقش بعد الفحص." />
            )}
          </div>
          <p className="mt-6 text-center">
            <Link href="/cases" className="inline-flex items-center gap-2 font-semibold text-teal-mid hover:text-teal-deep">
              المزيد من الحالات
              <ArrowLeft className="size-4" aria-hidden />
            </Link>
          </p>
        </div>
      </section>

      <Faq />

      <section id="booking" className="section border-t border-line bg-ivory">
        <div className="container-page">
          <BookingFlow treatments={treatments} whatsappUrl={contact.whatsappUrl} />
        </div>
      </section>
    </>
  );
}
