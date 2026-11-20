import Link from "next/link";
import { CalendarDays, Filter, Search, Sparkles, Stethoscope, X } from "lucide-react";
import type { AppointmentStatus, Prisma } from "@prisma/client";
import { requireAdminSession } from "@/lib/admin-auth";
import { formatCairoDateTime } from "@/lib/datetime";
import { decryptAppointmentWithPatient } from "@/lib/encryption";
import { statusLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { NewAppointmentModal } from "@/components/admin/NewAppointmentModal";

const STATUS_TONE: Record<AppointmentStatus, string> = {
  PENDING: "border-amber/40 bg-amber-light text-amber-dark",
  CONFIRMED: "border-teal/30 bg-teal-light text-teal-deep",
  COMPLETED: "border-line bg-ivory text-muted",
  REJECTED: "border-red-200 bg-red-50 text-red-800",
  CANCELLED: "border-red-200 bg-red-50 text-red-800",
};

const NUM = new Intl.NumberFormat("en-US");

type FilterKey = "upcoming" | "pending" | "confirmed" | "past" | "closed" | "all";

function filters(now: Date): Record<FilterKey, { label: string; where: Prisma.AppointmentWhereInput; order: "asc" | "desc" }> {
  return {
    upcoming: { label: "Upcoming", where: { startsAt: { gte: now }, status: { in: ["PENDING", "CONFIRMED"] } }, order: "asc" },
    pending: { label: "Pending Confirmation", where: { status: "PENDING" }, order: "asc" },
    confirmed: { label: "Confirmed", where: { status: "CONFIRMED", startsAt: { gte: now } }, order: "asc" },
    past: { label: "Past", where: { startsAt: { lt: now } }, order: "desc" },
    closed: { label: "Cancelled & Declined", where: { status: { in: ["CANCELLED", "REJECTED"] } }, order: "desc" },
    all: { label: "All", where: {}, order: "desc" },
  };
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; treatment?: string; q?: string }>;
}) {
  await requireAdminSession();
  const { filter, treatment, q } = await searchParams;
  const now = new Date();
  const all = filters(now);
  const key: FilterKey = filter && filter in all ? (filter as FilterKey) : "upcoming";
  const current = all[key];
  const query = q?.trim() ?? "";

  // 1. Fetch treatments for filtering and creating bookings
  const treatments = await prisma.treatment.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      slug: true,
      nameAr: true,
      summaryAr: true,
      durationMinutes: true,
      requiresTeeth: true,
    },
  });

  const selectedTreatment = treatments.find((t) => t.slug === treatment || t.id === treatment);

  // 2. Build where query
  const baseWhere: Prisma.AppointmentWhereInput = {
    ...current.where,
    ...(selectedTreatment ? { treatmentId: selectedTreatment.id } : {}),
  };

  const [rawAppointments, counts, totalForSelectedTreatment] = await Promise.all([
    prisma.appointment.findMany({
      where: baseWhere,
      include: { patient: true, treatment: true },
      orderBy: { startsAt: current.order },
      take: 300,
    }),
    Promise.all(
      (Object.keys(all) as FilterKey[]).map((k) =>
        prisma.appointment.count({
          where: {
            ...all[k].where,
            ...(selectedTreatment ? { treatmentId: selectedTreatment.id } : {}),
          },
        })
      )
    ),
    selectedTreatment
      ? prisma.appointment.count({ where: { treatmentId: selectedTreatment.id } })
      : null,
  ]);

  // 3. Decrypt and filter in memory by query if present
  const allDecrypted = rawAppointments.map(decryptAppointmentWithPatient);

  const appointments = query
    ? allDecrypted.filter((item) => {
        const qLower = query.toLowerCase();
        return (
          item.patient.fullName.toLowerCase().includes(qLower) ||
          item.patient.phone.includes(query) ||
          item.reference.toLowerCase().includes(qLower) ||
          item.treatment.nameAr.toLowerCase().includes(qLower)
        );
      })
    : allDecrypted;

  // 4. Calculate breakdown by treatment in current list
  const treatmentCounts = new Map<string, number>();
  for (const appt of allDecrypted) {
    const tName = appt.treatment.nameAr;
    treatmentCounts.set(tName, (treatmentCounts.get(tName) ?? 0) + 1);
  }

  return (
    <div className="grid gap-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-teal-deep">Appointments & Bookings</h1>
          <p className="mt-1 text-sm text-muted">
            Manage patient appointments, filter by treatment (reason for visit), and create direct bookings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NewAppointmentModal treatments={treatments} />
          <Link href="/admin/calendar" className="btn-secondary px-4 py-2 text-sm">
            <CalendarDays className="size-4" aria-hidden />
            View Calendar
          </Link>
        </div>
      </div>

      {/* Search & Reservation Type (Treatment) Filter Bar */}
      <div className="card-soft rounded-[1.75rem] p-4 sm:p-5 grid gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Input */}
          <form method="GET" action="/admin/appointments" className="relative flex-1 max-w-md">
            {filter && <input type="hidden" name="filter" value={filter} />}
            {treatment && <input type="hidden" name="treatment" value={treatment} />}
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted pointer-events-none" />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search by patient name, phone, or reference..."
              className="input pl-9 pr-8 text-sm"
            />
            {query && (
              <Link
                href={`/admin/appointments?filter=${key}${treatment ? `&treatment=${treatment}` : ""}`}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-ink"
                title="Clear search"
              >
                <X className="size-3.5" />
              </Link>
            )}
          </form>

          {/* Quick link to manage treatments */}
          <Link
            href="/admin/treatments"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-mid hover:underline self-end sm:self-center"
          >
            <Stethoscope className="size-3.5" />
            Manage Treatments & Reasons for Visit →
          </Link>
        </div>

        {/* Filter by Reservation Type (Treatment) Pills */}
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs font-bold text-teal-deep">
            <Filter className="size-3.5 text-teal" />
            Filter by Treatment (Reason for Visit):
            {selectedTreatment && (
              <span className="font-normal text-muted">
                (Selected: {selectedTreatment.nameAr} - {totalForSelectedTreatment} total appointments)
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs">
            <Link
              href={`/admin/appointments?filter=${key}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
              className={`rounded-full border px-3 py-1.5 transition-colors ${
                !treatment
                  ? "border-teal-deep bg-teal-deep text-white font-semibold"
                  : "border-line bg-white hover:border-teal/40 text-neutral-700"
              }`}
            >
              All Treatments
            </Link>
            {treatments.map((t) => {
              const active = t.slug === treatment || t.id === treatment;
              return (
                <Link
                  key={t.id}
                  href={`/admin/appointments?filter=${key}&treatment=${t.slug}${
                    query ? `&q=${encodeURIComponent(query)}` : ""
                  }`}
                  className={`rounded-full border px-3 py-1.5 transition-colors ${
                    active
                      ? "border-teal-deep bg-teal-deep text-white font-semibold"
                      : "border-line bg-white hover:border-teal/40 text-neutral-700"
                  }`}
                >
                  {t.nameAr}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Status Tabs Navigation */}
      <nav aria-label="Filter appointments by status" className="flex flex-wrap gap-2 text-sm">
        {(Object.keys(all) as FilterKey[]).map((k, i) => {
          const active = k === key;
          const href = `/admin/appointments?filter=${k}${
            treatment ? `&treatment=${treatment}` : ""
          }${query ? `&q=${encodeURIComponent(query)}` : ""}`;
          return (
            <Link
              key={k}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`rounded-full border px-4 py-2 transition-colors ${
                active
                  ? "border-teal-deep bg-teal-deep text-white font-semibold"
                  : "border-line bg-white hover:border-teal/40 text-neutral-700"
              }`}
            >
              {all[k].label} <span className="opacity-70">({NUM.format(counts[i])})</span>
            </Link>
          );
        })}
      </nav>

      {/* Treatment Breakdown in current results */}
      {treatmentCounts.size > 1 && !selectedTreatment && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted font-medium">Treatments in this list:</span>
          {Array.from(treatmentCounts.entries()).map(([name, c]) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 rounded-full border border-teal/20 bg-teal-light/40 px-2.5 py-0.5 font-medium text-teal-deep"
            >
              <span>{name}</span>
              <span className="font-mono font-bold">({c})</span>
            </span>
          ))}
        </div>
      )}

      {/* Appointments List / Table */}
      {appointments.length === 0 ? (
        <div className="card-soft rounded-3xl p-10 text-center text-sm text-muted">
          <p className="font-semibold text-ink text-base">No matching appointments found.</p>
          <p className="mt-1">
            {selectedTreatment
              ? `No appointments found for treatment "${selectedTreatment.nameAr}" in this view.`
              : "No appointments recorded matching these criteria."}
          </p>
          {(treatment || query) && (
            <Link
              href={`/admin/appointments?filter=${key}`}
              className="btn-secondary mt-4 inline-block text-xs"
            >
              Reset Filters
            </Link>
          )}
        </div>
      ) : (
        <div className="card-soft overflow-x-auto rounded-3xl">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-ivory text-xs text-muted">
              <tr>
                <th className="p-3 font-medium">Date & Time</th>
                <th className="p-3 font-medium">Patient</th>
                <th className="p-3 font-medium">Treatment</th>
                <th className="p-3 font-medium">Teeth</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Reference</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-line transition-colors hover:bg-teal-light/25"
                >
                  <td className="p-3 whitespace-nowrap">
                    <Link
                      className="font-medium text-teal-deep hover:underline"
                      href={`/admin/appointments/${item.id}`}
                    >
                      {formatCairoDateTime(item.startsAt)}
                    </Link>
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/admin/patients/${item.patientId}`}
                      className="block font-medium hover:underline text-ink"
                    >
                      {item.patient.fullName}
                    </Link>
                    <span className="block font-mono text-xs text-muted" dir="ltr">
                      {item.patient.phone}
                    </span>
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/admin/appointments?filter=${key}&treatment=${item.treatment.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal-light/60 px-3 py-1 text-xs font-semibold text-teal-deep hover:bg-teal-light transition-colors"
                      title="Filter by this treatment"
                    >
                      <Sparkles className="size-3 text-teal" aria-hidden />
                      {item.treatment.nameAr}
                    </Link>
                  </td>
                  <td className="p-3 font-mono text-xs">
                    {item.teeth.length ? (
                      <span className="font-semibold text-teal-deep" dir="ltr">
                        {item.teeth.join(", ")}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`chip ${STATUS_TONE[item.status]}`}>
                      {statusLabel[item.status]}
                    </span>
                    {item.medicalConditions.length > 0 && (
                      <span className="mt-1 block text-[11px] text-amber-dark">
                        Medical history reported
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <Link
                      className="font-mono text-xs text-teal-mid hover:underline"
                      href={`/admin/appointments/${item.id}`}
                      dir="ltr"
                    >
                      {item.reference}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
