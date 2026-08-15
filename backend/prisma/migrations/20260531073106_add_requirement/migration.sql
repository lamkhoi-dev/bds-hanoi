/*
  Warnings:

  - You are about to drop the column `action` on the `PropertyHistory` table. All the data in the column will be lost.
  - You are about to drop the column `changedData` on the `PropertyHistory` table. All the data in the column will be lost.
  - You are about to drop the column `adminNote` on the `Requirement` table. All the data in the column will be lost.
  - You are about to drop the column `areaRange` on the `Requirement` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Requirement` table. All the data in the column will be lost.
  - You are about to drop the column `note` on the `Requirement` table. All the data in the column will be lost.
  - You are about to drop the column `priceRange` on the `Requirement` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Requirement` table. All the data in the column will be lost.
  - Added the required column `changedBy` to the `PropertyHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `changes` to the `PropertyHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `Requirement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Requirement` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "PropertyHistory_action_createdAt_idx";

-- DropIndex
DROP INDEX "PropertyHistory_propertyId_createdAt_idx";

-- DropIndex
DROP INDEX "Requirement_createdAt_idx";

-- DropIndex
DROP INDEX "Requirement_phone_idx";

-- AlterTable
ALTER TABLE "PropertyHistory" DROP COLUMN "action",
DROP COLUMN "changedData",
ADD COLUMN     "changedBy" TEXT NOT NULL,
ADD COLUMN     "changes" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Requirement" DROP COLUMN "adminNote",
DROP COLUMN "areaRange",
DROP COLUMN "location",
DROP COLUMN "note",
DROP COLUMN "priceRange",
DROP COLUMN "type",
ADD COLUMN     "areaMax" DOUBLE PRECISION,
ADD COLUMN     "areaMin" DOUBLE PRECISION,
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "locationId" TEXT,
ADD COLUMN     "priceMax" DOUBLE PRECISION,
ADD COLUMN     "priceMin" DOUBLE PRECISION,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "propertyType" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "PropertyHistory_propertyId_idx" ON "PropertyHistory"("propertyId");

-- CreateIndex
CREATE INDEX "Requirement_status_createdAt_idx" ON "Requirement"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Requirement_userId_idx" ON "Requirement"("userId");

-- CreateIndex
CREATE INDEX "Requirement_locationId_idx" ON "Requirement"("locationId");

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
