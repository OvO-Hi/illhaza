-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "workTermPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "workYearPublic" BOOLEAN NOT NULL DEFAULT true;
