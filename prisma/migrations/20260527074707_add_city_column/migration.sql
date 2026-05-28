/*
  Warnings:

  - Added the required column `city` to the `Workplace` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Workplace" ADD COLUMN     "city" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Workplace_city_idx" ON "Workplace"("city");
