/*
  Warnings:

  - A unique constraint covering the columns `[externalPlaceId,department]` on the table `Workplace` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Workplace_externalPlaceId_key";

-- AlterTable
ALTER TABLE "Workplace" ADD COLUMN     "department" TEXT,
ADD COLUMN     "isManualEntry" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "externalPlaceId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Workplace_externalPlaceId_department_key" ON "Workplace"("externalPlaceId", "department");
