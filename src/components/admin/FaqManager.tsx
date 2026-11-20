"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, HelpCircle, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { createFaq, deleteFaq, moveFaq, toggleFaqPublished, updateFaq } from "@/app/actions/admin";
import { ActionFeedback, useAdminAction } from "@/components/admin/useAdminAction";

export type AdminFaq = {
  id: string;
  question: string;
  answer: string;
  published: boolean;
  sortOrder: number;
};

type FormData = {
  question: string;
  answer: string;
  published: boolean;
};

const emptyForm: FormData = {
  question: "",
  answer: "",
  published: true,
};

export function FaqManager({ faqs }: { faqs: AdminFaq[] }) {
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

  function openEdit(faq: AdminFaq) {
    clear();
    setEditingId(faq.id);
    setForm({
      question: faq.question,
      answer: faq.answer,
      published: faq.published,
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
      question: form.question.trim(),
      answer: form.answer.trim(),
      published: form.published,
    };

    if (editingId) {
      run(() => updateFaq(editingId, payload), () => closeModal());
    } else {
      run(() => createFaq(payload), () => closeModal());
    }
  }

  function handleDelete(id: string, question: string) {
    if (!confirm(`هل أنت متأكد من حذف سؤال «${question}»؟`)) return;
    run(() => deleteFaq(id));
  }

  function handleToggle(id: string, current: boolean) {
    run(() => toggleFaqPublished(id, !current));
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted">
            الأسئلة المنشورة تظهر تلقائياً في قسم «أسئلة شائعة» في الصفحة الرئيسية.
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary">
          <Plus className="size-4" aria-hidden />
          إضافة سؤال جديد
        </button>
      </div>

      <ActionFeedback result={result} />

      {faqs.length === 0 ? (
        <div className="card-soft rounded-[28px] p-12 text-center">
          <HelpCircle className="mx-auto size-12 text-teal/40" />
          <h2 className="mt-4 text-xl font-bold text-teal-deep">لا توجد أسئلة حالياً</h2>
          <p className="mt-2 text-sm text-muted">أضف الأسئلة الشائعة لمساعدة المرضى في العثور على إجابات سريعة.</p>
          <button type="button" onClick={openCreate} className="btn-primary mx-auto mt-6">
            <Plus className="size-4" aria-hidden />
            إضافة أول سؤال
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {faqs.map((faq, index) => (
            <article
              key={faq.id}
              className={`card-soft flex flex-col justify-between gap-5 rounded-[24px] p-6 transition-colors sm:flex-row sm:items-start ${
                faq.published ? "border-teal/20 bg-white" : "border-line bg-neutral-50/70 opacity-75"
              }`}
            >
              <div className="grid gap-2 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      faq.published ? "bg-teal-light text-teal-deep" : "bg-neutral-200 text-neutral-600"
                    }`}
                  >
                    {faq.published ? (
                      <>
                        <Eye className="size-3 text-teal" /> منشور
                      </>
                    ) : (
                      <>
                        <EyeOff className="size-3" /> مخفي
                      </>
                    )}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-teal-deep">{faq.question}</h3>
                <p className="max-w-2xl text-sm leading-7 text-muted">{faq.answer}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-end sm:self-start shrink-0">
                <div className="flex items-center rounded-xl border border-line bg-white p-1">
                  <button
                    type="button"
                    disabled={pending || index === 0}
                    onClick={() => run(() => moveFaq(faq.id, "up"))}
                    title="تحريك لأعلى"
                    aria-label="تحريك لأعلى"
                    className="rounded-lg p-1.5 text-muted hover:bg-ivory hover:text-teal-deep disabled:opacity-30"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    disabled={pending || index === faqs.length - 1}
                    onClick={() => run(() => moveFaq(faq.id, "down"))}
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
                  onClick={() => handleToggle(faq.id, faq.published)}
                  title={faq.published ? "إخفاء السؤال" : "نشر السؤال"}
                  className={`btn-secondary p-2.5 text-xs ${faq.published ? "hover:border-amber hover:text-amber-dark" : "hover:border-teal hover:text-teal"}`}
                >
                  {faq.published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  <span className="hidden md:inline">{faq.published ? "إخفاء" : "نشر"}</span>
                </button>

                <button
                  type="button"
                  disabled={pending}
                  onClick={() => openEdit(faq)}
                  className="btn-secondary p-2.5 text-xs"
                  title="تعديل"
                >
                  <Pencil className="size-4" />
                  <span className="hidden md:inline">تعديل</span>
                </button>

                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleDelete(faq.id, faq.question)}
                  className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                  title="حذف السؤال"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </article>
          ))}
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
              {editingId ? "تعديل السؤال" : "إضافة سؤال جديد"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              أضف سؤالاً شائعاً وإجابته ليظهر في الصفحة الرئيسية.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
              <div>
                <label className="field-label" htmlFor="faq-question">
                  السؤال <span className="text-red-500">*</span>
                </label>
                <input
                  id="faq-question"
                  required
                  type="text"
                  placeholder="مثال: هل تحتاج الوجوه التجميلية إلى برد الأسنان؟"
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  className="field-input text-sm"
                />
              </div>

              <div>
                <label className="field-label" htmlFor="faq-answer">
                  الإجابة <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="faq-answer"
                  required
                  rows={5}
                  placeholder="اكتب الإجابة بشكل واضح ومباشر..."
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  className="field-input text-sm leading-7"
                />
              </div>

              <div className="mt-2 flex items-center gap-3">
                <input
                  id="faq-published"
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm({ ...form, published: e.target.checked })}
                  className="size-4 rounded border-line text-teal-deep focus:ring-teal"
                />
                <label htmlFor="faq-published" className="text-sm font-medium text-teal-deep cursor-pointer">
                  نشر السؤال فوراً وإظهاره في الصفحة الرئيسية
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
                  {editingId ? "حفظ التعديلات" : "إضافة السؤال"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
