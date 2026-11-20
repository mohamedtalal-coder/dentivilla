export const TIMEZONE = "Africa/Cairo";

export const site = {
  name: "Dentivilla",
  nameAr: "Dentivilla",
  doctor: {
    name: "Dr. Mohamed Yasser El Gebaly",
    shortName: "Dr. Mohamed El Gebaly",
    title: "General Dentist | Aesthetic & Restorative Dentistry",
    subtitle: "Dentivilla — Aesthetic & Restorative Dentistry",
    focus: "Aesthetic & Restorative Dentistry",
    bio: "Experienced in veneers, crowns, bridges, root canal treatments, dental implants, orthodontics, oral surgery, and comprehensive dental care. Combining a comprehensive approach to dentistry with precision, attention to detail, and personalized treatment planning to deliver long-lasting results and naturally beautiful smiles.",
  },
  city: "Cairo",
  address: "Medical Center 3, Makram Ebeid, Nasr City, Cairo, Egypt",
  addressShort: "Medical Center 3, Nasr City",
  addressNote: "Medical Center 3, Makram Ebeid Street, Nasr City, Cairo",
  phone: "01132081093",
  phoneDisplay: "01132081093",
  whatsapp: "201132081093",
  whatsappUrl: "https://wa.me/201132081093",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent("Medical Center 3, Makram Ebeid, Nasr City, Cairo"),
  email: "contact@dentivilla.com",
} as const;

export const weekdayLabels = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
