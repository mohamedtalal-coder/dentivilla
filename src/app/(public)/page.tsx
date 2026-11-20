import Link from "next/link";
import {
  ArrowRight,
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
    title: "Precision Digital Diagnostics",
    description: "3D CBCT imaging and high-magnification diagnostics pinpoint the source of concern with utmost precision before any intervention.",
  },
  {
    icon: FileCheck,
    title: "Upfront Written Treatment Plan",
    description: "Complete transparency outlining treatment options, timelines, and costs in detail so you feel confident without unexpected surprises.",
  },
  {
    icon: Sparkles,
    title: "Conservative & Pain-Free Care",
    description: "Preserving your natural tooth structure is our foremost priority, using modern anesthesia and comfort protocols for a calm experience.",
  },
  {
    icon: ShieldCheck,
    title: "European Sterilization Standards",
    description: "Rigorous infection control protocols and individually sealed instrument packs ensure complete patient safety at every visit.",
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
            <p className="eyebrow">Dentivilla Clinic · {site.addressShort}</p>
            <h1 id="hero-title" className="heading-xl">
              A Natural, Harmonious Smile
              <span className="block text-amber-dark">Rooted in Precision and Attentive Care.</span>
            </h1>
            <p className="lede mt-6 max-w-xl">
              {site.doctor.name} — {site.doctor.title}. Conservative and aesthetic dentistry dedicated to preserving your natural tooth structure, guided by a clear written plan you see and understand before treatment begins.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/booking" className="btn-primary px-7 py-3.5 text-base">
                Book Your Appointment
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <a
                href={contact.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary px-7 py-3.5 text-base"
              >
                <MessageCircle className="size-4" aria-hidden />
                Chat on WhatsApp
              </a>
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted">
              <span>Already booked?</span>
              <Link
                href="/booking/status"
                className="inline-flex items-center gap-1 font-semibold text-teal-mid hover:text-teal-deep hover:underline"
              >
                Check booking status
                <ArrowRight className="size-3" aria-hidden />
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
              <p className="eyebrow">Clinic Services</p>
              <h2 id="treatments-title" className="heading-lg">
                Specialized Treatments with Conservative Craftsmanship
              </h2>
              <p className="lede mt-3">
                Aesthetic and restorative solutions designed to safeguard your natural teeth while delivering lasting comfort and harmonious beauty.
              </p>
            </div>
            <Link href="/treatments" className="btn-secondary">
              View All Treatments
              <ArrowRight className="size-4" aria-hidden />
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
                      Tailored Care
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
                    Details
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden />
                  </Link>
                  <Link
                    href={`/booking?treatment=${treatment.slug}`}
                    className="rounded-full bg-teal-light px-3.5 py-1.5 text-xs text-teal-deep transition-colors hover:bg-teal hover:text-white"
                  >
                    Book Now
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
            <p className="eyebrow">About the Doctor</p>
            <h2 id="doctor-title" className="heading-lg">
              {site.doctor.name}
            </h2>
            <p className="mt-2 text-lg font-medium text-amber-dark">
              {site.doctor.title}
            </p>
            <p className="lede mt-5 max-w-2xl font-medium text-ink/90">
              Experienced in veneers, crowns, bridges, root canal treatments, dental implants, orthodontics, oral surgery, and comprehensive dental care.
            </p>
            <p className="mt-4 leading-8 text-muted">
              Combining a comprehensive approach to dentistry with precision, attention to detail, and personalized treatment planning to deliver long-lasting results and naturally beautiful smiles.
            </p>
            <ul className="mt-6 grid gap-2.5 text-sm font-medium text-teal-deep sm:grid-cols-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-teal" aria-hidden />
                <span>Microscopic and digital exam before any intervention</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-teal" aria-hidden />
                <span>Maximum preservation of natural tooth enamel</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-teal" aria-hidden />
                <span>Clear written plan with exact fees and timelines</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-teal" aria-hidden />
                <span>Gentle anesthesia and anxiety-free patient comfort</span>
              </li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/about" className="btn-secondary">
                Learn More About the Doctor & Philosophy
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
          <PhilosophyPanel
            className="aspect-[4/5] lg:col-span-5"
            images={siteImages.philosophyImages}
            src={siteImages.philosophy}
          />
        </div>
      </section>

      {/* 4. Selected Before-and-After Cases */}
      {homepageCases.length > 0 && (
        <section className="section border-t border-line bg-white" aria-labelledby="cases-title">
          <div className="container-page">
            <div className="mx-auto max-w-2xl text-center">
              <p className="eyebrow">Clinical Results</p>
              <h2 id="cases-title" className="heading-lg">
                Real Results Reflecting Nature & Balance
              </h2>
              <p className="lede mt-3">
                Slide the divider to compare before and after treatment. Each result represents a personalized treatment pathway tailored to the patient.
              </p>
            </div>
            <CasesCarousel cases={homepageCases} />
            <div className="mt-8 flex flex-col items-center gap-3">
              <Link
                href="/cases"
                className="inline-flex items-center gap-2 font-semibold text-teal-mid hover:text-teal-deep"
              >
                View More Cases in Gallery
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <p className="text-xs text-muted">
                Images published with patient consent. Actual treatment and results are determined after clinical examination.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 5. Genuine Reasons to Choose the Clinic */}
      <section className="section bg-alabaster" aria-labelledby="reasons-title">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Why Dentivilla?</p>
            <h2 id="reasons-title" className="heading-lg">
              Standards That Ensure Safety and Peace of Mind
            </h2>
            <p className="lede mt-3">
              A careful, conservative medical approach placing patient safety, comfort, and absolute transparency first.
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
            <p className="eyebrow">Visit Us</p>
            <h2 id="contact-cta-title" className="heading-lg">
              Ready for a Healthy, Confident Smile?
            </h2>
            <p className="lede mt-3">
              Choose your preferred appointment online in minutes, or connect directly with our clinic team.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {/* Direct Booking */}
            <div className="card-soft flex flex-col justify-between rounded-[1.75rem] p-7">
              <div>
                <span className="grid size-11 place-items-center rounded-xl bg-teal-light text-teal-deep">
                  <CalendarCheck className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-bold text-teal-deep">Direct Online Booking</h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Choose your treatment and pick a real-time slot directly from our calendar with optional tooth selection.
                </p>
              </div>
              <div className="mt-6">
                <Link href="/booking" className="btn-primary w-full py-3">
                  Book Your Visit
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </div>

            {/* Direct Communication */}
            <div className="card-soft flex flex-col justify-between rounded-[1.75rem] p-7">
              <div>
                <span className="grid size-11 place-items-center rounded-xl bg-teal-light text-teal-deep">
                  <Phone className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-bold text-teal-deep">Phone & WhatsApp</h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Reach out to reception for quick questions or assistance in scheduling your visit.
                </p>
                <a
                  href={`tel:${contact.phone}`}
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
                  Chat on WhatsApp
                </a>
              </div>
            </div>

            {/* Location & Hours */}
            <div className="card-soft flex flex-col justify-between rounded-[1.75rem] p-7">
              <div>
                <span className="grid size-11 place-items-center rounded-xl bg-teal-light text-teal-deep">
                  <MapPin className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-bold text-teal-deep">Location & Hours</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{contact.address}</p>
                <div className="mt-3 border-t border-line/60 pt-3">
                  <dl className="grid gap-1.5 text-xs">
                    {hours.map((row) => (
                      <div key={row.days} className="flex justify-between gap-2 text-muted">
                        <span>{row.days}</span>
                        <span className={row.hours ? "font-medium text-ink" : "text-amber-dark"}>
                          {row.hours ?? "Closed"}
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
                  Open in Google Maps
                  <ArrowRight className="size-4" aria-hidden />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
