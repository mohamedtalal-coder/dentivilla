"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ArrowRight, CalendarClock, ClipboardCheck, MessageCircle, Stethoscope } from "lucide-react";
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
    label: "Shape or Shade of Front Teeth",
    hint: "Gaps, minor chips, asymmetry",
    image: "/images/teeth/incisor.webp",
    imageAlt: "3D model of an upper central incisor",
    title: "Porcelain Veneers & Smile Design",
    concern: "I want a balanced, attractive smile, but I'm worried about aggressive shaving of my natural teeth.",
    assess: "High-resolution digital photography, enamel thickness assessment, lip line, and facial proportion analysis.",
    approach:
      "Digital Smile Design followed by an intraoral mockup you see and test before any preparation. Preparation is tailored per tooth and kept minimal.",
    visits: "Typically 2–3 visits",
    note: "The necessity and extent of preparation are determined after clinical evaluation.",
  },
  {
    id: "missing",
    treatmentSlug: "implants",
    label: "Missing or Mobile Tooth",
    hint: "Gap affecting chewing or smile",
    image: "/images/teeth/implant.webp",
    imageAlt: "3D model of a dental implant with abutment and crown",
    title: "Digitally Planned Dental Implants",
    concern: "I lost a tooth and want a permanent, stable replacement without touching adjacent teeth.",
    assess: "3D CBCT scan to evaluate bone density, height, nerve paths, and sinus proximity.",
    approach:
      "Pre-surgical computer planning with 3D surgical guides when indicated. The final ceramic crown is fitted after osseointegration.",
    visits: "2 main phases across several weeks to months",
    note: "Healing and integration periods vary by bone quality and general health.",
  },
  {
    id: "color",
    treatmentSlug: "whitening",
    label: "Yellowing or Stained Teeth",
    hint: "Discoloration from coffee, smoking, or age",
    image: "/images/teeth/canine.webp",
    imageAlt: "3D model of an upper canine",
    title: "In-Office Laser Teeth Whitening",
    concern: "My teeth look dull or stained and I want a brighter, natural shade without uncomfortable sensitivity.",
    assess: "Baseline shade mapping, inspection of existing fillings/crowns, and sensitivity evaluation.",
    approach:
      "Gum barrier protection followed by gentle in-office laser activation, plus post-care guidance to prolong results and protect enamel.",
    visits: "Usually 1 session (45 minutes)",
    note: "Results vary depending on stain etiology and enamel characteristics.",
  },
  {
    id: "pain",
    treatmentSlug: "root-canal",
    label: "Toothache or Temperature Sensitivity",
    hint: "Pain with hot, cold, or when biting",
    image: "/images/teeth/molar.webp",
    imageAlt: "3D model of an upper molar with 3 roots",
    title: "Microscopic Root Canal Therapy",
    concern: "I have persistent pain in a tooth and want to save it rather than pull it.",
    assess: "Clinical vitality tests and digital radiographs to locate the source, canal anatomy, and periapical status.",
    approach:
      "Thorough cleaning, disinfection, and warm 3D obturation under magnification, followed by structural restoration to protect remaining tooth.",
    visits: "1–2 visits",
    note: "If you have acute pain, mention it during booking for our earliest priority slot.",
  },
  {
    id: "alignment",
    treatmentSlug: "orthodontics",
    label: "Misaligned or Crowded Teeth",
    hint: "Crowding, spacing, or bite issues",
    image: "/images/teeth/premolar.webp",
    imageAlt: "3D model of an upper premolar",
    title: "Orthodontics & Clear Aligners",
    concern: "I want straight teeth and an aligned bite with comfortable, discreet treatment.",
    assess: "Digital 3D intraoral scan, facial photos, and cephalometric analysis to evaluate jaw arches and occlusion.",
    approach:
      "Custom treatment planning — including clear aligners or aesthetic brackets — with digital simulation of expected tooth movement.",
    visits: "Checkups every 4–8 weeks",
    note: "Total treatment duration is established following comprehensive diagnostic records.",
  },
  {
    id: "unsure",
    treatmentSlug: "consultation",
    label: "Not Sure Where to Start",
    hint: "Comprehensive exam & written plan",
    image: "/images/teeth/lower-molar.webp",
    imageAlt: "3D model of a lower molar with 2 roots",
    title: "Comprehensive Clinical Consultation",
    concern: "I want an honest, comprehensive overview of my oral health before committing to anything.",
    assess: "Full examination of teeth, periodontal tissues, bite relationship, and necessary diagnostic radiographs.",
    approach:
      "Clear explanation with a prioritized written treatment plan, transparent fees, and projected timeline before any procedure begins.",
    visits: "1 visit",
    note: "You can select the teeth that concern you on the 3D model during booking.",
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
      ArrowRight: 1,
      ArrowLeft: -1,
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
          <p className="eyebrow">Start From Your Needs</p>
          <h2 id="concerns-title" className="heading-lg">
            What Does Your Smile Need Today?
          </h2>
          <p className="lede mt-4">
            Select what concerns you, and we will explain our diagnostic steps and treatment approach — then book your visit directly online.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div
            role="tablist"
            aria-orientation="vertical"
            aria-label="Common dental concerns"
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
                  className={`group flex w-[78vw] max-w-[300px] shrink-0 snap-start items-center gap-4 rounded-2xl border p-3 text-left transition-all sm:w-auto sm:max-w-none sm:min-w-0 ${
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
                  <ArrowRight
                    aria-hidden
                    className={`size-4 shrink-0 transition-all ${
                      selected ? "text-teal" : "text-neutral-300 group-hover:translate-x-0.5"
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
                <blockquote className="mt-4 border-l-2 border-amber pl-4 text-[15px] leading-7 text-muted italic">
                  “{active.concern}”
                </blockquote>

                <dl className="mt-6 grid gap-5">
                  <div className="flex gap-3">
                    <Stethoscope className="mt-1 size-5 shrink-0 text-teal" aria-hidden />
                    <div>
                      <dt className="font-semibold text-teal-deep">What We Assess First</dt>
                      <dd className="mt-1 leading-7 text-muted">{active.assess}</dd>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <ClipboardCheck className="mt-1 size-5 shrink-0 text-teal" aria-hidden />
                    <div>
                      <dt className="font-semibold text-teal-deep">How We Treat</dt>
                      <dd className="mt-1 leading-7 text-muted">{active.approach}</dd>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CalendarClock className="mt-1 size-5 shrink-0 text-teal" aria-hidden />
                    <div>
                      <dt className="font-semibold text-teal-deep">Estimated Visits</dt>
                      <dd className="mt-1 leading-7 text-muted">
                        {active.visits}
                        <span className="block text-sm text-neutral-500">{active.note}</span>
                      </dd>
                    </div>
                  </div>
                </dl>

                <div className="mt-8 flex flex-wrap gap-3">
                  <BookLink intent={{ treatmentSlug: active.treatmentSlug }} className="btn-primary">
                    Book for this Care
                    <ArrowRight className="size-4" aria-hidden />
                  </BookLink>
                  <a
                    href={`${whatsappUrl}?text=${encodeURIComponent(`Hello, I'd like to ask about: ${active.title}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary"
                  >
                    <MessageCircle className="size-4" aria-hidden />
                    Ask via WhatsApp
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
