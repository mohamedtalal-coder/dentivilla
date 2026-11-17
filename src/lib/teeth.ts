export type ToothArch = "upper" | "lower";
export type ToothSide = "right" | "left";
export type ToothType = "incisor" | "canine" | "premolar" | "molar";

export type Tooth = {
  fdi: string;
  nameAr: string;
  type: ToothType;
  arch: ToothArch;
  side: ToothSide;
  roleAr: string;
};

const names: Record<string, string> = {
  "11": "القاطع المركزي العلوي الأيمن",
  "12": "القاطع الجانبي العلوي الأيمن",
  "13": "الناب العلوي الأيمن",
  "14": "الضاحك الأول العلوي الأيمن",
  "15": "الضاحك الثاني العلوي الأيمن",
  "16": "الرحى الأولى العلوية اليمنى",
  "17": "الرحى الثانية العلوية اليمنى",
  "18": "الرحى الثالثة العلوية اليمنى",
  "21": "القاطع المركزي العلوي الأيسر",
  "22": "القاطع الجانبي العلوي الأيسر",
  "23": "الناب العلوي الأيسر",
  "24": "الضاحك الأول العلوي الأيسر",
  "25": "الضاحك الثاني العلوي الأيسر",
  "26": "الرحى الأولى العلوية اليسرى",
  "27": "الرحى الثانية العلوية اليسرى",
  "28": "الرحى الثالثة العلوية اليسرى",
  "31": "القاطع المركزي السفلي الأيسر",
  "32": "القاطع الجانبي السفلي الأيسر",
  "33": "الناب السفلي الأيسر",
  "34": "الضاحك الأول السفلي الأيسر",
  "35": "الضاحك الثاني السفلي الأيسر",
  "36": "الرحى الأولى السفلية اليسرى",
  "37": "الرحى الثانية السفلية اليسرى",
  "38": "الرحى الثالثة السفلية اليسرى",
  "41": "القاطع المركزي السفلي الأيمن",
  "42": "القاطع الجانبي السفلي الأيمن",
  "43": "الناب السفلي الأيمن",
  "44": "الضاحك الأول السفلي الأيمن",
  "45": "الضاحك الثاني السفلي الأيمن",
  "46": "الرحى الأولى السفلية اليمنى",
  "47": "الرحى الثانية السفلية اليمنى",
  "48": "الرحى الثالثة السفلية اليمنى",
};

const roles: Record<ToothType, string> = {
  incisor: "قطع الطعام وإظهار خط الابتسامة.",
  canine: "تمزيق الطعام ودعم زاوية الفم.",
  premolar: "طحن أولي ومساهمة في الإطباق.",
  molar: "المضغ الرئيسي ودعم ارتفاع العضة.",
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
    return {
      fdi,
      nameAr: names[fdi],
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
    .join("، ");
}
