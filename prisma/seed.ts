import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { fromZonedTime } from "date-fns-tz";

const prisma = new PrismaClient();
const TIMEZONE = "Africa/Cairo";

const treatments = [
  {
    slug: "veneers",
    nameAr: "الوجوه التجميلية",
    summaryAr: "قشور رقيقة تُصمَّم لإعادة تناسق اللون والشكل على الأسنان الظاهرة.",
    descriptionAr:
      "تُستخدم الوجوه التجميلية لتحسين شكل الأسنان الظاهرة في الابتسامة. تبدأ الخطة بفحص وتخطيط رقمي للابتسامة، ثم تجهيز مدروس للسطح وتجربة الشكل قبل التثبيت النهائي. المحتوى هنا تعريفي، والخطة الفعلية تُحدد بعد الكشف.",
    durationMinutes: 60,
    requiresTeeth: true,
    sortOrder: 1,
  },
  {
    slug: "smile-makeover",
    nameAr: "تصميم الابتسامة",
    summaryAr: "خطة متكاملة تجمع أكثر من إجراء للوصول إلى ابتسامة متوازنة مع ملامح الوجه.",
    descriptionAr:
      "تصميم الابتسامة ليس إجراءً واحداً، بل مسار يضم تقييماً للون والإطباق واللثة ونسب الوجه. قد يشمل تبييضاً أو وجوهاً أو ترميمات حسب الحالة. نبدأ دائماً بجلسة استشارة وتوثيق قبل أي خطوة علاجية.",
    durationMinutes: 45,
    requiresTeeth: false,
    sortOrder: 2,
  },
  {
    slug: "implants",
    nameAr: "زراعة الأسنان",
    summaryAr: "تعويض السن المفقود بغرسة تدعم تاجاً ثابتاً بعد التخطيط الشعاعي.",
    descriptionAr:
      "زراعة الأسنان خيار لتعويض الفقد مع الحفاظ على الأسنان المجاورة. يتطلب الأمر تقييماً للعظم واللثة وصحة عامة مناسبة. تُعرض الخطة بعد الفحص، وقد تشمل مرحلة التئام قبل التركيب النهائي.",
    durationMinutes: 60,
    requiresTeeth: true,
    sortOrder: 3,
  },
  {
    slug: "orthodontics",
    nameAr: "تقويم الأسنان",
    summaryAr: "تصحيح اصطفاف الأسنان والإطباق بمسار زمني يُحدد بعد الدراسة.",
    descriptionAr:
      "يهدف التقويم إلى تحسين الاصطفاف والوظيفة وليس المظهر فقط. بعد الفحص والصور تُناقش الخيارات المتاحة للحالة. المدة والأجهزة تختلف من شخص لآخر ولا تُحدد عبر الموقع.",
    durationMinutes: 45,
    requiresTeeth: false,
    sortOrder: 4,
  },
  {
    slug: "root-canal",
    nameAr: "علاج العصب",
    summaryAr: "معالجة لب السن الملتهب أو المصاب للحفاظ على السن متى كان ذلك ممكناً.",
    descriptionAr:
      "علاج العصب يُجرى عند التهاب اللب أو موت الأنسجة داخل السن. يشمل تنظيف القنوات وحشوها ثم ترميم السن لحماية ما تبقى من البنية. الحاجة للإجراء تُؤكد بالفحص والأشعة.",
    durationMinutes: 60,
    requiresTeeth: true,
    sortOrder: 5,
  },
  {
    slug: "restorative",
    nameAr: "طب الأسنان الترميمي",
    summaryAr: "ترميم التسوس والكسور والحشوات بما يعيد الشكل والوظيفة بهدوء.",
    descriptionAr:
      "الترميم يغطي الحشوات والتيجان والعلاج المحافظ للأنسجة المتضررة. الهدف الإبقاء على أكبر قدر ممكن من السن الطبيعي مع إطباق مريح. تُختار المادة والخطة حسب حجم الضرر.",
    durationMinutes: 45,
    requiresTeeth: true,
    sortOrder: 6,
  },
  {
    slug: "whitening",
    nameAr: "تبييض الأسنان بالليزر",
    summaryAr: "تفتيح وتبييض آمن ومتقدم بجلسة واحدة باستخدام الليزر البارد لحماية المينا.",
    descriptionAr:
      "تبييض الأسنان بالليزر في جلسة واحدة بأحدث أجهزة الليزر البارد الآمن لحماية عاج الأسنان واللثة في عيادة Dentivilla، مع تحقيق نتائج فورية طبيعية ومستدامة.",
    durationMinutes: 45,
    requiresTeeth: false,
    sortOrder: 7,
  },
  {
    slug: "consultation",
    nameAr: "كشف واستشارة شاملة",
    summaryAr: "فحص إكلينيكي وتشخيص مجهري وتصوير لتحديد خطة علاجية مخصصة.",
    descriptionAr:
      "جلسة تشخيصية متأنية تبدأ بالاستماع لك وتحديد التطلعات، تليها الفحوصات والأشعة ثلاثية الأبعاد لبناء خطة علاجية واضحة ومسبقة.",
    durationMinutes: 30,
    requiresTeeth: false,
    sortOrder: 8,
  },
];

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@dentivilla.local";
  const password = process.env.ADMIN_PASSWORD ?? "change-me-admin";
  const name = process.env.ADMIN_NAME ?? "د. محمد ياسر الجبالي";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash },
    create: { email, name, passwordHash, role: "ADMIN" },
  });

  for (const treatment of treatments) {
    await prisma.treatment.upsert({
      where: { slug: treatment.slug },
      update: treatment,
      create: treatment,
    });
  }

  await prisma.availabilitySettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      slotMinutes: 15,
      bufferMinutes: 15,
      bookingLeadHours: 4,
      bookingHorizonDays: 30,
    },
  });

  const hours = [
    { weekday: 0, enabled: true, startTime: "10:00", endTime: "18:00" },
    { weekday: 1, enabled: true, startTime: "10:00", endTime: "18:00" },
    { weekday: 2, enabled: true, startTime: "10:00", endTime: "18:00" },
    { weekday: 3, enabled: true, startTime: "10:00", endTime: "18:00" },
    { weekday: 4, enabled: true, startTime: "10:00", endTime: "18:00" },
    { weekday: 5, enabled: false, startTime: "10:00", endTime: "18:00" },
    { weekday: 6, enabled: true, startTime: "10:00", endTime: "18:00" },
  ];

  for (const item of hours) {
    await prisma.workingHours.upsert({
      where: { weekday: item.weekday },
      update: item,
      create: item,
    });
  }

  const existingPatients = await prisma.patient.count();
  if (existingPatients === 0) {
    const patient = await prisma.patient.create({
      data: {
        fullName: "مريض تجريبي",
        phone: "01011112222",
        whatsapp: "01011112222",
        notes: "سجل تجريبي لاختبار لوحة الإدارة فقط.",
      },
    });
    const treatment = await prisma.treatment.findUniqueOrThrow({
      where: { slug: "veneers" },
    });
    const startCairo = fromZonedTime(
      `${cairoYmdPlus(2)}T11:00:00`,
      TIMEZONE,
    );
    await prisma.appointment.create({
      data: {
        reference: "DV-100001",
        patientId: patient.id,
        treatmentId: treatment.id,
        teeth: ["11", "21"],
        startsAt: startCairo,
        endsAt: new Date(startCairo.getTime() + treatment.durationMinutes * 60 * 1000),
        status: "PENDING",
        patientNotes: "طلب تجريبي للمراجعة.",
      },
    });
  }

  console.log("Seed complete");
  console.log(`Admin: ${email}`);
}

function cairoYmdPlus(days: number) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(new Date());
  const [y, m, d] = today.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
