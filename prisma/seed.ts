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

const DEFAULT_PASSWORD = "change-me-admin";
const isProduction = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@dentivilla.local").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? DEFAULT_PASSWORD;
  if (isProduction && (password === DEFAULT_PASSWORD || password.length < 8)) {
    throw new Error(
      "ADMIN_PASSWORD must be set to a real password (8+ characters, not the default) for production.",
    );
  }
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
      update: {},
      create: item,
    });
  }

  // Demo records are for local development only — never in a real clinic database.
  if (!isProduction && (await prisma.patient.count()) === 0) {
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

  if ((await prisma.offer.count()) === 0) {
    await prisma.offer.createMany({
      data: [
        {
          badge: "عرض White Friday",
          titleAr: "تبييض الأسنان بالليزر — جلسة واحدة",
          descriptionAr: "يشمل تسجيل درجة اللون قبل وبعد الجلسة، وتلميع الأسنان، وإرشادات العناية لحماية المينا.",
          price: 2000,
          originalPrice: 2800,
          treatmentSlug: "whitening",
          sortOrder: 1,
          active: true,
        },
        {
          badge: "باقة الابتسامة",
          titleAr: "كشف واستشارة شاملة مع تخطيط الابتسامة",
          descriptionAr: "فحص مجهري وتصوير رقمي للأسنان، مع مناقشة خيارات العلاج وخطة مكتوبة بالتكلفة قبل أي إجراء.",
          price: 500,
          originalPrice: 900,
          treatmentSlug: "consultation",
          sortOrder: 2,
          active: true,
        },
        {
          badge: "لفترة محدودة",
          titleAr: "تنظيف الأسنان وإزالة الجير بالموجات الصوتية",
          descriptionAr: "تنظيف عميق ولطيف بالموجات فوق الصوتية وتلميع للأسنان واستعادة انتعاش اللثة.",
          price: 800,
          originalPrice: 1200,
          treatmentSlug: "restorative",
          sortOrder: 3,
          active: true,
        },
      ],
    });
  }

  if ((await prisma.faq.count()) === 0) {
    await prisma.faq.createMany({
      data: [
        {
          question: "هل تحتاج الوجوه التجميلية إلى برد الأسنان؟",
          answer:
            "يعتمد ذلك على شكل أسنانك ولونها والنتيجة المطلوبة. في حالات كثيرة يكون التحضير محدوداً جداً، وأحياناً لا يلزم. نوضح لك المقدار المتوقع لكل سن قبل البدء، ونجرب الشكل داخل فمك بنموذج مؤقت.",
          sortOrder: 1,
          published: true,
        },
        {
          question: "هل زراعة الأسنان مؤلمة؟ وهل تناسب مرضى السكر والضغط؟",
          answer:
            "تُجرى الزراعة تحت تخدير موضعي، ومعظم المرضى يصفون ما بعدها بانزعاج يمكن التحكم فيه بالمسكنات المعتادة. مرضى السكر والضغط المنضبطين يمكنهم غالباً إجراء الزراعة بعد تقييم حالتهم الصحية — لذلك نطلب التاريخ المرضي عند الحجز.",
          sortOrder: 2,
          published: true,
        },
        {
          question: "هل يمكنني رؤية شكل ابتسامتي قبل العلاج؟",
          answer:
            "نعم. نصمم الابتسامة رقمياً، ثم نضع نموذجاً تجريبياً مؤقتاً على أسنانك لترى الشكل والحجم في المرآة قبل أي خطوة نهائية.",
          sortOrder: 3,
          published: true,
        },
        {
          question: "متى أعرف التكلفة؟",
          answer:
            "بعد الكشف تحصل على خطة مكتوبة تشمل الخيارات المتاحة وتكلفة كل منها والمدة المتوقعة، ولا يبدأ أي إجراء قبل موافقتك.",
          sortOrder: 4,
          published: true,
        },
        {
          question: "هل الحجز عبر الموقع نهائي؟",
          answer:
            "يُحجز الوقت الذي اخترته لك فوراً ولا يظهر لغيرك، ثم تؤكده العيادة. يمكنك متابعة حالة الطلب في أي وقت بالرقم المرجعي ورقم هاتفك.",
          sortOrder: 5,
          published: true,
        },
      ],
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
