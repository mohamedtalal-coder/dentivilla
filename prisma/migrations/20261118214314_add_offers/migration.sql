-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "badge" TEXT NOT NULL DEFAULT 'عرض خاص',
    "titleAr" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "originalPrice" INTEGER,
    "treatmentSlug" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Offer_active_sortOrder_idx" ON "Offer"("active", "sortOrder");
