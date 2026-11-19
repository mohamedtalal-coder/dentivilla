import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { SocialIcon } from "@/components/site/SocialIcon";
import { getHoursSummary } from "@/lib/clinic-hours";
import { site } from "@/lib/site";
import { getContactInfo } from "@/lib/site-settings";

const pageLinks = [
  { href: "/", label: "الرئيسية" },
  { href: "/treatments", label: "العلاجات" },
  { href: "/about", label: "عن الطبيب" },
  { href: "/cases", label: "معرض الحالات" },
  { href: "/contact", label: "تواصل معنا" },
];

export async function Footer() {
  const [hours, contact] = await Promise.all([getHoursSummary(), getContactInfo()]);
  const year = new Intl.DateTimeFormat("ar-EG", { year: "numeric", timeZone: "Africa/Cairo" }).format(new Date());

  return (
    <footer className="bg-teal-deep text-white" id="contact">
      <div className="container-page grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-white p-1 ring-1 ring-amber/40">
              <Image src="/images/logo.png" alt="" width={48} height={48} className="size-full object-contain" />
            </span>
            <div>
              <p className="font-bold">{site.doctor.name}</p>
              <p className="text-sm text-teal-light/75">Dentivilla — تجميل وجراحة الأسنان</p>
            </div>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-7 text-teal-light/75">
            تشخيص متأنٍ وخطة مكتوبة قبل أي إجراء، مع الحفاظ على أكبر قدر ممكن من بنية السن الطبيعية.
          </p>
          <Link href="/booking" className="btn-gold mt-6">
            احجز موعداً
          </Link>
          {contact.socials.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="حساباتنا على مواقع التواصل">
              {contact.socials.map((social) => (
                <li key={social.key}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.labelAr}
                    title={social.label}
                    className="grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-amber"
                  >
                    <SocialIcon network={social.key} className="size-[18px]" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="صفحات الموقع" className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-gold-soft">الموقع</h2>
          <ul className="mt-4 grid gap-2.5 text-sm text-teal-light/85">
            {pageLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/booking/status" className="transition-colors hover:text-white">
                متابعة طلب حجز
              </Link>
            </li>
          </ul>
        </nav>

        <div className="lg:col-span-3">
          <h2 className="text-sm font-semibold text-gold-soft">ساعات العمل</h2>
          <dl className="mt-4 grid gap-2.5 text-sm">
            {hours.map((row) => (
              <div key={row.days} className="flex items-baseline justify-between gap-4 border-b border-white/10 pb-2.5">
                <dt className="text-teal-light/85">{row.days}</dt>
                <dd className={row.hours ? "font-medium" : "text-gold-soft"}>{row.hours ?? "مغلق"}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-3">
          <h2 className="text-sm font-semibold text-gold-soft">العيادة</h2>
          <ul className="mt-4 grid gap-4 text-sm text-teal-light/85">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-gold-soft" aria-hidden />
              <a href={contact.mapsUrl} target="_blank" rel="noreferrer" className="leading-6 hover:text-white">
                {contact.address}
              </a>
            </li>
            <li className="flex gap-3">
              <Phone className="mt-0.5 size-4 shrink-0 text-gold-soft" aria-hidden />
              <a href={`tel:${contact.phone}`} dir="ltr" className="font-mono hover:text-white">
                {contact.phoneDisplay}
              </a>
            </li>
            <li className="flex gap-3">
              <MessageCircle className="mt-0.5 size-4 shrink-0 text-gold-soft" aria-hidden />
              <a href={contact.whatsappUrl} target="_blank" rel="noreferrer" className="hover:text-white">
                واتساب العيادة
              </a>
            </li>
            {contact.email && (
              <li className="flex gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-gold-soft" aria-hidden />
                <a href={`mailto:${contact.email}`} dir="ltr" className="hover:text-white">
                  {contact.email}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-teal-light/60 sm:flex-row">
          <p>
            © {year} Dentivilla — {site.doctor.name}
          </p>
          <p>المعلومات على الموقع تعريفية ولا تغني عن الكشف الطبي.</p>
        </div>
      </div>
    </footer>
  );
}
