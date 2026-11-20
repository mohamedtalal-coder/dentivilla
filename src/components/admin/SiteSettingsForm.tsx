"use client";

import { saveSiteSettings } from "@/app/actions/admin";
import { ActionFeedback, useAdminAction } from "@/components/admin/useAdminAction";
import { SocialIcon } from "@/components/site/SocialIcon";
import type { SocialKey } from "@/lib/site-settings";

export type SiteSettingsValues = Record<
  "phone" | "whatsapp" | "email" | "address" | "mapsUrl" | SocialKey,
  string
>;

const CONTACT_FIELDS: { name: keyof SiteSettingsValues; label: string; placeholder: string; dir?: "ltr"; type?: string }[] = [
  { name: "phone", label: "Clinic Phone", placeholder: "01XXXXXXXXX", dir: "ltr", type: "tel" },
  { name: "whatsapp", label: "WhatsApp Number", placeholder: "01XXXXXXXXX", dir: "ltr", type: "tel" },
  { name: "email", label: "Email Address", placeholder: "contact@example.com", dir: "ltr", type: "email" },
  { name: "mapsUrl", label: "Google Maps URL", placeholder: "https://maps.app.goo.gl/…", dir: "ltr" },
];

const SOCIAL_FIELDS: { name: SocialKey; label: string; placeholder: string }[] = [
  { name: "instagram", label: "Instagram", placeholder: "https://instagram.com/…" },
  { name: "facebook", label: "Facebook", placeholder: "https://facebook.com/…" },
  { name: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@…" },
  { name: "youtube", label: "YouTube", placeholder: "https://youtube.com/@…" },
  { name: "x", label: "X (Twitter)", placeholder: "https://x.com/…" },
  { name: "snapchat", label: "Snapchat", placeholder: "https://snapchat.com/add/…" },
];

export function SiteSettingsForm({ values }: { values: SiteSettingsValues }) {
  const { pending, result, run } = useAdminAction();

  return (
    <form
      className="grid gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        run(() => saveSiteSettings(Object.fromEntries(form.entries())));
      }}
    >
      <section className="card-soft rounded-3xl p-5 sm:p-6">
        <h2 className="heading-md">Contact Information</h2>
        <p className="mt-1 text-sm text-muted">Appears in the website footer, contact page, and WhatsApp buttons. Leave blank to use defaults.</p>
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
            <span className="field-label">Clinic Address</span>
            <input name="address" defaultValue={values.address} maxLength={200} className="field" />
          </label>
        </div>
      </section>

      <section className="card-soft rounded-3xl p-5 sm:p-6">
        <h2 className="heading-md">Social Media Profiles</h2>
        <p className="mt-1 text-sm text-muted">Paste complete URLs. Blank fields will not be displayed on the website.</p>
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

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save Changes"}
        </button>
        <ActionFeedback result={result} />
      </div>
    </form>
  );
}
