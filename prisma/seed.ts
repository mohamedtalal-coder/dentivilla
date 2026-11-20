import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { fromZonedTime } from "date-fns-tz";
import { computePhoneBlindIndex, encryptField, encryptOptional } from "../src/lib/encryption";

const prisma = new PrismaClient();
const TIMEZONE = "Africa/Cairo";

const treatments = [
  {
    slug: "veneers",
    nameAr: "Porcelain Veneers",
    summaryAr: "Ultra-thin custom porcelain laminates crafted to restore symmetry, shape, and shade to visible teeth.",
    descriptionAr:
      "Porcelain veneers are ultra-thin ceramic laminates designed to enhance the visible teeth in your smile. The journey begins with high-magnification clinical examination and Digital Smile Design, followed by minimal surface preparation and an intraoral preview mockup before permanent bonding. Information here is educational; the exact plan is determined during clinical consultation.",
    durationMinutes: 60,
    requiresTeeth: true,
    sortOrder: 1,
  },
  {
    slug: "smile-makeover",
    nameAr: "Digital Smile Design",
    summaryAr: "A comprehensive aesthetic pathway harmonizing dental alignment and color with your facial features.",
    descriptionAr:
      "A smile makeover is not a single procedure, but an integrated treatment journey evaluating shade, occlusion, gingival architecture, and facial proportions. It may include whitening, veneers, or aesthetic restorations tailored to your goals. We always start with an in-depth consultation and digital simulation before any procedure.",
    durationMinutes: 45,
    requiresTeeth: false,
    sortOrder: 2,
  },
  {
    slug: "implants",
    nameAr: "Dental Implants",
    summaryAr: "Permanent tooth replacement with biocompatible titanium fixtures supporting natural-looking crowns.",
    descriptionAr:
      "Dental implants restore missing teeth without compromising adjacent natural teeth. Treatment requires 3D bone and gum assessment with CBCT imaging. Your customized treatment plan is presented after examination, followed by an osseointegration period before fitting the final crown.",
    durationMinutes: 60,
    requiresTeeth: true,
    sortOrder: 3,
  },
  {
    slug: "orthodontics",
    nameAr: "Orthodontics & Clear Aligners",
    summaryAr: "Correcting tooth alignment and bite function with custom digital treatment planning.",
    descriptionAr:
      "Orthodontic care enhances function, bite stability, and facial balance in addition to smile aesthetics. Following digital scans and radiographs, suitable options (including clear aligners) are discussed. Duration varies per patient.",
    durationMinutes: 45,
    requiresTeeth: false,
    sortOrder: 4,
  },
  {
    slug: "root-canal",
    nameAr: "Root Canal Treatment",
    summaryAr: "Microsurgical treatment of inflamed or infected pulp to save and preserve your natural tooth.",
    descriptionAr:
      "Root canal therapy is performed when the dental pulp becomes inflamed or necrotic. It involves gentle microscopic cleaning, disinfection, and warm 3D sealing of the root canals, followed by a protective crown or restoration to safeguard remaining tooth structure.",
    durationMinutes: 60,
    requiresTeeth: true,
    sortOrder: 5,
  },
  {
    slug: "restorative",
    nameAr: "Restorative Dentistry",
    summaryAr: "Conservative treatment of cavities, chips, and worn restorations to restore natural strength and aesthetics.",
    descriptionAr:
      "Restorative dentistry encompasses composite restorations, inlays, onlays, and crowns to renew damaged tooth tissues. Our priority is conserving maximum natural tooth structure while ensuring balanced, comfortable occlusion.",
    durationMinutes: 45,
    requiresTeeth: true,
    sortOrder: 6,
  },
  {
    slug: "whitening",
    nameAr: "Laser Teeth Whitening",
    summaryAr: "Safe, advanced in-office laser whitening in a single session protecting enamel and gums.",
    descriptionAr:
      "Single-session in-office laser teeth whitening using advanced cold-laser technology to safeguard enamel and gingival tissues at Dentivilla, achieving immediate, radiant, and durable results.",
    durationMinutes: 45,
    requiresTeeth: false,
    sortOrder: 7,
  },
  {
    slug: "consultation",
    nameAr: "Comprehensive Consultation",
    summaryAr: "Clinical exam, digital imaging, and high-magnification diagnostic assessment with a transparent written plan.",
    descriptionAr:
      "An attentive diagnostic session that begins by listening to your concerns and goals, followed by clinical examination and 3D imaging to formulate a clear, upfront treatment plan with transparent timelines and costs.",
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
  const name = process.env.ADMIN_NAME ?? "Dr. Mohamed Yasser El Gebaly";
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

  // Demo records for local development only
  if (!isProduction && (await prisma.patient.count()) === 0) {
    const demoPhone = "01011112222";
    const patient = await prisma.patient.create({
      data: {
        fullName: encryptField("Demo Patient"),
        phone: encryptField(demoPhone),
        phoneBlindIndex: computePhoneBlindIndex(demoPhone),
        whatsapp: encryptOptional(demoPhone),
        notes: encryptOptional("Test booking for admin dashboard preview only."),
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
        patientNotes: encryptOptional("Sample booking request for review."),
      },
    });
  }

  if ((await prisma.offer.count()) === 0) {
    await prisma.offer.createMany({
      data: [
        {
          badge: "Special Offer",
          titleAr: "Laser Teeth Whitening — Single Session",
          descriptionAr: "Includes shade evaluation before and after, dental polishing, and enamel protection care.",
          price: 2000,
          originalPrice: 2800,
          treatmentSlug: "whitening",
          sortOrder: 1,
          active: true,
        },
        {
          badge: "Smile Package",
          titleAr: "Comprehensive Consultation & Smile Design Planning",
          descriptionAr: "High-magnification clinical exam, 3D imaging, and a written transparent treatment plan before any procedure.",
          price: 500,
          originalPrice: 900,
          treatmentSlug: "consultation",
          sortOrder: 2,
          active: true,
        },
        {
          badge: "Limited Time",
          titleAr: "Ultrasonic Teeth Cleaning & Scaling",
          descriptionAr: "Gentle and thorough ultrasonic calculus removal, tooth polishing, and gum rejuvenation.",
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
          question: "Do porcelain veneers require extensive tooth shaving?",
          answer:
            "It depends on the position, shade, and alignment of your natural teeth. In many conservative cases, minimal preparation is needed, and sometimes none at all. We determine the exact plan beforehand and test the smile in your mouth with an intraoral mockup before touching any tooth.",
          sortOrder: 1,
          published: true,
        },
        {
          question: "Are dental implants painful? Are they safe for patients with diabetes or hypertension?",
          answer:
            "Implants are placed under comfortable local anesthesia, and patients typically describe recovery as mild discomfort well-managed with routine pain relievers. Patients with well-controlled diabetes or hypertension can usually undergo implant placement safely after clinical health assessment.",
          sortOrder: 2,
          published: true,
        },
        {
          question: "Can I preview my smile before treatment starts?",
          answer:
            "Yes. We design your smile digitally, then place a temporary aesthetic mockup on your teeth so you can evaluate the contour, proportion, and shade in the mirror before any permanent step.",
          sortOrder: 3,
          published: true,
        },
        {
          question: "When will I know the total cost?",
          answer:
            "Immediately following your clinical examination, you receive a written treatment plan outlining all suitable options, timelines, and exact fees. Nothing begins without your informed consent.",
          sortOrder: 4,
          published: true,
        },
        {
          question: "Is online booking instant and confirmed?",
          answer:
            "Your selected time slot is instantly reserved in our schedule so nobody else can take it. Our clinic team then confirms the appointment with you. You can check the status of your booking anytime using your reference code and mobile number.",
          sortOrder: 5,
          published: true,
        },
      ],
    });
  }

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {
      address: "Medical Center 3, Makram Ebeid Street, Nasr City, Cairo, Egypt",
    },
    create: {
      id: "default",
      phone: "01132081093",
      whatsapp: "01132081093",
      email: "contact@dentivilla.com",
      address: "Medical Center 3, Makram Ebeid Street, Nasr City, Cairo, Egypt",
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent("Medical Center 3, Makram Ebeid, Nasr City, Cairo"),
      instagram: "https://instagram.com/dentivilla",
      facebook: "https://facebook.com/dentivilla",
    },
  });

  if ((await prisma.beforeAfterCase.count()) === 0) {
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const sharp = (await import("sharp")).default;

      async function createMedia(filePath: string) {
        const buf = await fs.readFile(filePath);
        const { data, info } = await sharp(buf)
          .rotate()
          .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 84, effort: 5 })
          .toBuffer({ resolveWithObject: true });

        return prisma.media.create({
          data: {
            mimeType: "image/webp",
            width: info.width,
            height: info.height,
            sizeBytes: data.byteLength,
            data,
          },
          select: { id: true },
        });
      }

      const smileBeforePath = path.join(process.cwd(), "public", "images", "smile_before.jpg");
      const smileAfterPath = path.join(process.cwd(), "public", "images", "smile_after.jpg");
      const lipsClosedPath = path.join(process.cwd(), "public", "images", "intro", "lips-closed.jpg");
      const lipsSmilePath = path.join(process.cwd(), "public", "images", "intro", "lips-smile.jpg");

      const [media1, media2, media3, media4] = await Promise.all([
        createMedia(smileBeforePath),
        createMedia(smileAfterPath),
        createMedia(lipsClosedPath),
        createMedia(lipsSmilePath),
      ]);

      await prisma.beforeAfterCase.createMany({
        data: [
          {
            titleAr: "Digital Smile Design & Harmonization",
            descriptionAr:
              "Restoring symmetry and shade while conserving natural tooth vitality and balanced smile line.",
            treatmentSlug: "smile-makeover",
            beforeMediaId: media1.id,
            afterMediaId: media2.id,
            consentOnFile: true,
            published: true,
            featured: true,
            sortOrder: 1,
          },
          {
            titleAr: "In-Office Laser Teeth Whitening",
            descriptionAr:
              "Brightening tooth shade in a single safe session with zero sensitivity and immediate results.",
            treatmentSlug: "whitening",
            beforeMediaId: media3.id,
            afterMediaId: media4.id,
            consentOnFile: true,
            published: true,
            featured: false,
            sortOrder: 2,
          },
          {
            titleAr: "Conservative Porcelain Veneers",
            descriptionAr:
              "Ultra-thin ceramic veneers refining the proportions and symmetry of anterior teeth with minimal preparation.",
            treatmentSlug: "veneers",
            beforeMediaId: media1.id,
            afterMediaId: media2.id,
            consentOnFile: true,
            published: true,
            featured: false,
            sortOrder: 3,
          },
        ],
      });
    } catch (e) {
      console.warn("Could not seed cases in seed.ts:", e);
    }
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
