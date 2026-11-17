export const TIMEZONE = "Africa/Cairo";

export const site = {
  name: "Dentivilla",
  nameAr: "دنتيفيلا",
  doctor: {
    name: "د. محمد ياسر الجبالي",
    shortName: "محمد ياسر الجبالي",
    title: "اختصاصي تجميل وزراعة الأسنان",
    subtitle: "Dentivilla — تجميل وجراحة الأسنان",
    focus: "طب الأسنان التجميلي المجهري، زراعة الأسنان الموجهة، وتصميم الابتسامة",
    experienceYears: "+١٤",
    smilesCount: "+٣٨٠٠",
    rating: "٤٫٩",
  },
  city: "القاهرة",
  address: "Medical Center 3 (مديكال سنتر ٣)، مدينة نصر، القاهرة، مصر",
  addressShort: "مديكال سنتر ٣، مدينة نصر",
  addressNote: "Medical Center 3 (مديكال سنتر ٣)، شارع مكرم عبيد، مدينة نصر، القاهرة",
  phone: "01132081093",
  phoneDisplay: "01132081093",
  whatsapp: "201132081093",
  whatsappUrl: "https://wa.me/201132081093",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("Medical Center 3, Makram Ebeid, Nasr City, Cairo"),
  email: "contact@dentivilla.com",
} as const;

export const weekdayLabels = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
] as const;
