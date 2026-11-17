export const MEDICAL_CONDITIONS = [
  { id: "diabetes", ar: "السكري" },
  { id: "hypertension", ar: "ارتفاع ضغط الدم" },
  { id: "heart", ar: "أمراض القلب أو صمام صناعي" },
  { id: "anticoagulants", ar: "أدوية السيولة أو مضادات التجلط" },
  { id: "bleeding", ar: "اضطرابات النزيف" },
  { id: "asthma", ar: "الربو أو أمراض التنفس" },
  { id: "kidney", ar: "أمراض الكلى" },
  { id: "liver", ar: "أمراض الكبد" },
  { id: "thyroid", ar: "اضطرابات الغدة الدرقية" },
  { id: "epilepsy", ar: "الصرع أو التشنجات" },
  { id: "osteoporosis", ar: "هشاشة العظام أو أدويتها" },
  { id: "cancer", ar: "علاج أورام أو إشعاع حالي أو سابق" },
  { id: "immunosuppression", ar: "ضعف المناعة أو أدوية مثبطة لها" },
  { id: "infectious", ar: "التهاب كبدي فيروسي أو عدوى مزمنة" },
  { id: "pregnancy", ar: "حمل أو رضاعة" },
  { id: "allergies", ar: "حساسية من أدوية أو بنج أو لاتكس" },
] as const;

export type MedicalConditionId = (typeof MEDICAL_CONDITIONS)[number]["id"];

export const MEDICAL_CONDITION_IDS = MEDICAL_CONDITIONS.map((c) => c.id) as [
  MedicalConditionId,
  ...MedicalConditionId[],
];

export const MEDICAL_CONDITION_LABEL: Record<string, string> = Object.fromEntries(
  MEDICAL_CONDITIONS.map((c) => [c.id, c.ar]),
);
