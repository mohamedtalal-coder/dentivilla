export type ToothArch = "upper" | "lower";
export type ToothSide = "right" | "left";
export type ToothType = "incisor" | "canine" | "premolar" | "molar";

export type Tooth = {
  fdi: string;
  nameAr: string; // kept as nameAr for compatibility with Prisma schema & components
  nameEn: string;
  type: ToothType;
  arch: ToothArch;
  side: ToothSide;
  roleAr: string;
};

const names: Record<string, { en: string }> = {
  "11": { en: "Upper Right Central Incisor" },
  "12": { en: "Upper Right Lateral Incisor" },
  "13": { en: "Upper Right Canine" },
  "14": { en: "Upper Right First Premolar" },
  "15": { en: "Upper Right Second Premolar" },
  "16": { en: "Upper Right First Molar" },
  "17": { en: "Upper Right Second Molar" },
  "18": { en: "Upper Right Third Molar (Wisdom Tooth)" },
  "21": { en: "Upper Left Central Incisor" },
  "22": { en: "Upper Left Lateral Incisor" },
  "23": { en: "Upper Left Canine" },
  "24": { en: "Upper Left First Premolar" },
  "25": { en: "Upper Left Second Premolar" },
  "26": { en: "Upper Left First Molar" },
  "27": { en: "Upper Left Second Molar" },
  "28": { en: "Upper Left Third Molar (Wisdom Tooth)" },
  "31": { en: "Lower Left Central Incisor" },
  "32": { en: "Lower Left Lateral Incisor" },
  "33": { en: "Lower Left Canine" },
  "34": { en: "Lower Left First Premolar" },
  "35": { en: "Lower Left Second Premolar" },
  "36": { en: "Lower Left First Molar" },
  "37": { en: "Lower Left Second Molar" },
  "38": { en: "Lower Left Third Molar (Wisdom Tooth)" },
  "41": { en: "Lower Right Central Incisor" },
  "42": { en: "Lower Right Lateral Incisor" },
  "43": { en: "Lower Right Canine" },
  "44": { en: "Lower Right First Premolar" },
  "45": { en: "Lower Right Second Premolar" },
  "46": { en: "Lower Right First Molar" },
  "47": { en: "Lower Right Second Molar" },
  "48": { en: "Lower Right Third Molar (Wisdom Tooth)" },
};

const roles: Record<ToothType, string> = {
  incisor: "Cuts food and defines the frontal smile aesthetics and lip support.",
  canine: "Tears food, guides mandibular movements, and supports mouth corners.",
  premolar: "Initial crushing of food and maintains balanced occlusal contact.",
  molar: "Primary chewing and grinding function, maintaining vertical bite height.",
};

function typeFor(fdi: string): ToothType {
  const n = Number(fdi[1]);
  if (n <= 2) return "incisor";
  if (n === 3) return "canine";
  if (n <= 5) return "premolar";
  return "molar";
}

function archFor(fdi: string): ToothArch {
  return fdi[0] === "1" || fdi[0] === "2" ? "upper" : "lower";
}

function sideFor(fdi: string): ToothSide {
  return fdi[0] === "1" || fdi[0] === "4" ? "right" : "left";
}

export const ALL_TEETH: Tooth[] = Object.keys(names)
  .sort((a, b) => Number(a) - Number(b))
  .map((fdi) => {
    const type = typeFor(fdi);
    const en = names[fdi].en;
    return {
      fdi,
      nameAr: en, // Set nameAr to English so all existing call sites get the English name seamlessly
      nameEn: en,
      type,
      arch: archFor(fdi),
      side: sideFor(fdi),
      roleAr: roles[type],
    };
  });

export const TEETH_BY_FDI = Object.fromEntries(
  ALL_TEETH.map((tooth) => [tooth.fdi, tooth]),
);

export const UPPER_RIGHT = ["18", "17", "16", "15", "14", "13", "12", "11"];
export const UPPER_LEFT = ["21", "22", "23", "24", "25", "26", "27", "28"];
export const LOWER_LEFT = ["31", "32", "33", "34", "35", "36", "37", "38"];
export const LOWER_RIGHT = ["48", "47", "46", "45", "44", "43", "42", "41"];

export function formatTeeth(codes: string[]) {
  return codes
    .map((code) => {
      const tooth = TEETH_BY_FDI[code];
      return tooth ? `${code} — ${tooth.nameAr}` : code;
    })
    .join(", ");
}
