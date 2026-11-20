"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, Loader2, Pencil, Star, Trash2, X } from "lucide-react";
import {
  createCase,
  deleteCase,
  moveCase,
  setCaseFeatured,
  setCasePublished,
  updateCase,
} from "@/app/actions/admin";
import { ActionFeedback, useAdminAction } from "@/components/admin/useAdminAction";
import { BeforeAfter } from "@/components/site/BeforeAfter";

export type AdminCase = {
  id: string;
  titleAr: string;
  descriptionAr: string | null;
  treatmentSlug: string | null;
  beforeMediaId: string;
  afterMediaId: string;
  consentOnFile: boolean;
  published: boolean;
  featured: boolean;
};

type TreatmentOption = { slug: string; nameAr: string };
type Uploaded = { id: string; url: string } | null;

const mediaUrl = (id: string) => `/media/${id}`;

function ImagePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Uploaded;
  onChange: (value: Uploaded) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setError("");
    if (file.size > 15 * 1024 * 1024) {
      setError("Image size exceeds 15 MB limit.");
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/admin/media", { method: "POST", body });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error ?? "Failed to upload image.");
      onChange({ id: payload.id, url: payload.url });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="field-label">{label}</span>
      <label
        className={`relative grid aspect-[4/3] cursor-pointer place-items-center overflow-hidden rounded-2xl border-2 border-dashed transition-colors ${
          value ? "border-transparent" : "border-line bg-ivory hover:border-teal/50"
        }`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) upload(file);
        }}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin preview of freshly uploaded media
          <img src={value.url} alt={label} className="absolute inset-0 size-full object-cover" />
        ) : (
          <span className="grid justify-items-center gap-2 p-4 text-center text-sm text-muted">
            <ImagePlus className="size-7 text-teal" aria-hidden />
            Click or drag image here
            <span className="text-xs">JPG / PNG / WebP / HEIC — up to 15 MB</span>
          </span>
        )}
        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-white/70">
            <Loader2 className="size-6 animate-spin text-teal" aria-label="Uploading" />
          </span>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = "";
          }}
        />
      </label>
      <div className="mt-1.5 flex min-h-5 items-center justify-between text-xs">
        {error ? <span role="alert" className="text-red-700">{error}</span> : <span className="text-muted">{value ? "Uploaded" : ""}</span>}
        {value && (
          <button type="button" onClick={() => onChange(null)} className="inline-flex items-center gap-1 text-muted hover:text-red-700">
            <X className="size-3.5" aria-hidden /> Remove
          </button>
        )}
      </div>
    </div>
  );
}

function CaseForm({
  treatments,
  initial,
  onDone,
}: {
  treatments: TreatmentOption[];
  initial?: AdminCase;
  onDone?: () => void;
}) {
  const [before, setBefore] = useState<Uploaded>(initial ? { id: initial.beforeMediaId, url: mediaUrl(initial.beforeMediaId) } : null);
  const [after, setAfter] = useState<Uploaded>(initial ? { id: initial.afterMediaId, url: mediaUrl(initial.afterMediaId) } : null);
  const [consent, setConsent] = useState(initial?.consentOnFile ?? false);
  const [published, setPublished] = useState(initial?.published ?? false);
  const { pending, result, run } = useAdminAction();
  const formKey = initial?.id ?? "new";

  return (
    <form
      key={formKey}
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        const formElement = event.currentTarget;
        const form = new FormData(formElement);
        const payload = {
          titleAr: String(form.get("titleAr") ?? ""),
          descriptionAr: String(form.get("descriptionAr") ?? ""),
          treatmentSlug: String(form.get("treatmentSlug") ?? ""),
          beforeMediaId: before?.id ?? "",
          afterMediaId: after?.id ?? "",
          consentOnFile: consent,
          published,
        };
        run(
          () => (initial ? updateCase(initial.id, payload) : createCase(payload)),
          () => {
            if (!initial) {
              formElement.reset();
              setBefore(null);
              setAfter(null);
              setConsent(false);
              setPublished(false);
            }
            onDone?.();
          },
        );
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <ImagePicker label="Before Photo" value={before} onChange={setBefore} />
        <ImagePicker label="After Photo" value={after} onChange={setAfter} />
      </div>
      {before && after && (
        <div>
          <span className="field-label">Interactive Preview</span>
          <div className="max-w-xl">
            <BeforeAfter beforeSrc={before.url} afterSrc={after.url} />
          </div>
          <p className="mt-2 text-xs text-muted">For optimal comparison: use two photos with consistent angle, illumination, and framing.</p>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="field-label">Case Title</span>
          <input name="titleAr" required minLength={3} maxLength={120} defaultValue={initial?.titleAr} className="field" placeholder="e.g. Anterior Cosmetic Ceramic Veneers" />
        </label>
        <label className="text-sm">
          <span className="field-label">Treatment Category</span>
          <select name="treatmentSlug" defaultValue={initial?.treatmentSlug ?? ""} className="field">
            <option value="">— Unspecified —</option>
            {treatments.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.nameAr}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="field-label">Brief Clinical Description (Optional)</span>
          <textarea name="descriptionAr" rows={2} maxLength={600} defaultValue={initial?.descriptionAr ?? ""} className="field" />
        </label>
      </div>
      <div className="grid gap-2 rounded-2xl bg-ivory p-4 text-sm">
        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-1 size-4 accent-teal" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>
            <span className="font-semibold">Patient written consent on file for publication</span>
            <span className="block text-xs text-muted">Required for publishing. Obscure identifiable facial features if not covered by consent.</span>
          </span>
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="size-4 accent-teal"
            checked={published}
            disabled={!consent}
            onChange={(e) => setPublished(e.target.checked)}
          />
          <span className={consent ? "" : "text-neutral-400"}>Publish case on website</span>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn-primary" disabled={pending || !before || !after}>
          {pending ? "Saving…" : initial ? "Save Changes" : "Add Case"}
        </button>
        {onDone && initial && (
          <button type="button" className="btn-secondary" onClick={onDone}>
            Cancel
          </button>
        )}
        <ActionFeedback result={result} />
      </div>
    </form>
  );
}

function CaseRow({
  item,
  index,
  total,
  treatments,
}: {
  item: AdminCase;
  index: number;
  total: number;
  treatments: TreatmentOption[];
}) {
  const [editing, setEditing] = useState(false);
  const action = useAdminAction();
  const treatmentName = treatments.find((t) => t.slug === item.treatmentSlug)?.nameAr;

  return (
    <li className="card-soft rounded-3xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex shrink-0 gap-1.5">
          {[item.beforeMediaId, item.afterMediaId].map((id, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- small admin thumbnails
            <img key={id} src={mediaUrl(id)} alt={i === 0 ? "Before" : "After"} className="h-16 w-20 rounded-lg object-cover ring-1 ring-black/5" />
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-teal-deep">{item.titleAr}</p>
          <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
            <span className={`chip ${item.published ? "border-teal/30 bg-teal-light text-teal-deep" : "border-line bg-ivory text-muted"}`}>
              {item.published ? "Published" : "Draft"}
            </span>
            {item.featured && <span className="chip border-amber/40 bg-amber-light text-amber-dark">Featured on Homepage</span>}
            {!item.consentOnFile && <span className="chip border-red-200 bg-red-50 text-red-800">No Consent on File</span>}
            {treatmentName && <span className="chip border-line text-muted">{treatmentName}</span>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <IconButton label="Move up" disabled={index === 0 || action.pending} onClick={() => action.run(() => moveCase(item.id, "up"))}>
            <ArrowUp className="size-4" />
          </IconButton>
          <IconButton label="Move down" disabled={index === total - 1 || action.pending} onClick={() => action.run(() => moveCase(item.id, "down"))}>
            <ArrowDown className="size-4" />
          </IconButton>
          <IconButton
            label={item.published ? "Hide from website" : "Publish"}
            disabled={action.pending}
            onClick={() => action.run(() => setCasePublished(item.id, !item.published))}
          >
            {item.published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </IconButton>
          <IconButton
            label="Feature on Homepage"
            disabled={!item.published || item.featured || action.pending}
            onClick={() => action.run(() => setCaseFeatured(item.id))}
          >
            <Star className={`size-4 ${item.featured ? "fill-amber text-amber" : ""}`} />
          </IconButton>
          <IconButton label="Edit" onClick={() => setEditing((v) => !v)}>
            <Pencil className="size-4" />
          </IconButton>
          <IconButton
            label="Delete"
            tone="danger"
            disabled={action.pending}
            onClick={() => {
              if (window.confirm(`Permanently delete "${item.titleAr}" and its photos?`)) action.run(() => deleteCase(item.id));
            }}
          >
            <Trash2 className="size-4" />
          </IconButton>
        </div>
      </div>
      {action.result && (
        <div className="mt-3">
          <ActionFeedback result={action.result} />
        </div>
      )}
      {editing && (
        <div className="mt-5 border-t border-line pt-5">
          <CaseForm treatments={treatments} initial={item} onDone={() => setEditing(false)} />
        </div>
      )}
    </li>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  tone,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "danger";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`grid size-9 place-items-center rounded-full transition-colors disabled:opacity-30 ${
        tone === "danger" ? "text-red-700 hover:bg-red-50" : "text-teal-deep hover:bg-teal-light"
      }`}
    >
      {children}
    </button>
  );
}

export function CaseManager({ cases, treatments }: { cases: AdminCase[]; treatments: TreatmentOption[] }) {
  return (
    <div className="grid gap-6">
      <section className="card-soft rounded-3xl p-5 sm:p-6">
        <h2 className="heading-md">Add Before & After Case</h2>
        <p className="mt-1 mb-5 text-sm text-muted">
          Images are automatically optimized and private metadata (such as GPS coordinates) is stripped prior to saving.
        </p>
        <CaseForm treatments={treatments} />
      </section>

      <section>
        <h2 className="heading-md mb-3">All Cases ({cases.length})</h2>
        {cases.length === 0 ? (
          <p className="card-soft rounded-3xl p-6 text-sm text-muted">
            No clinical cases added yet. Default examples are displayed on the public site until cases are published.
          </p>
        ) : (
          <ul className="grid gap-3">
            {cases.map((item, index) => (
              <CaseRow key={item.id} item={item} index={index} total={cases.length} treatments={treatments} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
