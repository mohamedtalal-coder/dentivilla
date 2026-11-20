export const MEDICAL_CONDITIONS = [
  { id: "diabetes", ar: "Diabetes", label: "Diabetes" },
  { id: "hypertension", ar: "High Blood Pressure (Hypertension)", label: "High Blood Pressure" },
  { id: "heart", ar: "Heart Disease or Artificial Valve", label: "Heart Disease or Artificial Valve" },
  { id: "anticoagulants", ar: "Blood Thinners / Anticoagulants", label: "Blood Thinners / Anticoagulants" },
  { id: "bleeding", ar: "Bleeding Disorders", label: "Bleeding Disorders" },
  { id: "asthma", ar: "Asthma or Respiratory Conditions", label: "Asthma / Respiratory Conditions" },
  { id: "kidney", ar: "Kidney Disease", label: "Kidney Disease" },
  { id: "liver", ar: "Liver Disease", label: "Liver Disease" },
  { id: "thyroid", ar: "Thyroid Disorders", label: "Thyroid Disorders" },
  { id: "epilepsy", ar: "Epilepsy or Seizure Disorders", label: "Epilepsy / Seizures" },
  { id: "osteoporosis", ar: "Osteoporosis or Bone Medications", label: "Osteoporosis / Bone Medications" },
  { id: "cancer", ar: "Current or Past Cancer Treatment / Radiation", label: "Cancer / Radiation Therapy" },
  { id: "immunosuppression", ar: "Immunosuppression or Immune-Suppressive Drugs", label: "Immunosuppression" },
  { id: "infectious", ar: "Viral Hepatitis or Chronic Infections", label: "Hepatitis or Chronic Infection" },
  { id: "pregnancy", ar: "Pregnancy or Breastfeeding", label: "Pregnancy or Breastfeeding" },
  { id: "allergies", ar: "Allergies to Medications, Anesthetics, or Latex", label: "Medication / Anesthesia / Latex Allergies" },
] as const;

export type MedicalConditionId = (typeof MEDICAL_CONDITIONS)[number]["id"];

export const MEDICAL_CONDITION_IDS = MEDICAL_CONDITIONS.map((c) => c.id) as [
  MedicalConditionId,
  ...MedicalConditionId[],
];

export const MEDICAL_CONDITION_LABEL: Record<string, string> = Object.fromEntries(
  MEDICAL_CONDITIONS.map((c) => [c.id, c.ar]),
);
