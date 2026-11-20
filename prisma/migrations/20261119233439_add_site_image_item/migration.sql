-- CreateTable
CREATE TABLE "SiteImageItem" (
    "id" TEXT NOT NULL,
    "siteImageId" TEXT NOT NULL,
    "mediaId" TEXT,
    "customUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteImageItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteImageItem_siteImageId_sortOrder_idx" ON "SiteImageItem"("siteImageId", "sortOrder");

-- AddForeignKey
ALTER TABLE "SiteImageItem" ADD CONSTRAINT "SiteImageItem_siteImageId_fkey" FOREIGN KEY ("siteImageId") REFERENCES "SiteImage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteImageItem" ADD CONSTRAINT "SiteImageItem_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
