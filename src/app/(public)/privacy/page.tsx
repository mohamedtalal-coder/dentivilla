import type { Metadata } from "next";
import Link from "next/link";
import {
  Clock,
  Database,
  EyeOff,
  FileCheck,
  KeyRound,
  Lock,
  Scale,
  Shield,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { site } from "@/lib/site";
import { getContactInfo } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "Privacy & Encrypted Data Protection Policy | Dentivilla",
  description:
    "Learn how Dentivilla protects and encrypts patient records using certified AES-256-GCM encryption, maintaining absolute medical confidentiality.",
};

export default async function PrivacyPolicyPage() {
  const contact = await getContactInfo();

  return (
    <div className="bg-ivory/40 pb-24 pt-28 md:pt-36">
      <div className="container-page max-w-4xl space-y-12">
        {/* Header */}
        <header className="border-b border-line pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal/20 bg-teal-light px-3.5 py-1 text-xs font-semibold text-teal-deep">
            <ShieldCheck className="size-4 text-teal" aria-hidden />
            <span>Data Protection & Medical Confidentiality</span>
          </div>
          <h1 className="heading-xl mt-4 text-teal-deep">Privacy & Data Protection Policy</h1>
          <p className="lede mt-3 text-muted">
            At <span className="font-semibold text-ink">Dentivilla</span> under the clinical direction of{" "}
            <span className="font-semibold text-ink">{site.doctor.name}</span>, your medical privacy and the security of your personal data are an uncompromising ethical and professional duty. Here we transparently explain how we collect, encrypt, and safeguard your information.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5" aria-hidden />
              Last updated: November 2026
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Lock className="size-3.5 text-teal" aria-hidden />
              Application-level AES-256-GCM encryption active
            </span>
          </div>
        </header>

        {/* 1. Technical Security Highlight Card */}
        <section className="rounded-3xl border border-teal/30 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-teal-light text-teal-deep">
              <KeyRound className="size-6 text-teal" aria-hidden />
            </div>
            <div>
              <h2 className="text-xl font-bold text-teal-deep">Application-Level Encryption (AES-256-GCM)</h2>
              <p className="mt-2 text-sm leading-7 text-neutral-600">
                We do not settle for baseline database security alone; we apply true cryptographic protection inside the application layer before records ever reach the database:
              </p>
              <ul className="mt-4 grid gap-2.5 text-sm text-neutral-700 sm:grid-cols-2">
                <li className="flex items-center gap-2 rounded-xl bg-ivory px-3.5 py-2">
                  <Shield className="size-4 text-teal" aria-hidden />
                  <span>Certified <strong>AES-256-GCM</strong> for names and clinical notes</span>
                </li>
                <li className="flex items-center gap-2 rounded-xl bg-ivory px-3.5 py-2">
                  <Shield className="size-4 text-teal" aria-hidden />
                  <span>Unique initialization vector (IV) per booking record</span>
                </li>
                <li className="flex items-center gap-2 rounded-xl bg-ivory px-3.5 py-2">
                  <Shield className="size-4 text-teal" aria-hidden />
                  <span>Keyed <strong>HMAC-SHA-256</strong> blind index for mobile lookup</span>
                </li>
                <li className="flex items-center gap-2 rounded-xl bg-ivory px-3.5 py-2">
                  <Shield className="size-4 text-teal" aria-hidden />
                  <span>Tamper-proof authentication tags verifying data integrity</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 2. What data we collect */}
        <section className="space-y-4">
          <h2 className="heading-md text-teal-deep">1. Data We Collect & Why</h2>
          <p className="text-sm leading-7 text-neutral-600">
            We adhere strictly to <strong>Data Minimization</strong>: we only request and process what is medically and administratively essential to deliver safe dental care:
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card-soft rounded-2xl p-5">
              <h3 className="font-bold text-teal-deep">A. Basic Contact Details</h3>
              <p className="mt-2 text-xs leading-6 text-neutral-600">
                <strong>Full Name, Mobile Number (and optional WhatsApp):</strong> Used exclusively to communicate directly with you, confirm your booking, or alert you of schedule adjustments.
              </p>
            </div>

            <div className="card-soft rounded-2xl p-5">
              <h3 className="font-bold text-teal-deep">B. Procedure Details & Affected Teeth</h3>
              <p className="mt-2 text-xs leading-6 text-neutral-600">
                <strong>Treatment Category & Teeth (FDI Notation):</strong> Allows our doctor and clinical team to allocate appropriate time and prepare sterile setups prior to your arrival.
              </p>
            </div>

            <div className="card-soft rounded-2xl p-5">
              <h3 className="font-bold text-teal-deep">C. Patient-Reported Medical History</h3>
              <p className="mt-2 text-xs leading-6 text-neutral-600">
                <strong>Pre-existing Conditions (e.g. diabetes, hypertension, blood thinners, allergies):</strong> Vital to safeguard patient well-being and avoid adverse anesthetic or surgical contraindications.
              </p>
            </div>

            <div className="card-soft rounded-2xl p-5">
              <h3 className="font-bold text-teal-deep">D. Notes & Dental Concerns</h3>
              <p className="mt-2 text-xs leading-6 text-neutral-600">
                <strong>Optional Patient Notes:</strong> Preliminary description of symptoms or aesthetic aspirations to discuss during consultation.
              </p>
            </div>
          </div>
        </section>

        {/* 3. What we NEVER do */}
        <section className="rounded-3xl border border-line bg-white p-6 sm:p-8">
          <h2 className="heading-md text-teal-deep">2. What We Never Do</h2>
          <div className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-2xl bg-ivory p-4">
              <EyeOff className="size-5 shrink-0 text-teal" aria-hidden />
              <div>
                <p className="font-bold text-ink">Zero Advertising Trackers</p>
                <p className="mt-1 text-xs text-muted">We use zero advertising trackers or cross-site surveillance cookies.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-ivory p-4">
              <Database className="size-5 shrink-0 text-teal" aria-hidden />
              <div>
                <p className="font-bold text-ink">Never Sell Data</p>
                <p className="mt-1 text-xs text-muted">Your health records are never commercialized, sold, or shared with third-party marketers.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-ivory p-4">
              <Lock className="size-5 shrink-0 text-teal" aria-hidden />
              <div>
                <p className="font-bold text-ink">No Online Card Payments</p>
                <p className="mt-1 text-xs text-muted">Booking is free with no card required online; payments occur in-clinic through standard methods.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Clinical Photos Consent Policy */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <FileCheck className="size-5 text-teal" aria-hidden />
            <h2 className="heading-md text-teal-deep">3. Clinical Photos Consent Policy</h2>
          </div>
          <div className="card-soft rounded-2xl p-6 text-sm leading-7 text-neutral-600">
            <p>
              Photographs showcased in our <Link href="/cases" className="font-semibold text-teal-deep underline underline-offset-4">Before & After Gallery</Link> adhere strictly to professional medical ethics:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-2 text-neutral-700">
              <li>
                <strong>Explicit Written Consent:</strong> No clinical photo is ever published without prior, documented patient authorization.
              </li>
              <li>
                <strong>Anonymity & Privacy:</strong> Imagery focuses strictly on the dental smile zone, protecting personal facial features to preserve privacy.
              </li>
              <li>
                <strong>Right of Revocation:</strong> Any patient who consented previously may request removal of their photos at any time, which we honor immediately.
              </li>
            </ul>
          </div>
        </section>

        {/* 5. Patient Rights */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <UserCheck className="size-5 text-teal" aria-hidden />
            <h2 className="heading-md text-teal-deep">4. Your Rights as a Patient</h2>
          </div>
          <p className="text-sm leading-7 text-neutral-600">
            Under medical dental ethics and applicable personal data protection laws, you retain the following rights:
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-white p-4 text-xs leading-6 text-neutral-600">
              <span className="font-bold text-ink">Right to Access:</span> Review your appointment status and details at any time via the <Link href="/booking/status" className="font-semibold text-teal-deep underline">Check Booking</Link> page.
            </div>
            <div className="rounded-xl border border-line bg-white p-4 text-xs leading-6 text-neutral-600">
              <span className="font-bold text-ink">Right to Rectification:</span> Correct any inaccuracies in your contact info by reaching out to the clinic or upon your visit.
            </div>
            <div className="rounded-xl border border-line bg-white p-4 text-xs leading-6 text-neutral-600">
              <span className="font-bold text-ink">Right to Cancellation / Erasure:</span> Request appointment cancellation or digital record erasure, consistent with statutory medical record retention obligations.
            </div>
            <div className="rounded-xl border border-line bg-white p-4 text-xs leading-6 text-neutral-600">
              <span className="font-bold text-ink">Absolute Medical Confidentiality:</span> Zero disclosure of clinical records to third parties without your authorization, except where mandated by law.
            </div>
          </div>
        </section>

        {/* 6. Legal Context & Compliance */}
        <section className="space-y-4 rounded-3xl border border-amber/30 bg-amber-light/30 p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <Scale className="size-5 text-amber-dark" aria-hidden />
            <h2 className="heading-md text-teal-deep">5. Legal & Professional Compliance</h2>
          </div>
          <p className="text-sm leading-7 text-neutral-700">
            Dentivilla&apos;s data practices conform with Egyptian statutory requirements and dental council codes of conduct:
          </p>
          <ul className="mt-2 space-y-2 text-xs leading-6 text-neutral-700">
            <li className="flex items-start gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-teal" />
              <span><strong>Personal Data Protection Law No. 151 of 2020:</strong> Ensuring lawful processing, transparency, and high-standard encryption for sensitive health data.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-teal" />
              <span><strong>Egyptian Medical Syndicate Code of Ethics:</strong> Strict adherence to doctor-patient confidentiality and professional secrecy.</span>
            </li>
          </ul>
        </section>

        {/* 7. Contact Us for Privacy Queries */}
        <section className="rounded-3xl border border-teal/20 bg-teal-light/40 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-teal-deep">Have Questions About Your Privacy?</h2>
              <p className="mt-1 text-xs leading-5 text-neutral-600">
                If you have questions regarding data encryption or wish to exercise any of your rights, we welcome your direct message.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a href={contact.whatsappUrl} target="_blank" rel="noreferrer" className="btn-primary text-xs">
                WhatsApp Clinic
              </a>
              <Link href="/contact" className="btn-secondary text-xs">
                Contact & Location Info
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
