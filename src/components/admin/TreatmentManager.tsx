"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Clock,
  Edit2,
  FileText,
  Loader2,
  Plus,
  Stethoscope,
  Trash2,
  X,
} from "lucide-react";
import {
  createTreatment,
  deleteTreatment,
  moveTreatment,
  updateTreatment,
} from "@/app/actions/admin";
import { useAdminAction } from "@/components/admin/useAdminAction";

export type AdminTreatment = {
  id: string;
  slug: string;
  nameAr: string;
  summaryAr: string;
  descriptionAr: string;
  durationMinutes: number;
  requiresTeeth: boolean;
  sortOrder: number;
  _count?: {
    appointments: number;
  };
};

export function TreatmentManager({
  initialTreatments,
}: {
  initialTreatments: AdminTreatment[];
}) {
  const [editing, setEditing] = useState<AdminTreatment | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const { pending, result, run } = useAdminAction();

  return (
    <div className="grid gap-8">
      {/* Header section with Add Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="heading-md flex items-center gap-2 text-teal-deep">
            <Stethoscope className="size-6 text-teal" aria-hidden />
            Clinical Treatments & Reasons for Visit
          </h2>
          <p className="mt-1 text-sm text-muted">
            Manage options for "What is the reason for your visit?" in the booking flow (such as Cosmetic Veneers, Implants, Root Canal), appointment durations, and tooth charting requirements.
          </p>
        </div>
        {!addingNew && !editing && (
          <button
            type="button"
            onClick={() => setAddingNew(true)}
            className="btn-primary self-start text-sm shadow-sm"
          >
            <Plus className="size-4" aria-hidden />
            Add New Treatment
          </button>
        )}
      </div>

      {result && (
        <div
          role="alert"
          className={`rounded-2xl p-4 text-sm font-semibold transition-all ${
            result.ok ? "bg-teal-light text-teal-deep" : "bg-red-50 text-red-700"
          }`}
        >
          {result.ok ? result.message ?? "Operation completed successfully" : result.error}
        </div>
      )}

      {/* Form: Add or Edit Treatment */}
      {(addingNew || editing) && (
        <div className="card-soft rounded-[2rem] border-2 border-teal/20 p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between border-b border-line pb-4">
            <h3 className="heading-sm text-teal-deep">
              {editing ? `Edit Treatment: ${editing.nameAr}` : "Add New Treatment"}
            </h3>
            <button
              type="button"
              onClick={() => {
                setAddingNew(false);
                setEditing(null);
              }}
              className="rounded-full p-2 text-muted hover:bg-neutral-100 hover:text-ink"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const payload = {
                nameAr: String(fd.get("nameAr") ?? ""),
                slug: String(fd.get("slug") ?? ""),
                summaryAr: String(fd.get("summaryAr") ?? ""),
                descriptionAr: String(fd.get("descriptionAr") ?? ""),
                requiresTeeth: fd.get("requiresTeeth") === "on",
                durationMinutes: Number(fd.get("durationMinutes") || 45),
              };

              if (editing) {
                run(async () => {
                  const res = await updateTreatment(editing.id, payload);
                  if (res.ok) setEditing(null);
                  return res;
                });
              } else {
                run(async () => {
                  const res = await createTreatment(payload);
                  if (res.ok) setAddingNew(false);
                  return res;
                });
              }
            }}
            className="grid gap-5"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="nameAr" className="field-label">
                  Treatment Name / Reason for Visit <span className="text-red-500">*</span>
                </label>
                <input
                  id="nameAr"
                  name="nameAr"
                  type="text"
                  required
                  defaultValue={editing?.nameAr ?? ""}
                  placeholder="e.g. Porcelain Veneers"
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="slug" className="field-label">
                  URL Identifier (Slug) <span className="text-red-500">*</span>
                </label>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  required
                  defaultValue={editing?.slug ?? ""}
                  placeholder="e.g. veneers or teeth-whitening"
                  dir="ltr"
                  pattern="^[a-z0-9-]+$"
                  className="input font-mono text-sm"
                />
                <span className="mt-1 block text-xs text-muted">
                  Used in page URLs and booking filters (lowercase letters, numbers, hyphens only)
                </span>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="durationMinutes" className="field-label">
                  Appointment Duration (Minutes) <span className="text-red-500">*</span>
                </label>
                <input
                  id="durationMinutes"
                  name="durationMinutes"
                  type="number"
                  min={15}
                  max={180}
                  step={15}
                  required
                  defaultValue={editing?.durationMinutes ?? 45}
                  placeholder="45"
                  className="input font-mono"
                />
                <span className="mt-1 block text-xs text-muted">
                  Determines slot length reserved in calendar for this visit type (default: 45 mins).
                </span>
              </div>

              <div className="flex items-center">
                <div className="w-full rounded-2xl border border-line bg-ivory/50 p-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      name="requiresTeeth"
                      defaultChecked={editing ? editing.requiresTeeth : true}
                      className="mt-1 size-4 rounded border-line text-teal focus:ring-teal"
                    />
                    <div>
                      <span className="block font-semibold text-teal-deep">
                        Requires tooth selection on FDI dental chart
                      </span>
                      <span className="mt-0.5 block text-xs text-muted">
                        Enabled for focal procedures (veneers, root canal, implants), disabled for general consultation or whitening.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="summaryAr" className="field-label">
                Brief Summary (Shown on booking cards and catalogs) <span className="text-red-500">*</span>
              </label>
              <textarea
                id="summaryAr"
                name="summaryAr"
                rows={2}
                required
                defaultValue={editing?.summaryAr ?? ""}
                placeholder="A concise description explaining the visit purpose and clinical benefits..."
                className="input leading-relaxed"
              />
            </div>

            <div>
              <label htmlFor="descriptionAr" className="field-label">
                Detailed Clinical Description (Shown on treatment page) <span className="text-red-500">*</span>
              </label>
              <textarea
                id="descriptionAr"
                name="descriptionAr"
                rows={4}
                required
                defaultValue={editing?.descriptionAr ?? ""}
                placeholder="Detailed clinical procedure stages, suitability, and expectations..."
                className="input leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  setAddingNew(false);
                  setEditing(null);
                }}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="btn-primary text-sm shadow-sm"
              >
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="size-4" aria-hidden />
                    {editing ? "Save Changes" : "Add Treatment"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Treatments List */}
      <div className="grid gap-4">
        {initialTreatments.length === 0 ? (
          <div className="card-soft rounded-[2rem] p-12 text-center text-muted">
            <FileText className="mx-auto size-12 text-muted/40" />
            <p className="mt-4 text-base font-semibold">No treatments added yet</p>
            <p className="mt-1 text-sm">Add treatments to your clinic to display on the public website and booking system.</p>
          </div>
        ) : (
          initialTreatments.map((treatment, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === initialTreatments.length - 1;
            const appointmentCount = treatment._count?.appointments ?? 0;

            return (
              <div
                key={treatment.id}
                className="group flex flex-col justify-between gap-4 rounded-[1.75rem] border border-line bg-white p-5 shadow-sm transition-all hover:border-teal/30 hover:shadow-card sm:flex-row sm:items-center"
              >
                <div className="space-y-1.5 sm:max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-lg font-bold text-teal-deep">
                      {treatment.nameAr}
                    </h4>
                    <span className="rounded-md bg-ivory px-2 py-0.5 font-mono text-xs text-neutral-500" dir="ltr">
                      /{treatment.slug}
                    </span>
                    <span
                      className={`chip text-[11px] font-semibold ${
                        treatment.requiresTeeth
                          ? "border-teal/20 bg-teal-light text-teal-deep"
                          : "border-amber/20 bg-amber-light text-amber-dark"
                      }`}
                    >
                      {treatment.requiresTeeth ? "Tooth Charting (FDI)" : "General (No tooth)"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-line bg-ivory px-2.5 py-0.5 font-mono text-[11px] text-teal-deep">
                      <Clock className="size-3 text-teal" aria-hidden />
                      {treatment.durationMinutes} mins
                    </span>
                    {appointmentCount > 0 ? (
                      <Link
                        href={`/admin/appointments?treatment=${treatment.slug}`}
                        title="View bookings for this treatment"
                        className="rounded-full bg-teal-light px-2.5 py-0.5 text-[11px] font-semibold text-teal-deep hover:underline"
                      >
                        {appointmentCount} linked appointment(s) →
                      </Link>
                    ) : (
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-muted">
                        No bookings
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-2 text-sm leading-6 text-muted">
                    {treatment.summaryAr}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {/* Reorder Buttons */}
                  <div className="flex items-center rounded-xl border border-line bg-ivory/60 p-0.5">
                    <button
                      type="button"
                      disabled={isFirst || pending}
                      onClick={() => run(() => moveTreatment(treatment.id, "up"))}
                      title="Move up"
                      aria-label="Move up"
                      className="grid size-8 place-items-center rounded-lg text-neutral-600 transition-colors hover:bg-white hover:text-teal-deep disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ArrowUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      disabled={isLast || pending}
                      onClick={() => run(() => moveTreatment(treatment.id, "down"))}
                      title="Move down"
                      aria-label="Move down"
                      className="grid size-8 place-items-center rounded-lg text-neutral-600 transition-colors hover:bg-white hover:text-teal-deep disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ArrowDown className="size-4" />
                    </button>
                  </div>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(treatment);
                      setAddingNew(false);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-teal-deep shadow-sm transition-colors hover:bg-teal-light hover:text-teal-deep"
                  >
                    <Edit2 className="size-3.5" />
                    Edit
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (appointmentCount > 0) {
                        alert(`Cannot delete this treatment because ${appointmentCount} appointment(s) are associated with it in records.`);
                        return;
                      }
                      if (confirm(`Are you sure you want to delete treatment "${treatment.nameAr}"?`)) {
                        run(() => deleteTreatment(treatment.id));
                      }
                    }}
                    title="Delete Treatment"
                    aria-label="Delete Treatment"
                    className="grid size-9 place-items-center rounded-xl border border-transparent text-neutral-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
