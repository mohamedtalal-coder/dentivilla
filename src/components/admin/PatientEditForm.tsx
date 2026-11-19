"use client";

import { useState } from "react";
import { UserCheck } from "lucide-react";
import { updatePatient } from "@/app/actions/admin";
import { ActionFeedback, useAdminAction } from "@/components/admin/useAdminAction";

type Props = {
  patient: {
    id: string;
    fullName: string;
    phone: string;
  };
};

export function PatientEditForm({ patient }: Props) {
  const [fullName, setFullName] = useState(patient.fullName);
  const [phone, setPhone] = useState(patient.phone);
  const { pending, result, run, clear } = useAdminAction();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    run(() => updatePatient(patient.id, { fullName, phone }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="patient-name" className="field-label">
            اسم المريض الكامل
          </label>
          <input
            id="patient-name"
            type="text"
            required
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              clear();
            }}
            placeholder="مثال: أحمد محمود"
            className="field"
          />
        </div>

        <div>
          <label htmlFor="patient-phone" className="field-label">
            رقم الهاتف
          </label>
          <input
            id="patient-phone"
            type="tel"
            dir="ltr"
            required
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              clear();
            }}
            placeholder="01012345678"
            className="field text-right font-mono"
          />
          <p className="mt-1 text-xs text-muted">رقم موبايل مصري مكون من 11 رقماً (01xxxxxxxxx).</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line/60 pt-4">
        <button type="submit" className="btn-primary" disabled={pending}>
          <UserCheck className="size-4" aria-hidden />
          <span>{pending ? "جارٍ الحفظ…" : "حفظ بيانات المريض"}</span>
        </button>
        <ActionFeedback result={result} />
      </div>
    </form>
  );
}
