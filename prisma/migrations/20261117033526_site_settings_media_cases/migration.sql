-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "address" TEXT,
    "mapsUrl" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "tiktok" TEXT,
    "youtube" TEXT,
    "x" TEXT,
    "snapchat" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeforeAfterCase" (
    "id" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "descriptionAr" TEXT,
    "treatmentSlug" TEXT,
    "beforeMediaId" TEXT NOT NULL,
    "afterMediaId" TEXT NOT NULL,
    "consentOnFile" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BeforeAfterCase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BeforeAfterCase_published_sortOrder_idx" ON "BeforeAfterCase"("published", "sortOrder");

-- AddForeignKey
ALTER TABLE "BeforeAfterCase" ADD CONSTRAINT "BeforeAfterCase_beforeMediaId_fkey" FOREIGN KEY ("beforeMediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeforeAfterCase" ADD CONSTRAINT "BeforeAfterCase_afterMediaId_fkey" FOREIGN KEY ("afterMediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
