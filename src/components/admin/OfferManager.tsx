"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle, Eye, EyeOff, Loader2, Pencil, Plus, Tag, Trash2, X } from "lucide-react";
import { createOffer, deleteOffer, moveOffer, toggleOfferActive, updateOffer } from "@/app/actions/admin";
import { ActionFeedback, useAdminAction } from "@/components/admin/useAdminAction";

export type AdminOffer = {
  id: string;
  badge: string;
  titleAr: string;
  descriptionAr: string;
  price: number;
  originalPrice: number | null;
  treatmentSlug: string | null;
  active: boolean;
  sortOrder: number;
};

type TreatmentOption = { slug: string; nameAr: string };

type FormData = {
  badge: string;
  titleAr: string;
  descriptionAr: string;
  price: string;
  originalPrice: string;
  treatmentSlug: string;
  active: boolean;
};

const emptyForm: FormData = {
  badge: "عرض خاص",
  titleAr: "",
  descriptionAr: "",
  price: "",
  originalPrice: "",
  treatmentSlug: "",
  active: true,
};

export function OfferManager({
  offers,
  treatments,
}: {
  offers: AdminOffer[];
  treatments: TreatmentOption[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const { pending, result, run, clear } = useAdminAction();

  function openCreate() {
    clear();
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(offer: AdminOffer) {
    clear();
    setEditingId(offer.id);
    setForm({
      badge: offer.badge,
      titleAr: offer.titleAr,
      descriptionAr: offer.descriptionAr,
      price: String(offer.price),
      originalPrice: offer.originalPrice ? String(offer.originalPrice) : "",
      treatmentSlug: offer.treatmentSlug ?? "",
      active: offer.active,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    clear();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      badge: form.badge.trim(),
      titleAr: form.titleAr.trim(),
      descriptionAr: form.descriptionAr.trim(),
      price: Number(form.price),
      originalPrice: form.originalPrice.trim() ? Number(form.originalPrice) : null,
      treatmentSlug: form.treatmentSlug.trim() || null,
      active: form.active,
    };

    if (editingId) {
      run(() => updateOffer(editingId, payload), () => closeModal());
    } else {
      run(() => createOffer(payload), () => closeModal());
    }
  }

  function handleDelete(id: string, title: string) {
    if (!confirm(`هل أنت متأكد من حذف عرض «${title}»؟`)) return;
    run(() => deleteOffer(id));
  }

  function handleToggle(id: string, current: boolean) {
    run(() => toggleOfferActive(id, !current));
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted">
            العروض المفعّلة تظهر تلقائياً في شريط العروض المتحرك (Carousel) في الصفحة الرئيسية.
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary">
          <Plus className="size-4" aria-hidden />
          إضافة عرض جديد
        </button>
      </div>

      <ActionFeedback result={result} />

      {offers.length === 0 ? (
        <div className="card-soft rounded-[28px] p-12 text-center">
          <Tag className="mx-auto size-12 text-teal/40" />
          <h2 className="mt-4 text-xl font-bold text-teal-deep">لا توجد عروض حالياً</h2>
          <p className="mt-2 text-sm text-muted">أضف عروض وخصومات العيادة لتظهر لزوار موقعك في الصفحة الرئيسية.</p>
          <button type="button" onClick={openCreate} className="btn-primary mx-auto mt-6">
            <Plus className="size-4" aria-hidden />
            إضافة أول عرض
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {offers.map((offer, index) => {
            const treatment = treatments.find((t) => t.slug === offer.treatmentSlug);
            return (
              <article
                key={offer.id}
                className={`card-soft flex flex-col justify-between gap-5 rounded-[24px] p-6 transition-colors sm:flex-row sm:items-center ${
                  offer.active ? "border-amber/30 bg-white" : "border-line bg-neutral-50/70 opacity-75"
                }`}
              >
                <div className="grid gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`chip text-xs font-semibold ${
                        offer.active ? "border-amber/40 bg-amber-light text-amber-dark" : "border-neutral-300 bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {offer.badge}
                    </span>
                    {treatment && (
                      <span className="chip border-teal/20 bg-teal-light text-xs font-medium text-teal-deep">
                        علاج: {treatment.nameAr}
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        offer.active ? "bg-teal-light text-teal-deep" : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {offer.active ? (
                        <>
                          <CheckCircle className="size-3 text-teal" /> مفعّل ويظهر في الموقع
                        </>
                      ) : (
                        <>
                          <EyeOff className="size-3" /> معطّل
                        </>
                      )}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-teal-deep">{offer.titleAr}</h3>
                  <p className="max-w-2xl text-sm leading-6 text-muted">{offer.descriptionAr}</p>

                  <div className="mt-1 flex items-baseline gap-3">
                    <p className="text-xl font-bold text-teal-deep">
                      {offer.price} <span className="text-xs font-normal">ج.م</span>
                    </p>
                    {offer.originalPrice && offer.originalPrice > offer.price && (
                      <p className="text-sm text-neutral-400 line-through">
                        {offer.originalPrice} ج.م
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                  <div className="flex items-center rounded-xl border border-line bg-white p-1">
                    <button
                      type="button"
                      disabled={pending || index === 0}
                      onClick={() => run(() => moveOffer(offer.id, "up"))}
                      title="تحريك لأعلى"
                      aria-label="تحريك لأعلى"
                      className="rounded-lg p-1.5 text-muted hover:bg-ivory hover:text-teal-deep disabled:opacity-30"
                    >
                      <ArrowUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      disabled={pending || index === offers.length - 1}
                      onClick={() => run(() => moveOffer(offer.id, "down"))}
                      title="تحريك لأسفل"
                      aria-label="تحريك لأسفل"
                      className="rounded-lg p-1.5 text-muted hover:bg-ivory hover:text-teal-deep disabled:opacity-30"
                    >
                      <ArrowDown className="size-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => handleToggle(offer.id, offer.active)}
                    title={offer.active ? "تعطيل العرض" : "تفعيل العرض"}
                    className={`btn-secondary p-2.5 text-xs ${offer.active ? "hover:border-amber hover:text-amber-dark" : "hover:border-teal hover:text-teal"}`}
                  >
                    {offer.active ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    <span className="hidden md:inline">{offer.active ? "تعطيل" : "تفعيل"}</span>
                  </button>

                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => openEdit(offer)}
                    className="btn-secondary p-2.5 text-xs"
                    title="تعديل"
                  >
                    <Pencil className="size-4" />
                    <span className="hidden md:inline">تعديل</span>
                  </button>

                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => handleDelete(offer.id, offer.titleAr)}
                    className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                    title="حذف العرض"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
        >
          <div className="card-soft relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[28px] bg-white p-6 shadow-lift sm:p-8">
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-5 left-5 rounded-full p-1.5 text-muted hover:bg-neutral-100 hover:text-ink"
              aria-label="إغلاق"
            >
              <X className="size-5" />
            </button>

            <h2 className="text-xl font-bold text-teal-deep">
              {editingId ? "تعديل العرض" : "إضافة عرض جديد"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              املأ تفاصيل العرض ليظهر بشكل جذاب في الصفحة الرئيسية.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
              <div>
                <label className="field-label" htmlFor="offer-badge">
                  وسام أو شارة العرض <span className="text-red-500">*</span>
                </label>
                <input
                  id="offer-badge"
                  required
                  type="text"
                  placeholder="مثال: عرض White Friday / خصم خاص / لفترة محدودة"
                  value={form.badge}
                  onChange={(e) => setForm({ ...form, badge: e.target.value })}
                  className="field-input text-sm"
                />
              </div>

              <div>
                <label className="field-label" htmlFor="offer-title">
                  عنوان العرض <span className="text-red-500">*</span>
                </label>
                <input
                  id="offer-title"
                  required
                  type="text"
                  placeholder="مثال: تبييض الأسنان بالليزر — جلسة واحدة"
                  value={form.titleAr}
                  onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
                  className="field-input text-sm"
                />
              </div>

              <div>
                <label className="field-label" htmlFor="offer-desc">
                  تفاصيل ووصف العرض <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="offer-desc"
                  required
                  rows={3}
                  placeholder="ما الذي يشمله العرض؟ مثال: يشمل فحص الأسنان، تسجيل درجة اللون، وتلميع المينا..."
                  value={form.descriptionAr}
                  onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
                  className="field-input text-sm leading-6"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label" htmlFor="offer-price">
                    سعر العرض (ج.م) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="offer-price"
                    required
                    type="number"
                    min="1"
                    placeholder="2000"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="field-input text-sm"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="offer-original-price">
                    السعر قبل الخصم (اختياري)
                  </label>
                  <input
                    id="offer-original-price"
                    type="number"
                    min="1"
                    placeholder="2800"
                    value={form.originalPrice}
                    onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                    className="field-input text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="field-label" htmlFor="offer-treatment">
                  العلاج المرتبط عند الحجز (اختياري)
                </label>
                <select
                  id="offer-treatment"
                  value={form.treatmentSlug}
                  onChange={(e) => setForm({ ...form, treatmentSlug: e.target.value })}
                  className="field-input text-sm"
                >
                  <option value="">بدون تحديد علاج معين (استشارة عامة)</option>
                  {treatments.map((t) => (
                    <option key={t.slug} value={t.slug}>
                      {t.nameAr}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-muted">
                  عند الضغط على «احجز العرض»، سيتم فتح حجز هذا العلاج تلقائياً للمريض.
                </p>
              </div>

              <div className="mt-2 flex items-center gap-3">
                <input
                  id="offer-active"
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="size-4 rounded border-line text-teal-deep focus:ring-teal"
                />
                <label htmlFor="offer-active" className="text-sm font-medium text-teal-deep cursor-pointer">
                  تفعيل العرض فوراً وإظهاره في الصفحة الرئيسية
                </label>
              </div>

              <ActionFeedback result={result} />

              <div className="mt-4 flex items-center justify-end gap-3 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={pending}
                  className="btn-secondary px-5 py-2.5 text-sm"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="btn-primary px-6 py-2.5 text-sm"
                >
                  {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                  {editingId ? "حفظ التعديلات" : "إضافة العرض"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
