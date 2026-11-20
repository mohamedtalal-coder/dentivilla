import Link from "next/link";
import { notFound } from "next/navigation";
import { HeartPulse, Sparkles } from "lucide-react";
import { AppointmentActions } from "@/components/admin/AppointmentActions";
import { AppointmentTreatmentEditor } from "@/components/admin/AppointmentTreatmentEditor";
import { requireAdminSession } from "@/lib/admin-auth";
import { formatCairoDateTime } from "@/lib/datetime";
import { decryptAppointmentWithPatient } from "@/lib/encryption";
import { statusLabel } from "@/lib/labels";
import { MEDICAL_CONDITION_LABEL } from "@/lib/medical-conditions";
import { prisma } from "@/lib/prisma";
import { formatTeeth } from "@/lib/teeth";

export default async function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  const { id } = await params;
  const [rawAppointment, treatments] = await Promise.all([
    prisma.appointment.findUnique({
      where: { id },
      include: { patient: true, treatment: true },
    }),
    prisma.treatment.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        nameAr: true,
        summaryAr: true,
        durationMinutes: true,
        requiresTeeth: true,
      },
    }),
  ]);

  if (!rawAppointment) notFound();

  const appointment = decryptAppointmentWithPatient(rawAppointment);
  const conditions = appointment.medicalConditions.map((c) => MEDICAL_CONDITION_LABEL[c] ?? c);

  return (
    <div className="grid gap-6">
      <Link href="/admin/appointments" className="text-sm text-teal-mid hover:underline">
        ← All Appointments
      </Link>
      <div className="card-soft rounded-3xl p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-sm text-muted" dir="ltr">
              {appointment.reference}
            </p>
            <h1 className="heading-md mt-1">{appointment.patient.fullName}</h1>
          </div>
          <span className="chip border-line bg-ivory">{statusLabel[appointment.status]}</span>
        </div>

        {conditions.length > 0 && (
          <div className="mt-5 flex gap-3 rounded-2xl border border-amber/40 bg-amber-light p-4 text-sm">
            <HeartPulse className="mt-0.5 size-5 shrink-0 text-amber-dark" aria-hidden />
            <div>
              <p className="font-semibold text-amber-dark">Reported Medical History</p>
              <p className="mt-1">{conditions.join(", ")}</p>
            </div>
          </div>
        )}

        <dl className="mt-6 grid gap-4 text-sm md:grid-cols-2">
          {/* Reservation Type & Treatment Section */}
          <div className="md:col-span-2 rounded-2xl border border-teal/20 bg-teal-light/20 p-4">
            <dt className="text-xs font-semibold text-teal-deep flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-teal" />
              Treatment / Reason for Visit
            </dt>
            <dd className="mt-2 flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="text-base font-bold text-teal-deep">
                  {appointment.treatment.nameAr}
                </span>
                <span className="mx-2 text-muted">•</span>
                <span className="text-xs font-mono text-muted">
                  Session duration: {appointment.treatment.durationMinutes} mins
                </span>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  {appointment.treatment.summaryAr}
                </p>
              </div>
              <AppointmentTreatmentEditor
                appointmentId={appointment.id}
                currentTreatmentId={appointment.treatmentId}
                currentTeeth={appointment.teeth}
                treatments={treatments}
              />
            </dd>
          </div>

          <div>
            <dt className="text-muted">Date & Time</dt>
            <dd className="mt-0.5 font-medium">{formatCairoDateTime(appointment.startsAt)}</dd>
          </div>
          <div>
            <dt className="text-muted">Phone Number</dt>
            <dd className="mt-0.5 font-medium" dir="ltr">
              <a href={`tel:${appointment.patient.phone}`} className="hover:underline">
                {appointment.patient.phone}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-muted">WhatsApp</dt>
            <dd className="mt-0.5 font-medium" dir="ltr">
              {appointment.patient.whatsapp ? (
                <a
                  href={`https://wa.me/2${appointment.patient.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  {appointment.patient.whatsapp}
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Teeth Involved</dt>
            <dd className="mt-0.5 font-medium">
              {appointment.teeth.length ? formatTeeth(appointment.teeth) : "Not specified (or doesn't require tooth selection)"}
            </dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-muted">Patient Notes</dt>
            <dd className="mt-0.5 whitespace-pre-line">{appointment.patientNotes || "—"}</dd>
          </div>
          {appointment.adminNotes && (
            <div className="md:col-span-2">
              <dt className="text-muted">Internal Admin Notes</dt>
              <dd className="mt-0.5 whitespace-pre-line">{appointment.adminNotes}</dd>
            </div>
          )}
        </dl>

        <div className="mt-8 border-t border-line pt-6">
          <AppointmentActions id={appointment.id} treatmentId={appointment.treatmentId} status={appointment.status} />
        </div>
        <Link className="mt-6 inline-block text-sm font-semibold text-teal-mid hover:underline" href={`/admin/patients/${appointment.patientId}`}>
          Patient Profile →
        </Link>
      </div>
    </div>
  );
}
