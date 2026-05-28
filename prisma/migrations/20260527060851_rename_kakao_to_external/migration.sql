/*
  Warnings:

  - You are about to drop the column `kakaoPlaceId` on the `Workplace` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[externalPlaceId]` on the table `Workplace` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `externalPlaceId` to the `Workplace` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Workplace_kakaoPlaceId_key";

-- AlterTable
ALTER TABLE "Workplace" DROP COLUMN "kakaoPlaceId",
ADD COLUMN     "externalPlaceId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Workplace_externalPlaceId_key" ON "Workplace"("externalPlaceId");
