import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, Crosshair, Repeat, Sparkles } from "lucide-react";
import { BookLink } from "@/components/booking/BookLink";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const treatment = await prisma.treatment.findUnique({ where: { slug } });
  return { title: treatment?.nameAr ?? "Treatment", description: treatment?.summaryAr };
}

export default async function TreatmentPage({ params }: Props) {
  const { slug } = await params;
  const treatment = await prisma.treatment.findUnique({ where: { slug } });
  if (!treatment) notFound();

  return (
    <div className="container-page max-w-4xl pt-28 pb-20 md:pt-36">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm">
        <Link href="/treatments" className="inline-flex items-center gap-1.5 text-teal-mid hover:text-teal-deep">
          <ArrowLeft className="size-4" aria-hidden />
          All Treatments
        </Link>
      </nav>
      <p className="eyebrow">Treatments</p>
      <h1 className="heading-xl">{treatment.nameAr}</h1>
      <p className="lede mt-4">{treatment.summaryAr}</p>

      <article className="card-soft mt-10 rounded-[2rem] p-6 sm:p-10">
        <h2 className="heading-md">About the Procedure</h2>
        <p className="mt-4 leading-9 whitespace-pre-line text-ink/85">{treatment.descriptionAr}</p>
        <dl className="mt-8 grid gap-4 border-t border-line pt-6 sm:grid-cols-2">
          <div className="flex gap-3 rounded-2xl bg-ivory p-4">
            <Sparkles className="mt-0.5 size-5 text-teal" aria-hidden />
            <div>
              <dt className="text-sm text-muted">Treatment Plan</dt>
              <dd className="font-semibold">Tailored precisely after clinical examination</dd>
            </div>
          </div>
          <div className="flex gap-3 rounded-2xl bg-ivory p-4">
            <Crosshair className="mt-0.5 size-5 text-teal" aria-hidden />
            <div>
              <dt className="text-sm text-muted">When Booking</dt>
              <dd className="font-semibold">
                {treatment.requiresTeeth ? "Select affected teeth on 3D jaw model" : "No tooth selection required"}
              </dd>
            </div>
          </div>
          <div className="flex gap-3 rounded-2xl bg-ivory p-4">
            <Clock className="mt-0.5 size-5 text-teal" aria-hidden />
            <div>
              <dt className="text-sm text-muted">Session Duration</dt>
              <dd className="font-semibold">{treatment.durationMinutes} minutes per visit</dd>
            </div>
          </div>
          {treatment.numberOfVisits != null && (
            <div className="flex gap-3 rounded-2xl bg-ivory p-4">
              <Repeat className="mt-0.5 size-5 text-teal" aria-hidden />
              <div>
                <dt className="text-sm text-muted">Number of Visits</dt>
                <dd className="font-semibold">
                  {treatment.numberOfVisits} {treatment.numberOfVisits === 1 ? "visit" : "visits"}
                </dd>
              </div>
            </div>
          )}
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          <BookLink intent={{ treatmentSlug: treatment.slug }} className="btn-primary">
            Book This Treatment
            <ArrowRight className="size-4" aria-hidden />
          </BookLink>
          <Link href="/treatments" className="btn-secondary">
            Other Treatments
          </Link>
        </div>
      </article>
    </div>
  );
}
