-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "areaMax" DOUBLE PRECISION,
ADD COLUMN     "areaMin" DOUBLE PRECISION,
ADD COLUMN     "areaRangeKey" TEXT,
ADD COLUMN     "locationId" TEXT,
ADD COLUMN     "priceMax" DOUBLE PRECISION,
ADD COLUMN     "priceMin" DOUBLE PRECISION,
ADD COLUMN     "pricePerM2Display" TEXT,
ADD COLUMN     "priceRangeKey" TEXT;

-- AlterTable
ALTER TABLE "SystemSettings" ADD COLUMN     "extraPostPrice" DOUBLE PRECISION NOT NULL DEFAULT 10000,
ADD COLUMN     "freeUpsPerUserPerDay" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "hardPostsPerUserPerDay" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "hardUpsPerUserPerDay" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "upCooldownMinutes" INTEGER NOT NULL DEFAULT 10,
ALTER COLUMN "vipDurationDays" SET DEFAULT 4,
ALTER COLUMN "upDurationDays" SET DEFAULT 3;

-- CreateTable
CREATE TABLE "PropertyImage" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isThumbnail" BOOLEAN NOT NULL DEFAULT false,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PropertyImage_propertyId_sortOrder_idx" ON "PropertyImage"("propertyId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Location_slug_key" ON "Location"("slug");

-- CreateIndex
CREATE INDEX "Location_slug_type_parentId_idx" ON "Location"("slug", "type", "parentId");

-- CreateIndex
CREATE INDEX "Property_status_propertyType_publishedAt_idx" ON "Property"("status", "propertyType", "publishedAt");

-- CreateIndex
CREATE INDEX "Property_status_locationId_publishedAt_idx" ON "Property"("status", "locationId", "publishedAt");

-- CreateIndex
CREATE INDEX "Property_status_priceMin_priceMax_idx" ON "Property"("status", "priceMin", "priceMax");

-- CreateIndex
CREATE INDEX "Property_status_areaMin_areaMax_idx" ON "Property"("status", "areaMin", "areaMax");

-- CreateIndex
CREATE INDEX "Property_status_pricePerM2_idx" ON "Property"("status", "pricePerM2");

-- CreateIndex
CREATE INDEX "Property_transactionType_propertyType_locationId_idx" ON "Property"("transactionType", "propertyType", "locationId");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyImage" ADD CONSTRAINT "PropertyImage_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

