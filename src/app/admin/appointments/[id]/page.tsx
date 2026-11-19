import Link from "next/link";
import { notFound } from "next/navigation";
import { HeartPulse } from "lucide-react";
import { AppointmentActions } from "@/components/admin/AppointmentActions";
import { requireAdminSession } from "@/lib/admin-auth";
import { formatCairoDateTime } from "@/lib/datetime";
import { statusLabel } from "@/lib/labels";
import { MEDICAL_CONDITION_LABEL } from "@/lib/medical-conditions";
import { prisma } from "@/lib/prisma";
import { formatTeeth } from "@/lib/teeth";

export default async function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  const { id } = await params;
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { patient: true, treatment: true },
  });
  if (!appointment) notFound();

  const conditions = appointment.medicalConditions.map((c) => MEDICAL_CONDITION_LABEL[c] ?? c);

  return (
    <div className="grid gap-6">
      <Link href="/admin/appointments" className="text-sm text-teal-mid hover:underline">
        → كل المواعيد
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
              <p className="font-semibold text-amber-dark">التاريخ المرضي المُبلغ عنه</p>
              <p className="mt-1">{conditions.join("، ")}</p>
            </div>
          </div>
        )}

        <dl className="mt-6 grid gap-4 text-sm md:grid-cols-2">
          <div>
            <dt className="text-muted">العلاج</dt>
            <dd className="mt-0.5 font-medium">
              {appointment.treatment.nameAr} ({appointment.treatment.durationMinutes} دقيقة)
            </dd>
          </div>
          <div>
            <dt className="text-muted">الموعد</dt>
            <dd className="mt-0.5 font-medium">{formatCairoDateTime(appointment.startsAt)}</dd>
          </div>
          <div>
            <dt className="text-muted">الهاتف</dt>
            <dd className="mt-0.5 font-medium" dir="ltr">
              <a href={`tel:${appointment.patient.phone}`} className="hover:underline">
                {appointment.patient.phone}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-muted">واتساب</dt>
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
          <div className="md:col-span-2">
            <dt className="text-muted">الأسنان</dt>
            <dd className="mt-0.5 font-medium">{appointment.teeth.length ? formatTeeth(appointment.teeth) : "غير محدد"}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-muted">ملاحظات المريض</dt>
            <dd className="mt-0.5 whitespace-pre-line">{appointment.patientNotes || "—"}</dd>
          </div>
          {appointment.adminNotes && (
            <div className="md:col-span-2">
              <dt className="text-muted">ملاحظات داخلية</dt>
              <dd className="mt-0.5 whitespace-pre-line">{appointment.adminNotes}</dd>
            </div>
          )}
        </dl>

        <div className="mt-8 border-t border-line pt-6">
          <AppointmentActions id={appointment.id} treatmentId={appointment.treatmentId} status={appointment.status} />
        </div>
        <Link className="mt-6 inline-block text-sm font-semibold text-teal-mid hover:underline" href={`/admin/patients/${appointment.patientId}`}>
          ملف المريض ←
        </Link>
      </div>
    </div>
  );
}
