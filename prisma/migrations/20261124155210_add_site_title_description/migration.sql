-- AlterTable
ALTER TABLE "Offer" ALTER COLUMN "badge" SET DEFAULT 'Special Offer';

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "siteDescription" TEXT,
ADD COLUMN     "siteTitle" TEXT;

-- AlterTable
ALTER TABLE "Treatment" ADD COLUMN     "numberOfVisits" INTEGER;
