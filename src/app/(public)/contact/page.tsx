import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, MapPin, MessageCircle, Phone } from "lucide-react";
import { BookLink } from "@/components/booking/BookLink";
import { SocialIcon } from "@/components/site/SocialIcon";
import { getHoursSummary } from "@/lib/clinic-hours";
import { getContactInfo } from "@/lib/site-settings";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "تواصل معنا",
  description: `عنوان عيادة Dentivilla وساعات العمل وأرقام التواصل — ${site.doctor.name}.`,
};

export default async function ContactPage() {
  const [hours, contact] = await Promise.all([getHoursSummary(), getContactInfo()]);
  return (
    <div className="container-page pt-28 pb-20 md:pt-36">
      <div className="max-w-2xl">
        <p className="eyebrow">تواصل معنا</p>
        <h1 className="heading-xl">نحن هنا للإجابة عن استفساراتك.</h1>
        <p className="lede mt-4">احجز مباشرة عبر الموقع، أو تواصل مع الاستقبال هاتفياً أو عبر واتساب.</p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        <section className="card-soft rounded-[1.5rem] p-6 sm:p-8">
          <span className="grid size-11 place-items-center rounded-xl bg-teal-light text-teal-deep">
            <MapPin className="size-5" aria-hidden />
          </span>
          <h2 className="mt-4 text-lg font-bold text-teal-deep">العنوان</h2>
          <p className="mt-2 leading-7 text-muted">{contact.address}</p>
          <a
            href={contact.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-mid hover:text-teal-deep"
          >
            افتح في خرائط Google
            <ArrowLeft className="size-4" aria-hidden />
          </a>
        </section>

        <section className="card-soft rounded-[1.5rem] p-6 sm:p-8">
          <span className="grid size-11 place-items-center rounded-xl bg-teal-light text-teal-deep">
            <Phone className="size-5" aria-hidden />
          </span>
          <h2 className="mt-4 text-lg font-bold text-teal-deep">الهاتف وواتساب</h2>
          <a href={`tel:${contact.phone}`} dir="ltr" className="mt-2 block font-mono text-xl font-bold text-ink hover:text-teal-deep">
            {contact.phoneDisplay}
          </a>
          <a href={contact.whatsappUrl} target="_blank" rel="noreferrer" className="btn-secondary mt-4 px-4 py-2">
            <MessageCircle className="size-4" aria-hidden />
            محادثة واتساب
          </a>
        </section>

        <section className="card-soft rounded-[1.5rem] p-6 sm:p-8">
          <span className="grid size-11 place-items-center rounded-xl bg-teal-light text-teal-deep">
            <Clock className="size-5" aria-hidden />
          </span>
          <h2 className="mt-4 text-lg font-bold text-teal-deep">ساعات العمل</h2>
          <dl className="mt-2 grid gap-2 text-sm">
            {hours.map((row) => (
              <div key={row.days} className="flex justify-between gap-4 border-b border-line pb-2 last:border-0">
                <dt className="text-muted">{row.days}</dt>
                <dd className={row.hours ? "font-medium" : "font-medium text-amber-dark"}>{row.hours ?? "مغلق"}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {contact.socials.length > 0 && (
        <section className="mt-10" aria-labelledby="social-title">
          <h2 id="social-title" className="heading-md">تابعنا</h2>
          <ul className="mt-4 flex flex-wrap gap-3">
            {contact.socials.map((social) => (
              <li key={social.key}>
                <a href={social.url} target="_blank" rel="noreferrer" className="btn-secondary px-4 py-2.5">
                  <SocialIcon network={social.key} className="size-[18px]" />
                  {social.labelAr}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-16 rounded-[2rem] border border-line bg-ivory p-8 text-center sm:p-12">
        <h2 className="text-2xl font-bold text-teal-deep">جاهز لحجز موعدك؟</h2>
        <p className="mx-auto mt-2 max-w-lg text-muted">حدد السن على نموذج الفك واختر وقتاً متاحاً — بدون إنشاء حساب.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <BookLink className="btn-primary">احجز موعداً</BookLink>
          <Link href="/booking/status" className="btn-secondary">
            متابعة طلب سابق
          </Link>
        </div>
      </section>
    </div>
  );
}
