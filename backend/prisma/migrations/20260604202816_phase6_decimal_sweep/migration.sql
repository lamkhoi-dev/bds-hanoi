/*
  Warnings:

  - You are about to alter the column `price` on the `Property` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `priceMax` on the `Property` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `priceMin` on the `Property` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE "Property" ALTER COLUMN "price" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "priceMax" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "priceMin" SET DATA TYPE DECIMAL(65,30);
