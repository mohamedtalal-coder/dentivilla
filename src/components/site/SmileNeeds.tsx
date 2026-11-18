"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ArrowLeft, CalendarClock, ClipboardCheck, MessageCircle, Stethoscope } from "lucide-react";
import { BookLink } from "@/components/booking/BookLink";

type Need = {
  id: string;
  treatmentSlug: string;
  label: string;
  hint: string;
  image: string;
  imageAlt: string;
  title: string;
  concern: string;
  assess: string;
  approach: string;
  visits: string;
  note: string;
};

const NEEDS: Need[] = [
  {
    id: "shape",
    treatmentSlug: "veneers",
    label: "شكل أو لون الأسنان الأمامية",
    hint: "فراغات، كسور بسيطة، عدم تناسق",
    image: "/images/teeth/incisor.webp",
    imageAlt: "نموذج ثلاثي الأبعاد لقاطع علوي",
    title: "الوجوه التجميلية وتصميم الابتسامة",
    concern: "أريد ابتسامة متناسقة، لكني قلق من برد أسناني الطبيعية.",
    assess: "تصوير فوتوغرافي ورقمي للابتسامة، وقياس سماكة المينا، وتحليل خط الشفاه ونسب الوجه.",
    approach:
      "تصميم رقمي للابتسامة ثم نموذج تجريبي داخل الفم تراه قبل أي تحضير. يُحدد مقدار التحضير لكل سن على حدة، وفي حالات كثيرة يكون محدوداً جداً.",
    visits: "عادةً ٢–٣ زيارات",
    note: "تُقرر الحاجة للتحضير ومقداره بعد الفحص.",
  },
  {
    id: "missing",
    treatmentSlug: "implants",
    label: "سن مفقود أو متحرك",
    hint: "فراغ يؤثر على المضغ أو الابتسامة",
    image: "/images/teeth/implant.webp",
    imageAlt: "نموذج ثلاثي الأبعاد لغرسة سنية مع دعامة وتاج",
    title: "زراعة الأسنان المخطط لها رقمياً",
    concern: "فقدت سناً وأريد بديلاً ثابتاً دون المساس بالأسنان المجاورة.",
    assess: "أشعة مقطعية ثلاثية الأبعاد (CBCT) لتقييم كثافة العظم وموقع الأعصاب والجيوب الأنفية.",
    approach:
      "تخطيط موضع الغرسة على الأشعة قبل الجراحة، وعند الحاجة دليل جراحي مطبوع. يُركّب التاج النهائي بعد التحام الغرسة بالعظم.",
    visits: "مرحلتان على مدى أسابيع إلى أشهر",
    note: "مدة الالتحام تختلف حسب العظم والحالة الصحية العامة.",
  },
  {
    id: "color",
    treatmentSlug: "whitening",
    label: "اصفرار أو تصبغ الأسنان",
    hint: "تغير لون بسبب القهوة أو التدخين أو العمر",
    image: "/images/teeth/canine.webp",
    imageAlt: "نموذج ثلاثي الأبعاد لناب علوي",
    title: "تبييض الأسنان في العيادة",
    concern: "أسناني فقدت لونها وأريد نتيجة طبيعية دون حساسية مزعجة.",
    assess: "تسجيل درجة اللون الحالية، وفحص الحشوات والتيجان التي لا يغير التبييض لونها، وتقييم الحساسية.",
    approach: "عزل اللثة ثم جلسة تبييض داخل العيادة، مع إرشادات للحفاظ على النتيجة وتقليل الحساسية بعدها.",
    visits: "جلسة واحدة غالباً",
    note: "النتيجة تختلف حسب نوع التصبغ وطبيعة الأسنان.",
  },
  {
    id: "pain",
    treatmentSlug: "root-canal",
    label: "ألم أو حساسية في سن",
    hint: "ألم مع البارد أو الساخن أو عند المضغ",
    image: "/images/teeth/molar.webp",
    imageAlt: "نموذج ثلاثي الأبعاد لضرس علوي بثلاثة جذور",
    title: "علاج العصب تحت التكبير",
    concern: "عندي ألم مستمر في ضرس وأخشى أن أفقده.",
    assess: "فحص سريري وأشعة لتحديد مصدر الألم وعدد القنوات وشكلها قبل البدء.",
    approach:
      "تنظيف القنوات وتطهيرها وحشوها تحت التكبير، ثم ترميم يحمي ما تبقى من السن. الهدف الحفاظ على السن الطبيعي متى أمكن.",
    visits: "١–٢ زيارة",
    note: "إن كان الألم شديداً، اذكر ذلك في الحجز لنعطيك أقرب موعد.",
  },
  {
    id: "alignment",
    treatmentSlug: "orthodontics",
    label: "أسنان غير منتظمة",
    hint: "تزاحم، فراغات، أو مشاكل في العضة",
    image: "/images/teeth/premolar.webp",
    imageAlt: "نموذج ثلاثي الأبعاد لضاحك علوي",
    title: "تقويم الأسنان",
    concern: "أريد تعديل ترتيب أسناني دون أن يلاحظ أحد التقويم.",
    assess: "مسح رقمي للفم وصور وأشعة لدراسة الإطباق ومساحة الفك.",
    approach: "مناقشة الخيارات المناسبة لحالتك — ومنها التقويم الشفاف — مع محاكاة رقمية لمسار حركة الأسنان.",
    visits: "متابعة كل ٤–٨ أسابيع",
    note: "مدة العلاج تُحدد بعد الدراسة ولا يمكن تقديرها عبر الموقع.",
  },
  {
    id: "unsure",
    treatmentSlug: "consultation",
    label: "لست متأكداً مما أحتاج",
    hint: "فحص شامل وخطة مكتوبة",
    image: "/images/teeth/lower-molar.webp",
    imageAlt: "نموذج ثلاثي الأبعاد لضرس سفلي بجذرين",
    title: "كشف واستشارة شاملة",
    concern: "لا أعرف من أين أبدأ، وأريد صورة واضحة عن حالتي.",
    assess: "فحص كامل للأسنان واللثة والإطباق مع الأشعة اللازمة.",
    approach: "شرح الحالة بوضوح وخطة علاج مكتوبة بالأولويات والتكلفة والمدة قبل أي إجراء.",
    visits: "زيارة واحدة",
    note: "يمكنك تحديد الأسنان التي تقلقك على مخطط الفك عند الحجز.",
  },
];

export function SmileNeeds({ whatsappUrl }: { whatsappUrl: string }) {
  const [activeId, setActiveId] = useState(NEEDS[0].id);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const active = NEEDS.find((need) => need.id === activeId) ?? NEEDS[0];

  function onKeyDown(event: React.KeyboardEvent, index: number) {
    const keys: Record<string, number> = {
      ArrowDown: 1,
      ArrowUp: -1,
      ArrowLeft: 1, // RTL: left moves forward
      ArrowRight: -1,
    };
    let next: number | null = null;
    if (event.key in keys) next = (index + keys[event.key] + NEEDS.length) % NEEDS.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = NEEDS.length - 1;
    if (next === null) return;
    event.preventDefault();
    setActiveId(NEEDS[next].id);
    tabRefs.current[next]?.focus();
  }

  return (
    <section id="concerns" className="section bg-ivory" aria-labelledby="concerns-title">
      <div className="container-page">
        <div className="max-w-2xl">
          <p className="eyebrow">ابدأ من احتياجك</p>
          <h2 id="concerns-title" className="heading-lg">
            ماذا تحتاج ابتسامتك اليوم؟
          </h2>
          <p className="lede mt-4">
            اختر ما يشغلك، وسنوضح لك ما نفحصه وكيف يبدأ العلاج — ثم احجز الموعد المناسب مباشرة.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div
            role="tablist"
            aria-orientation="vertical"
            aria-label="الاحتياجات الشائعة"
            className="-mx-4 flex min-w-0 snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:col-span-5 lg:grid-cols-1"
          >
            {NEEDS.map((need, index) => {
              const selected = need.id === active.id;
              return (
                <button
                  key={need.id}
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  type="button"
                  role="tab"
                  id={`need-tab-${need.id}`}
                  aria-selected={selected}
                  aria-controls="need-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveId(need.id)}
                  onKeyDown={(event) => onKeyDown(event, index)}
                  className={`group flex w-[78vw] max-w-[300px] shrink-0 snap-start items-center gap-4 rounded-2xl border p-3 text-right transition-all sm:w-auto sm:max-w-none sm:min-w-0 ${
                    selected
                      ? "border-teal/50 bg-white shadow-card"
                      : "border-line bg-white/80 hover:border-line hover:bg-white sm:border-transparent sm:bg-transparent"
                  }`}
                >
                  <span
                    className={`relative grid size-14 shrink-0 place-items-center rounded-xl transition-colors ${
                      selected ? "bg-teal-light" : "bg-white"
                    }`}
                  >
                    <Image src={need.image} alt="" width={40} height={52} className="h-11 w-auto object-contain" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block font-semibold ${selected ? "text-teal-deep" : "text-ink"}`}>
                      {need.label}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-muted">{need.hint}</span>
                  </span>
                  <ArrowLeft
                    aria-hidden
                    className={`size-4 shrink-0 transition-all ${
                      selected ? "text-teal" : "text-neutral-300 group-hover:-translate-x-0.5"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <div
            id="need-panel"
            role="tabpanel"
            aria-labelledby={`need-tab-${active.id}`}
            className="card-soft min-w-0 overflow-hidden rounded-[1.75rem] lg:col-span-7"
          >
            <div key={active.id} className="grid animate-fade-in grid-cols-1 md:grid-cols-[1fr_200px]">
              <div className="flex items-center justify-center bg-gradient-to-b from-teal-light/70 to-ivory px-6 py-4 md:order-2 md:py-6">
                <Image
                  src={active.image}
                  alt={active.imageAlt}
                  width={180}
                  height={300}
                  className="h-20 w-auto object-contain drop-shadow-[0_18px_22px_rgba(12,79,77,0.22)] sm:h-24 md:h-64"
                />
              </div>
              <div className="p-6 sm:p-8 md:order-1">
                <h3 className="heading-md">{active.title}</h3>
                <blockquote className="mt-4 border-s-2 border-amber ps-4 text-[15px] leading-7 text-muted">
                  «{active.concern}»
                </blockquote>

                <dl className="mt-6 grid gap-5">
                  <div className="flex gap-3">
                    <Stethoscope className="mt-1 size-5 shrink-0 text-teal" aria-hidden />
                    <div>
                      <dt className="font-semibold text-teal-deep">ما نفحصه أولاً</dt>
                      <dd className="mt-1 leading-7 text-muted">{active.assess}</dd>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <ClipboardCheck className="mt-1 size-5 shrink-0 text-teal" aria-hidden />
                    <div>
                      <dt className="font-semibold text-teal-deep">كيف نعالج</dt>
                      <dd className="mt-1 leading-7 text-muted">{active.approach}</dd>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CalendarClock className="mt-1 size-5 shrink-0 text-teal" aria-hidden />
                    <div>
                      <dt className="font-semibold text-teal-deep">عدد الزيارات المعتاد</dt>
                      <dd className="mt-1 leading-7 text-muted">
                        {active.visits}
                        <span className="block text-sm text-neutral-500">{active.note}</span>
                      </dd>
                    </div>
                  </div>
                </dl>

                <div className="mt-8 flex flex-wrap gap-3">
                  <BookLink intent={{ treatmentSlug: active.treatmentSlug }} className="btn-primary">
                    احجز لهذه الحالة
                    <ArrowLeft className="size-4" aria-hidden />
                  </BookLink>
                  <a
                    href={`${whatsappUrl}?text=${encodeURIComponent(`مرحباً، أود الاستفسار عن: ${active.title}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary"
                  >
                    <MessageCircle className="size-4" aria-hidden />
                    اسأل عبر واتساب
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
