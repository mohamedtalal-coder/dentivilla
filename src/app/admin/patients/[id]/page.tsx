import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  Clock,
  Lock,
  Phone,
  Shield,
  User,
} from "lucide-react";
import type { AppointmentStatus } from "@prisma/client";
import { PatientEditForm } from "@/components/admin/PatientEditForm";
import { NewAppointmentModal } from "@/components/admin/NewAppointmentModal";
import { requireAdminSession } from "@/lib/admin-auth";
import { formatCairoDateTime } from "@/lib/datetime";
import { decryptAppointment, decryptPatient } from "@/lib/encryption";
import { statusLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { formatTeeth } from "@/lib/teeth";

const STATUS_TONE: Record<AppointmentStatus, string> = {
  PENDING: "border-amber/40 bg-amber-light text-amber-dark",
  CONFIRMED: "border-teal/30 bg-teal-light text-teal-deep",
  COMPLETED: "border-line bg-ivory text-muted",
  REJECTED: "border-red-200 bg-red-50 text-red-800",
  CANCELLED: "border-red-200 bg-red-50 text-red-800",
};

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 1. Restrict access strictly to authorized admin sessions
  await requireAdminSession();

  const { id } = await params;
  const [rawPatient, treatments] = await Promise.all([
    prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: {
          include: { treatment: true },
          orderBy: { startsAt: "desc" },
        },
      },
    }),
    prisma.treatment.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        slug: true,
        nameAr: true,
        summaryAr: true,
        durationMinutes: true,
        requiresTeeth: true,
      },
    }),
  ]);
  if (!rawPatient) notFound();

  const patient = {
    ...decryptPatient(rawPatient),
    appointments: rawPatient.appointments.map(decryptAppointment),
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-sm text-muted">
          <Link
            href="/admin/patients"
            className="inline-flex items-center gap-1.5 font-medium text-teal-mid hover:text-teal-deep"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to Patients
          </Link>
          <span>/</span>
          <span className="font-semibold text-ink">{patient.fullName}</span>
        </nav>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal-light px-3 py-1 text-xs font-semibold text-teal-deep">
          <Lock className="size-3" aria-hidden />
          Encrypted & Protected
        </span>
      </div>

      {/* Privacy Notice Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-teal/20 bg-teal-light/50 p-4 text-sm text-teal-deep">
        <Shield className="mt-0.5 size-5 shrink-0 text-teal" aria-hidden />
        <div>
          <p className="font-bold">Patient Data Privacy & Security</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            Under our strict privacy protocol, stored patient records are strictly limited to name, mobile number,
            and linked clinical appointments. All identifiable records are encrypted at rest with AES-256-GCM.
          </p>
        </div>
      </div>

      {/* Patient Information & Edit Section */}
      <section className="card-soft rounded-[28px] p-6 sm:p-8" aria-labelledby="patient-info-title">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line/60 pb-5">
          <div>
            <span className="eyebrow">Patient Details</span>
            <h1 id="patient-info-title" className="text-2xl font-bold text-teal-deep">
              {patient.fullName}
            </h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted">
              <Phone className="size-4" aria-hidden />
              <span dir="ltr" className="font-mono font-medium">
                {patient.phone}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <User className="size-4" aria-hidden />
            <span>Registered: {formatCairoDateTime(patient.createdAt)}</span>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="mb-4 text-base font-bold text-teal-deep">Edit Patient Information</h2>
          <PatientEditForm patient={{ id: patient.id, fullName: patient.fullName, phone: patient.phone }} />
        </div>
      </section>

      {/* Associated Appointments Section */}
      <section className="card-soft rounded-[28px] p-6 sm:p-8" aria-labelledby="appointments-list-title">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-4">
          <div className="flex items-center gap-2">
            <CalendarCheck className="size-5 text-teal" aria-hidden />
            <h2 id="appointments-list-title" className="text-xl font-bold text-teal-deep">
              Associated Appointments
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <NewAppointmentModal treatments={treatments} />
            <span className="rounded-full bg-ivory px-3 py-1 text-xs font-semibold text-teal-deep">
              Total Appointments: {patient.appointments.length}
            </span>
          </div>
        </div>

        {patient.appointments.length > 0 ? (
          <ul className="mt-6 divide-y divide-line/60">
            {patient.appointments.map((item) => (
              <li key={item.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Link
                        href={`/admin/appointments/${item.id}`}
                        className="font-mono text-base font-bold text-teal-deep hover:text-teal hover:underline"
                      >
                        {item.reference}
                      </Link>
                      <span className={`chip text-xs ${STATUS_TONE[item.status]}`}>
                        {statusLabel[item.status]}
                      </span>
                    </div>

                    <p className="text-base font-semibold text-ink">
                      {item.treatment.nameAr}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3.5" aria-hidden />
                        {formatCairoDateTime(item.startsAt)}
                      </span>
                      {item.teeth.length > 0 && (
                        <span>Teeth: {formatTeeth(item.teeth)}</span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Link
                      href={`/admin/appointments/${item.id}`}
                      className="btn-secondary px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <span>View Appointment</span>
                      <ArrowRight className="size-3.5" aria-hidden />
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-12 text-center text-muted">
            <CalendarCheck className="mx-auto size-10 text-neutral-300" aria-hidden />
            <p className="mt-3 font-medium">No appointments currently recorded for this patient.</p>
          </div>
        )}
      </section>
    </div>
  );
}
