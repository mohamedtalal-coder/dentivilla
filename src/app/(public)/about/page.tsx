import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, FileCheck, Microscope, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { BookLink } from "@/components/booking/BookLink";
import { DoctorPortrait } from "@/components/site/DoctorPortrait";
import { getHoursSummary } from "@/lib/clinic-hours";
import { getContactInfo, getSiteCopy } from "@/lib/site-settings";
import { getSiteImages } from "@/lib/site-images";

export const metadata: Metadata = {
  title: "About the Doctor",
  description: `Learn about Dentivilla's vision, Dr. Mohamed Yasser El Gebaly, and our philosophy of conservative, high-precision dental care in Cairo.`,
};

const commitments = [
  {
    icon: Microscope,
    title: "Magnified Digital Diagnostics",
    text: "3D CBCT imaging and microscopic examination precisely determine the source of dental concerns before starting any intervention.",
  },
  {
    icon: FileCheck,
    title: "Upfront Written Plan",
    text: "Complete transparency regarding treatment steps, timeline, and exact fees without hidden costs or surprises.",
  },
  {
    icon: Sparkles,
    title: "Gentle, Pain-Free Care",
    text: "Advanced local anesthesia protocols and anxiety-free patient care ensure a comfortable, tranquil appointment.",
  },
  {
    icon: ShieldCheck,
    title: "European Sterilization Standards",
    text: "Stringent infection-control protocols and individually sealed sterilized packs ensure your complete safety on every visit.",
  },
];

export default async function AboutPage() {
  const [hours, contact, siteImages, copy] = await Promise.all([
    getHoursSummary(),
    getContactInfo(),
    getSiteImages(),
    getSiteCopy(),
  ]);
  return (
    <div className="container-page pt-28 pb-20 md:pt-36">
      <section className="grid items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="eyebrow">{copy.aboutEyebrow}</p>
          <h1 className="heading-xl">{copy.doctorName}</h1>
          <p className="mt-2 text-xl font-medium text-amber-dark">{copy.doctorTitle}</p>
          <p className="lede mt-6 font-medium text-ink/90">
            {copy.doctorBioLead}
          </p>
          <p className="lede mt-4">
            {copy.doctorBio}
          </p>
          <p className="mt-4 leading-8 text-muted">
            {copy.aboutExtra}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <BookLink intent={{ treatmentSlug: "consultation" }} className="btn-primary">
              Book a Consultation
              <ArrowRight className="size-4" aria-hidden />
            </BookLink>
            <a href={`tel:${contact.phone}`} className="btn-secondary">
              <Phone className="size-4" aria-hidden />
              <span>{contact.phoneDisplay}</span>
            </a>
          </div>
        </div>
        <div className="lg:col-span-5">
          <DoctorPortrait preload src={siteImages.doctor} name={copy.doctorName} title={copy.doctorTitle} />
        </div>
      </section>

      <section className="mt-24" aria-labelledby="standards-title">
        <p className="eyebrow">{copy.standardsEyebrow}</p>
        <h2 id="standards-title" className="heading-lg">
          {copy.standardsTitle}
        </h2>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {commitments.map(({ icon: Icon, title, text }) => (
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
            <p className="eyebrow eyebrow-light">{copy.philosophyEyebrow}</p>
            <h2 id="philosophy-title" className="text-3xl leading-tight font-bold sm:text-4xl">
              {copy.philosophyTitle}
            </h2>
            <p className="mt-5 leading-8 text-teal-light/85">
              {copy.philosophyBody}
            </p>
            <dl className="mt-8 grid gap-6 border-t border-white/10 pt-6 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-gold-soft">Address</dt>
                <dd className="mt-1 text-teal-light/85">{contact.address}</dd>
              </div>
              <div>
                <dt className="font-semibold text-gold-soft">Working Hours</dt>
                {hours.map((row) => (
                  <dd key={row.days} className="mt-1 text-teal-light/85">
                    {row.days}: {row.hours ?? "Closed"}
                  </dd>
                ))}
              </div>
            </dl>
          </div>
          <div
            aria-hidden
            className="relative flex min-h-72 items-center justify-center gap-4 bg-[radial-gradient(90%_70%_at_50%_40%,rgb(43_166_164/0.4),transparent_70%)] p-10 lg:col-span-5"
          >
            <Image src={siteImages.about} alt="" width={200} height={330} className="h-56 w-auto drop-shadow-[0_24px_30px_rgba(0,0,0,0.35)]" />
            <Image src="/images/teeth/implant.webp" alt="" width={180} height={320} className="h-52 w-auto opacity-90" />
          </div>
        </div>
      </section>
    </div>
  );
}
