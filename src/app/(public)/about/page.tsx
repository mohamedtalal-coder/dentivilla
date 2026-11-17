import type { Metadata } from "next";
import Image from "next/image";
import { ArrowLeft, Award, GraduationCap, Microscope, Phone, Presentation } from "lucide-react";
import { BookLink } from "@/components/booking/BookLink";
import { DoctorPortrait } from "@/components/site/DoctorPortrait";
import { getHoursSummary } from "@/lib/clinic-hours";
import { getContactInfo } from "@/lib/site-settings";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "عن الطبيب",
  description: `تعرّف على ${site.doctor.name}، ${site.doctor.title}، ومؤسس عيادة Dentivilla بالقاهرة.`,
};

const credentials = [
  { icon: Award, title: "البورد الألماني", text: "تجميل وزراعة الأسنان المتقدمة والحلول الجراحية الموجهة رقمياً." },
  { icon: GraduationCap, title: "ماجستير سريري", text: "إعادة تأهيل الفم الكامل وتجميل الابتسامة وعلاج الإطباق." },
  { icon: Microscope, title: "عضو ESCD", text: "الجمعية الأوروبية لطب الأسنان التجميلي." },
  { icon: Presentation, title: "محاضر ومدرب", text: "التصميم الرقمي للابتسامة (Digital Smile Design)." },
];

export default async function AboutPage() {
  const [hours, contact] = await Promise.all([getHoursSummary(), getContactInfo()]);
  return (
    <div className="container-page pt-28 pb-20 md:pt-36">
      <section className="grid items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="eyebrow">السيرة المهنية</p>
          <h1 className="heading-xl">{site.doctor.name}</h1>
          <p className="mt-2 text-xl text-amber-dark">رؤية طبية تجمع بين الدقة والفن.</p>
          <p className="lede mt-6">
            {site.doctor.title} وإعادة تأهيل الفم الكامل، بخبرة سريرية تتجاوز ١٤ عاماً. يتبنى نهج طب الأسنان المحافظ
            الذي يقدّم الحفاظ على بنية السن الطبيعية على أي اعتبار آخر.
          </p>
          <p className="lede mt-4">
            يعتمد على الفحص المكبّر والأشعة المقطعية ثلاثية الأبعاد (CBCT) في التشخيص، ويضع لكل مريض خطة مكتوبة يفهمها
            ويوافق عليها قبل بدء أي إجراء.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <BookLink intent={{ treatmentSlug: "consultation" }} className="btn-primary">
              احجز استشارة
              <ArrowLeft className="size-4" aria-hidden />
            </BookLink>
            <a href={`tel:${contact.phone}`} className="btn-secondary">
              <Phone className="size-4" aria-hidden />
              <span dir="ltr">{contact.phoneDisplay}</span>
            </a>
          </div>
        </div>
        <div className="lg:col-span-5">
          <DoctorPortrait preload />
        </div>
      </section>

      <section className="mt-24" aria-labelledby="credentials-title">
        <p className="eyebrow">المؤهلات</p>
        <h2 id="credentials-title" className="heading-lg">
          الدرجات العلمية والعضويات
        </h2>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {credentials.map(({ icon: Icon, title, text }) => (
            <li key={title} className="card-soft rounded-[1.5rem] p-6">
              <span className="grid size-11 place-items-center rounded-xl bg-teal-light text-teal-deep">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-bold text-teal-deep">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-24 overflow-hidden rounded-[2rem] bg-teal-deep text-white" aria-labelledby="philosophy-title">
        <div className="grid items-stretch lg:grid-cols-12">
          <div className="p-8 sm:p-12 lg:col-span-7">
            <p className="eyebrow eyebrow-light">فلسفة العيادة</p>
            <h2 id="philosophy-title" className="text-3xl leading-tight font-bold sm:text-4xl">
              «الإنسان أولاً، ثم تبدأ الخطة»
            </h2>
            <p className="mt-5 leading-8 text-teal-light/85">
              الابتسامة ليست قالباً مكرراً. لكل مريض ملامحه وتاريخه الصحي وتوقعاته؛ لذلك نمنح الوقت للاستماع، ونشرح
              تفاصيل الخطة قبل أن نلمس أياً من أسنانك.
            </p>
            <dl className="mt-8 grid gap-6 border-t border-white/10 pt-6 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-gold-soft">العنوان</dt>
                <dd className="mt-1 text-teal-light/85">{contact.address}</dd>
              </div>
              <div>
                <dt className="font-semibold text-gold-soft">ساعات العمل</dt>
                {hours.map((row) => (
                  <dd key={row.days} className="mt-1 text-teal-light/85">
                    {row.days}: {row.hours ?? "مغلق"}
                  </dd>
                ))}
              </div>
            </dl>
          </div>
          <div
            aria-hidden
            className="relative flex min-h-72 items-center justify-center gap-4 bg-[radial-gradient(90%_70%_at_50%_40%,rgb(43_166_164/0.4),transparent_70%)] p-10 lg:col-span-5"
          >
            <Image src="/images/teeth/molar.webp" alt="" width={200} height={330} className="h-56 w-auto drop-shadow-[0_24px_30px_rgba(0,0,0,0.35)]" />
            <Image src="/images/teeth/implant.webp" alt="" width={180} height={320} className="h-52 w-auto opacity-90" />
          </div>
        </div>
      </section>
    </div>
  );
}
