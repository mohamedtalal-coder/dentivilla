import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { SocialIcon } from "@/components/site/SocialIcon";
import { getHoursSummary } from "@/lib/clinic-hours";
import { getContactInfo, getSiteCopy } from "@/lib/site-settings";

const pageLinks = [
  { href: "/", label: "Home" },
  { href: "/treatments", label: "Treatments" },
  { href: "/about", label: "About Doctor" },
  { href: "/cases", label: "Before & After" },
  { href: "/contact", label: "Contact Us" },
];

export async function Footer({ logoUrl }: { logoUrl?: string } = {}) {
  const [hours, contact, copy] = await Promise.all([getHoursSummary(), getContactInfo(), getSiteCopy()]);
  const year = new Date().getFullYear();

  return (
    <footer className="bg-teal-deep text-white" id="contact">
      <div className="container-page grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-white p-1 ring-1 ring-amber/40">
              <Image src={logoUrl || "/images/logo.png"} alt="" width={48} height={48} className="size-full object-contain" />
            </span>
            <div>
              <p className="font-bold">{copy.doctorName}</p>
              <p className="text-sm text-teal-light/75">{copy.doctorSubtitle}</p>
            </div>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-7 text-teal-light/75">
            {copy.footerBlurb}
          </p>
          <Link href="/booking" className="btn-gold mt-6">
            Book an Appointment
          </Link>
          {contact.socials.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Social media channels">
              {contact.socials.map((social) => (
                <li key={social.key}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.label}
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

        <nav aria-label="Navigation" className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-gold-soft">Pages</h2>
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
                Check Booking
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="transition-colors hover:text-white">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </nav>

        <div className="lg:col-span-3">
          <h2 className="text-sm font-semibold text-gold-soft">Working Hours</h2>
          <dl className="mt-4 grid gap-2.5 text-sm">
            {hours.map((row) => (
              <div key={row.days} className="flex items-baseline justify-between gap-4 border-b border-white/10 pb-2.5">
                <dt className="text-teal-light/85">{row.days}</dt>
                <dd className={row.hours ? "font-medium" : "text-gold-soft"}>{row.hours ?? "Closed"}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-3">
          <h2 className="text-sm font-semibold text-gold-soft">Clinic Info</h2>
          <ul className="mt-4 grid gap-4 text-sm text-teal-light/85">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-gold-soft" aria-hidden />
              <a href={contact.mapsUrl} target="_blank" rel="noreferrer" className="leading-6 hover:text-white">
                {contact.address}
              </a>
            </li>
            <li className="flex gap-3">
              <Phone className="mt-0.5 size-4 shrink-0 text-gold-soft" aria-hidden />
              <a href={`tel:${contact.phone}`} className="font-mono hover:text-white">
                {contact.phoneDisplay}
              </a>
            </li>
            <li className="flex gap-3">
              <MessageCircle className="mt-0.5 size-4 shrink-0 text-gold-soft" aria-hidden />
              <a href={contact.whatsappUrl} target="_blank" rel="noreferrer" className="hover:text-white">
                Chat on WhatsApp
              </a>
            </li>
            {contact.email && (
              <li className="flex gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-gold-soft" aria-hidden />
                <a href={`mailto:${contact.email}`} className="hover:text-white">
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
            © {year} Dentivilla — {copy.doctorName}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/privacy" className="transition-colors hover:text-white underline-offset-4 hover:underline">
              Privacy & Data Protection Policy
            </Link>
            <span aria-hidden>•</span>
            <p>Information on this website is educational and does not replace in-person clinical examination.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
