"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, MessageCircle } from "lucide-react";
import { submitBooking } from "@/app/actions/booking";
import { AvailabilityCalendar, formatDayLabel } from "@/components/booking/AvailabilityCalendar";
import { ToothSelector } from "@/components/booking/ToothSelector";
import { BOOKING_INTENT_EVENT, type BookingIntent } from "@/lib/booking-intent";
import type { PublicSlot } from "@/lib/booking-types";
import { MEDICAL_CONDITIONS, MEDICAL_CONDITION_LABEL } from "@/lib/medical-conditions";
import { normalizeEgyptianMobile } from "@/lib/phone";
import { TEETH_BY_FDI } from "@/lib/teeth";

export type BookingTreatment = {
  id: string;
  slug: string;
  nameAr: string;
  summaryAr: string;
  durationMinutes: number;
  requiresTeeth: boolean;
};

type StepId = "treatment" | "teeth" | "time" | "details" | "review";
const STEP_LABEL: Record<StepId, string> = {
  treatment: "Treatment",
  teeth: "Teeth",
  time: "Date & Time",
  details: "Your Details",
  review: "Review",
};

type Details = {
  fullName: string;
  phone: string;
  whatsapp: string;
  notes: string;
  conditions: string[];
  noConditions: boolean;
};

type Errors = Partial<Record<"treatment" | "teeth" | "slot" | keyof Details | "form", string>>;

const isFdi = (value: string) => Boolean(TEETH_BY_FDI[value]);

export function BookingFlow({
  treatments,
  presetTreatmentSlug,
  presetTeeth = [],
  variant = "section",
  whatsappUrl,
}: {
  treatments: BookingTreatment[];
  presetTreatmentSlug?: string;
  presetTeeth?: string[];
  variant?: "section" | "page";
  whatsappUrl: string;
}) {
  const headingId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const preset = treatments.find((t) => t.slug === presetTreatmentSlug);

  const [treatmentId, setTreatmentId] = useState<string>(preset?.id ?? "");
  const [teeth, setTeeth] = useState<string[]>(presetTeeth.filter(isFdi));
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<PublicSlot | null>(null);
  const [details, setDetails] = useState<Details>({
    fullName: "",
    phone: "",
    whatsapp: "",
    notes: "",
    conditions: [],
    noConditions: false,
  });
  const [stepIndex, setStepIndex] = useState(preset ? 1 : 0);
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [done, setDone] = useState<{ reference: string; startsAt: string } | null>(null);

  const treatment = treatments.find((t) => t.id === treatmentId);
  const steps: StepId[] = useMemo(
    () =>
      treatment && !treatment.requiresTeeth
        ? ["treatment", "time", "details", "review"]
        : ["treatment", "teeth", "time", "details", "review"],
    [treatment],
  );
  const step = steps[Math.min(stepIndex, steps.length - 1)];

  const scrollToTop = useCallback(() => {
    rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Handle "book this" requests from elsewhere on the page.
  useEffect(() => {
    const onIntent = (event: Event) => {
      const intent = (event as CustomEvent<BookingIntent>).detail ?? {};
      const target = treatments.find((t) => t.slug === intent.treatmentSlug);
      if (target) {
        setTreatmentId(target.id);
        setSlot(null);
        setStepIndex(1);
      }
      if (intent.teeth?.length) setTeeth(intent.teeth.filter(isFdi));
      setDone(null);
      setErrors({});
    };
    window.addEventListener(BOOKING_INTENT_EVENT, onIntent);
    return () => window.removeEventListener(BOOKING_INTENT_EVENT, onIntent);
  }, [treatments]);

  const toggleTooth = useCallback((fdi: string) => {
    setTeeth((prev) => (prev.includes(fdi) ? prev.filter((t) => t !== fdi) : [...prev, fdi]));
    setErrors((prev) => ({ ...prev, teeth: undefined }));
  }, []);

  const onSlotChange = useCallback((next: PublicSlot | null) => {
    setSlot(next);
    if (next) setErrors((prev) => ({ ...prev, slot: undefined }));
  }, []);

  function validate(current: StepId): Errors {
    const next: Errors = {};
    if (current === "treatment" && !treatment) next.treatment = "Please choose a treatment to proceed.";
    if (current === "teeth" && treatment?.requiresTeeth && teeth.length === 0)
      next.teeth = "Please select at least one tooth — or select 'Comprehensive Consultation' if you are unsure.";
    if (current === "time" && !slot) next.slot = "Please select a date and an available time slot.";
    if (current === "details") {
      if (details.fullName.trim().length < 3) next.fullName = "Please enter your full name (at least 3 characters).";
      if (!normalizeEgyptianMobile(details.phone)) next.phone = "Enter a valid Egyptian mobile number (e.g. 01012345678).";
      if (details.whatsapp.trim() && !normalizeEgyptianMobile(details.whatsapp))
        next.whatsapp = "Invalid WhatsApp number — leave empty to use your mobile number.";
      if (details.notes.length > 500) next.notes = "Notes exceed 500 characters.";
      if (!details.noConditions && details.conditions.length === 0)
        next.conditions = "Please select any health conditions you have, or choose 'None of the above'.";
    }
    return next;
  }

  function goNext() {
    const found = validate(step);
    setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>("[aria-invalid=true], [role=alert]")?.focus());
      return;
    }
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
    scrollToTop();
  }

  function goBack() {
    setErrors({});
    setStepIndex((i) => Math.max(0, i - 1));
    scrollToTop();
  }

  function goTo(target: StepId) {
    const index = steps.indexOf(target);
    if (index >= 0 && index < stepIndex) {
      setErrors({});
      setStepIndex(index);
    }
  }

  async function submit() {
    if (!treatment || !slot) return;
    setPending(true);
    setErrors({});
    try {
      const result = await submitBooking({
        treatmentId: treatment.id,
        teeth,
        startsAt: slot.startsAt,
        fullName: details.fullName,
        phone: details.phone,
        whatsapp: details.whatsapp,
        notes: details.notes,
        medicalConditions: details.noConditions ? [] : details.conditions,
      });
      if (result.ok) {
        setDone({ reference: result.reference, startsAt: result.startsAt });
        scrollToTop();
        return;
      }
      if (result.code === "SLOT_TAKEN" || result.code === "SLOT_INVALID") {
        setSlot(null);
        setRefreshToken((n) => n + 1);
        setStepIndex(steps.indexOf("time"));
        setErrors({ slot: result.error });
        scrollToTop();
        return;
      }
      setErrors({ form: result.error });
    } catch {
      setErrors({ form: "Could not connect to the server. Please check your internet connection and try again." });
    } finally {
      setPending(false);
    }
  }

  function resetAll() {
    setDone(null);
    setTreatmentId("");
    setTeeth([]);
    setDate(null);
    setSlot(null);
    setDetails({ fullName: "", phone: "", whatsapp: "", notes: "", conditions: [], noConditions: false });
    setStepIndex(0);
    setRefreshToken((n) => n + 1);
  }

  const setField = <K extends keyof Details>(key: K, value: Details[K]) => {
    setDetails((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const Heading = variant === "page" ? "h1" : "h2";

  return (
    <div ref={rootRef} className="scroll-mt-28" aria-labelledby={headingId}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="eyebrow">Online Booking</p>
          <Heading id={headingId} className={variant === "page" ? "heading-xl" : "heading-lg"}>
            Book Your Visit in 2 Minutes
          </Heading>
          <p className="lede mt-3">
            No account required. Your selected time is instantly reserved, then confirmed by our clinic team.
          </p>
        </div>
      </div>

      <div className="card-soft overflow-hidden rounded-[2rem]">
        {done ? (
          <Confirmation
            reference={done.reference}
            startsAt={done.startsAt}
            treatment={treatment?.nameAr ?? ""}
            teeth={teeth}
            onAgain={resetAll}
            whatsappUrl={whatsappUrl}
          />
        ) : (
          <>
            <ol className="flex gap-1 overflow-x-auto border-b border-line bg-ivory/60 px-3 py-3 scrollbar-none sm:px-6">
              {steps.map((id, index) => {
                const state = index < stepIndex ? "done" : index === stepIndex ? "current" : "todo";
                return (
                  <li key={id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => goTo(id)}
                      disabled={state !== "done"}
                      aria-current={state === "current" ? "step" : undefined}
                      className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors ${
                        state === "current"
                          ? "bg-white font-semibold text-teal-deep shadow-card"
                          : state === "done"
                            ? "text-teal-mid hover:bg-white/70"
                            : "text-neutral-400"
                      }`}
                    >
                      <span
                        className={`grid size-6 place-items-center rounded-full text-xs ${
                          state === "done"
                            ? "bg-teal text-white"
                            : state === "current"
                              ? "bg-teal-deep text-white"
                              : "bg-neutral-200 text-neutral-500"
                        }`}
                      >
                        {state === "done" ? <Check className="size-3.5" aria-hidden /> : index + 1}
                      </span>
                      {STEP_LABEL[id]}
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="p-5 sm:p-8">
              <div key={step} className="animate-fade-in">
                {step === "treatment" && (
                  <fieldset aria-describedby={errors.treatment ? "treatment-error" : undefined}>
                    <legend className="heading-md">What is the reason for your visit?</legend>
                    <p className="mt-1 text-sm text-muted">Appointment duration is customized based on the procedure.</p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup">
                      {treatments.map((item) => {
                        const selected = item.id === treatmentId;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => {
                              setTreatmentId(item.id);
                              setSlot(null);
                              setErrors({});
                            }}
                            className={`flex h-full flex-col rounded-2xl border p-4 text-left transition-all ${
                              selected
                                ? "border-teal bg-teal-light/50 ring-2 ring-teal/20"
                                : "border-line bg-white hover:border-teal/40"
                            }`}
                          >
                            <span className="flex items-start justify-between gap-3">
                              <span className="font-semibold text-teal-deep">{item.nameAr}</span>
                              <span
                                className={`grid size-5 shrink-0 place-items-center rounded-full border ${
                                  selected ? "border-teal bg-teal text-white" : "border-neutral-300"
                                }`}
                              >
                                {selected && <Check className="size-3" aria-hidden />}
                              </span>
                            </span>
                            <span className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted">{item.summaryAr}</span>
                          </button>
                        );
                      })}
                    </div>
                    {errors.treatment && (
                      <p id="treatment-error" role="alert" tabIndex={-1} className="mt-4 text-sm text-red-700">
                        {errors.treatment}
                      </p>
                    )}
                  </fieldset>
                )}

                {step === "teeth" && (
                  <div>
                    <h3 className="heading-md">Which teeth need attention?</h3>
                    <p className="mt-1 mb-5 text-sm text-muted">
                      Select one or more teeth on the 3D model — this helps us prepare the right diagnostic setup before you arrive.
                    </p>
                    <ToothSelector
                      selected={teeth}
                      onToggle={toggleTooth}
                      onClear={() => setTeeth([])}
                      error={errors.teeth}
                    />
                  </div>
                )}

                {step === "time" && treatment && (
                  <div>
                    <h3 className="heading-md">Choose Date & Time</h3>
                    <p className="mt-1 mb-5 text-sm text-muted">
                      Available appointments are calculated from live clinic availability (Cairo Time).
                    </p>
                    <AvailabilityCalendar
                      treatmentId={treatment.id}
                      date={date}
                      slot={slot}
                      onDateChange={setDate}
                      onSlotChange={onSlotChange}
                      error={errors.slot}
                      refreshToken={refreshToken}
                    />
                  </div>
                )}

                {step === "details" && (
                  <DetailsStep details={details} errors={errors} setField={setField} />
                )}

                {step === "review" && treatment && slot && (
                  <div>
                    <h3 className="heading-md">Review Your Request</h3>
                    <dl className="mt-5 divide-y divide-line rounded-2xl border border-line">
                      <ReviewRow label="Treatment" value={treatment.nameAr} onEdit={() => goTo("treatment")} />
                      {steps.includes("teeth") && (
                        <ReviewRow
                          label="Teeth"
                          value={teeth.map((t) => `${t} (${TEETH_BY_FDI[t]?.nameAr})`).join(", ")}
                          onEdit={() => goTo("teeth")}
                        />
                      )}
                      <ReviewRow
                        label="Date & Time"
                        value={`${formatDayLabel(date ?? slot.startsAt.slice(0, 10))} — ${slot.label}`}
                        onEdit={() => goTo("time")}
                      />
                      <ReviewRow
                        label="Name & Mobile"
                        value={`${details.fullName} · ${normalizeEgyptianMobile(details.phone) ?? details.phone}`}
                        onEdit={() => goTo("details")}
                      />
                      <ReviewRow
                        label="Medical History"
                        value={
                          details.noConditions
                            ? "None"
                            : details.conditions.map((c) => MEDICAL_CONDITION_LABEL[c] || c).join(", ")
                        }
                        onEdit={() => goTo("details")}
                      />
                      {details.notes.trim() && (
                        <ReviewRow label="Notes" value={details.notes} onEdit={() => goTo("details")} />
                      )}
                    </dl>
                    <p className="mt-4 text-xs leading-6 text-muted">
                      By clicking &ldquo;Confirm Booking&rdquo;, this time slot is reserved for you and you agree to our clinic contacting you to confirm your appointment according to our{" "}
                      <Link href="/privacy" target="_blank" className="font-semibold text-teal-deep underline underline-offset-4 hover:text-teal">
                        Privacy & Data Protection Policy
                      </Link>.
                    </p>
                    {errors.form && (
                      <p role="alert" tabIndex={-1} className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                        {errors.form}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-6">
                {stepIndex > 0 ? (
                  <button type="button" onClick={goBack} className="btn-secondary" disabled={pending}>
                    <ArrowLeft className="size-4" aria-hidden />
                    Back
                  </button>
                ) : (
                  <span />
                )}
                {step === "review" ? (
                  <button type="button" onClick={submit} className="btn-primary" disabled={pending}>
                    {pending ? "Reserving Slot…" : "Confirm Booking"}
                    {!pending && <Check className="size-4" aria-hidden />}
                  </button>
                ) : (
                  <button type="button" onClick={goNext} className="btn-primary">
                    Next
                    <ArrowRight className="size-4" aria-hidden />
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3.5">
      <div className="min-w-0">
        <dt className="text-xs text-muted">{label}</dt>
        <dd className="mt-0.5 break-words font-medium text-ink">{value}</dd>
      </div>
      <button type="button" onClick={onEdit} className="shrink-0 text-sm text-teal-mid hover:underline">
        Edit
      </button>
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-sm text-red-700">
      {message}
    </p>
  );
}

function DetailsStep({
  details,
  errors,
  setField,
}: {
  details: Details;
  errors: Errors;
  setField: <K extends keyof Details>(key: K, value: Details[K]) => void;
}) {
  const toggleCondition = (id: string) => {
    const next = details.conditions.includes(id)
      ? details.conditions.filter((c) => c !== id)
      : [...details.conditions, id];
    setField("conditions", next);
    if (next.length) setField("noConditions", false);
  };

  return (
    <div className="grid gap-8">
      <div>
        <h3 className="heading-md">Contact Information</h3>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="bk-name" className="field-label">
              Full Name
            </label>
            <input
              id="bk-name"
              className="field"
              autoComplete="name"
              placeholder="e.g. John Doe"
              value={details.fullName}
              onChange={(e) => setField("fullName", e.target.value)}
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? "bk-name-error" : undefined}
              maxLength={80}
            />
            <FieldError id="bk-name-error" message={errors.fullName} />
          </div>
          <div>
            <label htmlFor="bk-phone" className="field-label">
              Mobile Number
            </label>
            <input
              id="bk-phone"
              className="field"
              dir="ltr"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="01X XXXX XXXX"
              value={details.phone}
              onChange={(e) => setField("phone", e.target.value)}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "bk-phone-error" : "bk-phone-hint"}
            />
            {errors.phone ? (
              <FieldError id="bk-phone-error" message={errors.phone} />
            ) : (
              <p id="bk-phone-hint" className="mt-1.5 text-xs text-muted">
                Required with your reference code to check your booking.
              </p>
            )}
          </div>
          <div>
            <label htmlFor="bk-wa" className="field-label">
              WhatsApp <span className="font-normal text-muted">(Optional)</span>
            </label>
            <input
              id="bk-wa"
              className="field"
              dir="ltr"
              type="tel"
              inputMode="tel"
              placeholder="Defaults to mobile number if empty"
              value={details.whatsapp}
              onChange={(e) => setField("whatsapp", e.target.value)}
              aria-invalid={Boolean(errors.whatsapp)}
              aria-describedby={errors.whatsapp ? "bk-wa-error" : undefined}
            />
            <FieldError id="bk-wa-error" message={errors.whatsapp} />
          </div>
          <div>
            <label htmlFor="bk-notes" className="field-label">
              Brief Concern / Symptoms <span className="font-normal text-muted">(Optional)</span>
            </label>
            <input
              id="bk-notes"
              className="field"
              placeholder="e.g. Cold sensitivity in molar for a week"
              value={details.notes}
              onChange={(e) => setField("notes", e.target.value)}
              aria-invalid={Boolean(errors.notes)}
              aria-describedby={errors.notes ? "bk-notes-error" : undefined}
              maxLength={500}
            />
            <FieldError id="bk-notes-error" message={errors.notes} />
          </div>
        </div>
      </div>

      <fieldset aria-describedby={errors.conditions ? "bk-conditions-error" : "bk-conditions-hint"}>
        <legend className="heading-md">Medical History</legend>
        <p id="bk-conditions-hint" className="mt-1 text-sm text-muted">
          Helps the doctor select safe anesthesia and medications. Kept strictly confidential.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {MEDICAL_CONDITIONS.map((condition) => {
            const checked = details.conditions.includes(condition.id);
            return (
              <label
                key={condition.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-sm transition-colors ${
                  checked ? "border-teal bg-teal-light/50 text-teal-deep" : "border-line hover:border-teal/40"
                }`}
              >
                <input
                  type="checkbox"
                  className="size-4 accent-teal"
                  checked={checked}
                  onChange={() => toggleCondition(condition.id)}
                />
                {condition.label}
              </label>
            );
          })}
        </div>
        <label
          className={`mt-3 flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-sm ${
            details.noConditions ? "border-teal bg-teal-light/50 text-teal-deep" : "border-line"
          }`}
        >
          <input
            type="checkbox"
            className="size-4 accent-teal"
            checked={details.noConditions}
            onChange={(e) => {
              setField("noConditions", e.target.checked);
              if (e.target.checked) setField("conditions", []);
            }}
          />
          I do not have any of the above conditions
        </label>
        {errors.conditions && (
          <p id="bk-conditions-error" role="alert" tabIndex={-1} className="mt-2 text-sm text-red-700">
            {errors.conditions}
          </p>
        )}
      </fieldset>
    </div>
  );
}

function Confirmation({
  reference,
  startsAt,
  treatment,
  teeth,
  onAgain,
  whatsappUrl,
}: {
  whatsappUrl: string;
  reference: string;
  startsAt: string;
  treatment: string;
  teeth: string[];
  onAgain: () => void;
}) {
  const when = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(startsAt));

  return (
    <div className="grid place-items-center px-6 py-14 text-center" role="status">
      <CheckCircle2 className="size-14 text-teal" aria-hidden />
      <h3 className="heading-md mt-4">Booking Received & Slot Reserved</h3>
      <p className="mt-2 max-w-md leading-7 text-muted">
        Our clinic team will contact you to confirm your appointment. Please keep your reference code to check your status anytime.
      </p>
      <div className="mt-6 w-full max-w-sm rounded-2xl border border-line bg-ivory p-5 text-left">
        <p className="text-xs text-muted">Reference Code</p>
        <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-teal-deep" dir="ltr">
          {reference}
        </p>
        <p className="mt-3 text-sm font-semibold text-ink">{treatment}</p>
        <p className="text-sm text-muted">{when} (Cairo Time)</p>
        {teeth.length > 0 && <p className="mt-1 font-mono text-xs text-muted">FDI Teeth: {teeth.join(", ")}</p>}
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href={`/booking/status?ref=${encodeURIComponent(reference)}`} className="btn-primary">
          Check Booking Status
        </Link>
        <a
          href={`${whatsappUrl}?text=${encodeURIComponent(`Hello, my booking reference is ${reference}`)}`}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary"
        >
          <MessageCircle className="size-4" aria-hidden />
          Message Clinic
        </a>
        <button type="button" onClick={onAgain} className="btn px-4 text-muted hover:text-ink">
          Book Another Appointment
        </button>
      </div>
    </div>
  );
}
