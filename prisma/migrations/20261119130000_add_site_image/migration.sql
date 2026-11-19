-- CreateTable
CREATE TABLE "SiteImage" (
    "id" TEXT NOT NULL,
    "labelAr" TEXT NOT NULL,
    "description" TEXT,
    "mediaId" TEXT,
    "customUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SiteImage" ADD CONSTRAINT "SiteImage_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
