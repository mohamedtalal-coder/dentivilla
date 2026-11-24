"use client";

import { saveSiteCopy } from "@/app/actions/admin";
import { ActionFeedback, useAdminAction } from "@/components/admin/useAdminAction";
import { SITE_COPY_DEFAULTS, SITE_COPY_GROUPS, type SiteCopyKey } from "@/lib/site-copy";

export function SiteCopyForm({ values }: { values: Record<SiteCopyKey, string> }) {
  const { pending, result, run } = useAdminAction();

  return (
    <form
      className="grid gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        run(() => saveSiteCopy(Object.fromEntries(new FormData(event.currentTarget).entries())));
      }}
    >
      <p className="text-sm text-muted">
        اترك الحقل فارغاً لاستخدام النص الافتراضي للموقع. تظهر هذه النصوص في الصفحات العامة (عناوين، أوصاف، وسيرة الطبيب).
      </p>
      {SITE_COPY_GROUPS.map((group) => (
        <section key={group.id} className="card-soft rounded-3xl p-5 sm:p-6">
          <h2 className="heading-md">{group.label}</h2>
          <div className="mt-5 grid gap-4">
            {group.fields.map((field) => (
              <label key={field.key} className="text-sm">
                <span className="field-label">{field.label}</span>
                {field.rows ? (
                  <textarea
                    name={field.key}
                    rows={field.rows}
                    maxLength={2000}
                    defaultValue={values[field.key]}
                    placeholder={SITE_COPY_DEFAULTS[field.key]}
                    className="field resize-y"
                  />
                ) : (
                  <input
                    name={field.key}
                    maxLength={200}
                    defaultValue={values[field.key]}
                    placeholder={SITE_COPY_DEFAULTS[field.key]}
                    className="field"
                  />
                )}
              </label>
            ))}
          </div>
        </section>
      ))}
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "جارٍ الحفظ…" : "حفظ النصوص"}
        </button>
        <ActionFeedback result={result} />
      </div>
    </form>
  );
}
