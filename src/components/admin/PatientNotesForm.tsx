"use client";

import { useState } from "react";
import { savePatientNotes } from "@/app/actions/admin";
import { ActionFeedback, useAdminAction } from "@/components/admin/useAdminAction";

export function PatientNotesForm({ id, notes }: { id: string; notes: string }) {
  const [value, setValue] = useState(notes);
  const { pending, result, run, clear } = useAdminAction();

  return (
    <form
      className="mt-5 grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        run(() => savePatientNotes(id, value));
      }}
    >
      <label htmlFor="patient-notes" className="field-label">
        ملاحظات العيادة (داخلية)
      </label>
      <textarea
        id="patient-notes"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          clear();
        }}
        rows={4}
        maxLength={2000}
        className="field"
      />
      <div className="flex items-center gap-4">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "جارٍ الحفظ…" : "حفظ الملاحظات"}
        </button>
        <ActionFeedback result={result} />
      </div>
    </form>
  );
}
