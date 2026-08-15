-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'REFUND';
ALTER TYPE "TransactionType" ADD VALUE 'ADMIN_ADJUST';

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "parentId" TEXT;

-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "callClicks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "districtId" TEXT,
ADD COLUMN     "isNegotiable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "propertyCode" TEXT,
ADD COLUMN     "provinceId" TEXT,
ADD COLUMN     "pushedAt" TIMESTAMP(3),
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "wardId" TEXT,
ADD COLUMN     "zaloClicks" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "adminNote" TEXT;

-- AlterTable
ALTER TABLE "Requirement" ADD COLUMN     "adminNote" TEXT;

-- AlterTable
ALTER TABLE "SystemSettings" ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "freePostsPerDay" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "freeUpsPerDay" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "isAutoApprove" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxPostsPerDay" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "maxUpsPerDay" INTEGER NOT NULL DEFAULT 50;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "adminNote" TEXT,
ADD COLUMN     "balanceAfter" DOUBLE PRECISION,
ADD COLUMN     "balanceBefore" DOUBLE PRECISION,
ADD COLUMN     "propertyId" TEXT,
ADD COLUMN     "userNote" TEXT;

-- CreateTable
CREATE TABLE "AdminActionLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "targetId" TEXT,
    "targetType" TEXT,
    "description" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ViewedProperty" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "propertyId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ViewedProperty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminActionLog_adminId_createdAt_idx" ON "AdminActionLog"("adminId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminActionLog_actionType_createdAt_idx" ON "AdminActionLog"("actionType", "createdAt");

-- CreateIndex
CREATE INDEX "AdminActionLog_targetType_targetId_idx" ON "AdminActionLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "ViewedProperty_userId_viewedAt_idx" ON "ViewedProperty"("userId", "viewedAt");

-- CreateIndex
CREATE INDEX "ViewedProperty_propertyId_viewedAt_idx" ON "ViewedProperty"("propertyId", "viewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ViewedProperty_userId_propertyId_key" ON "ViewedProperty"("userId", "propertyId");

-- CreateIndex
CREATE INDEX "Location_type_isFeatured_idx" ON "Location"("type", "isFeatured");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminActionLog" ADD CONSTRAINT "AdminActionLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewedProperty" ADD CONSTRAINT "ViewedProperty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewedProperty" ADD CONSTRAINT "ViewedProperty_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
