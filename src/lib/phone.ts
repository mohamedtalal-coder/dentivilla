const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const EASTERN_ARABIC_INDIC = "۰۱۲۳۴۵۶۷۸۹";

/** Converts Arabic-Indic / Persian digits to ASCII digits. */
export function toLatinDigits(value: string) {
  return value.replace(/[٠-٩۰-۹]/g, (d) => {
    const i = ARABIC_INDIC.indexOf(d);
    return String(i >= 0 ? i : EASTERN_ARABIC_INDIC.indexOf(d));
  });
}

/**
 * Normalises an Egyptian mobile number to the local 11-digit form (01XXXXXXXXX).
 * Accepts spaces, dashes, Arabic digits, and +20 / 0020 / 20 prefixes.
 * Returns null when the result is not a valid Egyptian mobile number.
 */
export function normalizeEgyptianMobile(input: string): string | null {
  let digits = toLatinDigits(input).replace(/[\s\-().]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("0020")) digits = digits.slice(4);
  else if (digits.startsWith("20") && digits.length === 12) digits = digits.slice(2);
  if (/^1[0125]\d{8}$/.test(digits)) digits = `0${digits}`;
  return /^01[0125]\d{8}$/.test(digits) ? digits : null;
}
