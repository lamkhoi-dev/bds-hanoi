/*
  Warnings:

  - You are about to drop the column `accessRoad` on the `Property` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "PropertyStatus" ADD VALUE 'RENTED';

-- AlterTable
ALTER TABLE "Property" DROP COLUMN "accessRoad",
ADD COLUMN     "roadWidth" DOUBLE PRECISION,
ADD COLUMN     "surroundings" TEXT;
