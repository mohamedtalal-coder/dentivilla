import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BookLink } from "@/components/booking/BookLink";
import { getBookingTreatments } from "@/lib/treatments";

export const metadata: Metadata = {
  title: "Treatments & Services",
  description: "Aesthetic dentistry, dental implants, veneers, root canal treatments, and orthodontics at Dentivilla Clinic in Cairo.",
};

export default async function TreatmentsPage() {
  const treatments = await getBookingTreatments();
  return (
    <div className="container-page pt-28 pb-20 md:pt-36">
      <div className="max-w-3xl">
        <p className="eyebrow">Our Treatments</p>
        <h1 className="heading-xl">Dentistry as a Precise, Thoughtful Craft.</h1>
        <p className="lede mt-4">Every procedure starts with clear diagnostic evaluation and a written plan that respects your natural tooth structure.</p>
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
                Details
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <section className="mt-16 rounded-[2rem] bg-teal-deep p-8 text-center text-white sm:p-12">
        <h2 className="text-2xl font-bold">Unsure Which Treatment Fits Your Needs?</h2>
        <p className="mx-auto mt-3 max-w-lg text-teal-light/80">
          Book a comprehensive consultation and select your teeth of concern on our 3D model — we will propose the ideal personalized plan after clinical examination.
        </p>
        <BookLink intent={{ treatmentSlug: "consultation" }} className="btn-gold mt-6">
          Book Comprehensive Consultation
        </BookLink>
      </section>
    </div>
  );
}
