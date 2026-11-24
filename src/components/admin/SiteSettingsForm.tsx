"use client";

import { saveSiteSettings } from "@/app/actions/admin";
import { ActionFeedback, useAdminAction } from "@/components/admin/useAdminAction";
import { SocialIcon } from "@/components/site/SocialIcon";
import type { SocialKey } from "@/lib/site-settings";

export type SiteSettingsValues = Record<
  "phone" | "whatsapp" | "email" | "address" | "mapsUrl" | SocialKey,
  string
>;

type Section = "contact" | "social";

const CONTACT_FIELDS: { name: keyof SiteSettingsValues; label: string; placeholder: string; dir?: "ltr"; type?: string }[] = [
  { name: "phone", label: "هاتف العيادة", placeholder: "01XXXXXXXXX", dir: "ltr", type: "tel" },
  { name: "whatsapp", label: "رقم واتساب", placeholder: "01XXXXXXXXX", dir: "ltr", type: "tel" },
  { name: "email", label: "البريد الإلكتروني", placeholder: "contact@example.com", dir: "ltr", type: "email" },
  { name: "mapsUrl", label: "رابط خرائط Google", placeholder: "https://maps.app.goo.gl/…", dir: "ltr" },
];

const SOCIAL_FIELDS: { name: SocialKey; label: string; placeholder: string }[] = [
  { name: "instagram", label: "إنستغرام", placeholder: "https://instagram.com/…" },
  { name: "facebook", label: "فيسبوك", placeholder: "https://facebook.com/…" },
  { name: "tiktok", label: "تيك توك", placeholder: "https://tiktok.com/@…" },
  { name: "youtube", label: "يوتيوب", placeholder: "https://youtube.com/@…" },
  { name: "x", label: "إكس (تويتر)", placeholder: "https://x.com/…" },
  { name: "snapchat", label: "سناب شات", placeholder: "https://snapchat.com/add/…" },
];

export function SiteSettingsForm({
  values,
  sectionsToShow,
}: {
  values: SiteSettingsValues;
  sectionsToShow?: Section[];
}) {
  const { pending, result, run } = useAdminAction();
  const show = (s: Section) => !sectionsToShow || sectionsToShow.includes(s);

  return (
    <form
      className="grid gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        run(() => saveSiteSettings(Object.fromEntries(form.entries())));
      }}
    >
      {show("contact") && (
        <section className="card-soft rounded-3xl p-5 sm:p-6">
          <h2 className="heading-md">بيانات التواصل</h2>
          <p className="mt-1 text-sm text-muted">تظهر في تذييل الموقع وصفحة التواصل وأزرار واتساب. اترك الحقل فارغاً لاستخدام القيمة الافتراضية.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {CONTACT_FIELDS.map((field) => (
              <label key={field.name} className="text-sm">
                <span className="field-label">{field.label}</span>
                <input
                  name={field.name}
                  type={field.type ?? "text"}
                  dir={field.dir}
                  defaultValue={values[field.name]}
                  placeholder={field.placeholder}
                  className={`field ${field.dir ? "text-left" : ""}`}
                />
              </label>
            ))}
            <label className="text-sm sm:col-span-2">
              <span className="field-label">العنوان</span>
              <input name="address" defaultValue={values.address} maxLength={200} className="field" />
            </label>
          </div>
        </section>
      )}

      {show("social") && (
        <section className="card-soft rounded-3xl p-5 sm:p-6">
          <h2 className="heading-md">حسابات التواصل الاجتماعي</h2>
          <p className="mt-1 text-sm text-muted">الصق رابط الحساب كاملاً. الحسابات الفارغة لا تظهر في الموقع.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {SOCIAL_FIELDS.map((field) => (
              <label key={field.name} className="text-sm">
                <span className="field-label flex items-center gap-2">
                  <SocialIcon network={field.name} className="size-4 text-teal-deep" />
                  {field.label}
                </span>
                <input
                  name={field.name}
                  dir="ltr"
                  inputMode="url"
                  defaultValue={values[field.name]}
                  placeholder={field.placeholder}
                  className="field text-left"
                />
              </label>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "جارٍ الحفظ…" : "حفظ التغييرات"}
        </button>
        <ActionFeedback result={result} />
      </div>
    </form>
  );
}
