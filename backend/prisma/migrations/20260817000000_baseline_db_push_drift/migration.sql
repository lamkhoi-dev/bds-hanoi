-- Chốt lại các thay đổi schema đã áp trực tiếp lên DB Nghệ An qua `prisma db push`/ALTER
-- tay từ trước, chưa từng có migration file tương ứng (phát hiện khi dựng DB Hà Nội
-- trắng từ đầu: `migrate deploy` chạy đủ 19 migration cũ nhưng vẫn thiếu cột so với
-- schema.prisma hiện tại). Migration này chỉ ĐUỔI CHO KHỚP, không đổi ý nghĩa dữ liệu.
-- Trên DB Nghệ An, các thay đổi này đã tồn tại sẵn — migration được đánh dấu "đã áp
-- dụng" bằng `prisma migrate resolve --applied`, KHÔNG chạy lại SQL này ở đó.

-- AlterEnum
ALTER TYPE "TransactionStatus" ADD VALUE 'REFUNDED';

-- DropForeignKey
ALTER TABLE "AdminActionLog" DROP CONSTRAINT "AdminActionLog_adminId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_actorId_fkey";

-- DropForeignKey
ALTER TABLE "DataDeletionRequest" DROP CONSTRAINT "DataDeletionRequest_userId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentWebhookLog" DROP CONSTRAINT "PaymentWebhookLog_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentWebhookLog" DROP CONSTRAINT "PaymentWebhookLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_userId_fkey";

-- AlterTable
ALTER TABLE "AdminActionLog" ALTER COLUMN "adminId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "DataDeletionRequest" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "isSeoEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "isExactLocation" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "oldWard" TEXT,
ALTER COLUMN "frozenTierMs" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "PropertyHistory" ADD COLUMN     "changedById" TEXT,
ALTER COLUMN "changedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SystemSettings" DROP COLUMN "freeUpsPerDay",
ADD COLUMN     "facebookPixelId" TEXT,
ADD COLUMN     "googleAdsenseClientId" TEXT,
ADD COLUMN     "googleAdsenseSlotId" TEXT,
ADD COLUMN     "googleAnalyticsId" TEXT,
ADD COLUMN     "googleMapsApiKey" TEXT,
ADD COLUMN     "googleSearchConsoleId" TEXT,
ADD COLUMN     "homeBannerLink" TEXT,
ADD COLUMN     "homeBannerUrl" TEXT,
ADD COLUMN     "isHomeBannerActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isPropertyAdActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maxTotalPostsPerUser" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "maxUpPerPostPerDay" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "propertyAdLink" TEXT,
ADD COLUMN     "propertyAdUrl" TEXT,
ADD COLUMN     "propertyAds" JSONB DEFAULT '[]',
ADD COLUMN     "showOnlineUsers" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "vipPrice" SET DEFAULT 10000,
ALTER COLUMN "upPrice" SET DEFAULT 3000,
ALTER COLUMN "vipDurationDays" SET DEFAULT 2,
ALTER COLUMN "upDurationDays" SET DEFAULT 1,
ALTER COLUMN "freePostsPerUser" SET DEFAULT 2,
ALTER COLUMN "extraPostPrice" SET DEFAULT 5000,
ALTER COLUMN "hardUpsPerUserPerDay" SET DEFAULT 10,
ALTER COLUMN "freePostsPerDay" SET DEFAULT 2,
ALTER COLUMN "maxUpsPerDay" SET DEFAULT 10;

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");

-- CreateIndex
CREATE INDEX "Property_userId_idx" ON "Property"("userId");

-- CreateIndex
CREATE INDEX "Property_categoryId_idx" ON "Property"("categoryId");

-- CreateIndex
CREATE INDEX "Property_status_idx" ON "Property"("status");

-- CreateIndex
CREATE INDEX "Property_tierExpiresAt_idx" ON "Property"("tierExpiresAt");

-- CreateIndex
CREATE INDEX "Property_provinceId_idx" ON "Property"("provinceId");

-- CreateIndex
CREATE INDEX "Property_districtId_idx" ON "Property"("districtId");

-- CreateIndex
CREATE INDEX "Property_wardId_idx" ON "Property"("wardId");

-- CreateIndex
CREATE INDEX "Transaction_propertyId_idx" ON "Transaction"("propertyId");

-- CreateIndex
CREATE INDEX "User_provider_providerId_idx" ON "User"("provider", "providerId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentWebhookLog" ADD CONSTRAINT "PaymentWebhookLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentWebhookLog" ADD CONSTRAINT "PaymentWebhookLog_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyHistory" ADD CONSTRAINT "PropertyHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataDeletionRequest" ADD CONSTRAINT "DataDeletionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminActionLog" ADD CONSTRAINT "AdminActionLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
