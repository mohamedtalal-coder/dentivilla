"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
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
            إدارة علاجات وخدمات العيادة
          </h2>
          <p className="mt-1 text-sm text-muted">
            تحكم في العلاجات التي تظهر في الصفحة الرئيسية وصفحة «العلاجات» ونموذج حجز المواعيد، ورتبها حسب الأولوية.
          </p>
        </div>
        {!addingNew && !editing && (
          <button
            type="button"
            onClick={() => setAddingNew(true)}
            className="btn-primary self-start text-sm shadow-sm"
          >
            <Plus className="size-4" aria-hidden />
            إضافة علاج جديد
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
          {result.ok ? result.message ?? "تمت العملية بنجاح" : result.error}
        </div>
      )}

      {/* Form: Add or Edit Treatment */}
      {(addingNew || editing) && (
        <div className="card-soft rounded-[2rem] border-2 border-teal/20 p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between border-b border-line pb-4">
            <h3 className="heading-sm text-teal-deep">
              {editing ? `تعديل علاج: ${editing.nameAr}` : "إضافة علاج جديد"}
            </h3>
            <button
              type="button"
              onClick={() => {
                setAddingNew(false);
                setEditing(null);
              }}
              className="rounded-full p-2 text-muted hover:bg-neutral-100 hover:text-ink"
              aria-label="إغلاق"
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
                durationMinutes: 45, // default internal slot duration
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
                  اسم العلاج بالعربية <span className="text-red-500">*</span>
                </label>
                <input
                  id="nameAr"
                  name="nameAr"
                  type="text"
                  required
                  defaultValue={editing?.nameAr ?? ""}
                  placeholder="مثال: ابتسامة هوليوود (Veneers)"
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="slug" className="field-label">
                  المعرف بالإنجليزية (Slug) <span className="text-red-500">*</span>
                </label>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  required
                  defaultValue={editing?.slug ?? ""}
                  placeholder="مثال: veneers أو teeth-whitening"
                  dir="ltr"
                  pattern="^[a-z0-9-]+$"
                  className="input font-mono text-sm"
                />
                <span className="mt-1 block text-xs text-muted">
                  يُستخدم في روابط الصفحات (أحرف إنجليزية صغيرة وشرطات فقط)
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="summaryAr" className="field-label">
                نبذة مختصرة (تظهر في الكروت والقوائم) <span className="text-red-500">*</span>
              </label>
              <textarea
                id="summaryAr"
                name="summaryAr"
                rows={2}
                required
                defaultValue={editing?.summaryAr ?? ""}
                placeholder="سطر أو سطرين يعبران عن جوهر العلاج وفائدته للمريض..."
                className="input leading-relaxed"
              />
            </div>

            <div>
              <label htmlFor="descriptionAr" className="field-label">
                شرح تفصيلي للإجراء (يظهر في صفحة العلاج المستقلة) <span className="text-red-500">*</span>
              </label>
              <textarea
                id="descriptionAr"
                name="descriptionAr"
                rows={5}
                required
                defaultValue={editing?.descriptionAr ?? ""}
                placeholder="شرح خطوات العلاج، لمن يناسب، وكيف يتم في العيادة..."
                className="input leading-relaxed"
              />
            </div>

            <div className="rounded-2xl border border-line bg-ivory/50 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  name="requiresTeeth"
                  defaultChecked={editing ? editing.requiresTeeth : true}
                  className="mt-1 size-4 rounded border-line text-teal focus:ring-teal"
                />
                <div>
                  <span className="block font-semibold text-teal-deep">
                    يتطلب تحديد الأسنان على نموذج الفك ثلاثي الأبعاد
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    إذا كان مفعّلاً، سيطلب نظام الحجز من المريض اختيار السن المصاب. (مثال: مفعل لعلاج العصب والترميم، وغير مفعل للكشف العام أو التبييض).
                  </span>
                </div>
              </label>
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
                إلغاء
              </button>
              <button
                type="submit"
                disabled={pending}
                className="btn-primary text-sm shadow-sm"
              >
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    جارٍ الحفظ...
                  </>
                ) : (
                  <>
                    <Check className="size-4" aria-hidden />
                    {editing ? "حفظ التعديلات" : "إضافة العلاج"}
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
            <p className="mt-4 text-base font-semibold">لا توجد علاجات مضافة حتى الآن</p>
            <p className="mt-1 text-sm">أضف علاجات لعيادتك لتظهر في الموقع ونظام الحجز.</p>
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
                      {treatment.requiresTeeth ? "تحديد سن (FDI)" : "عام (بدون سن)"}
                    </span>
                    {appointmentCount > 0 && (
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-muted">
                        {appointmentCount} موعد مرتبط
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
                      title="تحريك لأعلى"
                      aria-label="تحريك لأعلى"
                      className="grid size-8 place-items-center rounded-lg text-neutral-600 transition-colors hover:bg-white hover:text-teal-deep disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ArrowUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      disabled={isLast || pending}
                      onClick={() => run(() => moveTreatment(treatment.id, "down"))}
                      title="تحريك لأسفل"
                      aria-label="تحريك لأسفل"
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
                    تعديل
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (appointmentCount > 0) {
                        alert(`لا يمكن حذف هذا العلاج لوجود ${appointmentCount} موعد مرتبط به في السجلات.`);
                        return;
                      }
                      if (confirm(`هل أنت متأكد من حذف علاج «${treatment.nameAr}»؟`)) {
                        run(() => deleteTreatment(treatment.id));
                      }
                    }}
                    title="حذف العلاج"
                    aria-label="حذف العلاج"
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
