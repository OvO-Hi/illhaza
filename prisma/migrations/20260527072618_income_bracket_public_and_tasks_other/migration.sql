/*
  Warnings:

  - The values [UNDISCLOSED] on the enum `IncomeBracket` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "IncomeBracket_new" AS ENUM ('LOW', 'MID', 'HIGH');
ALTER TABLE "Review" ALTER COLUMN "incomeBracket" TYPE "IncomeBracket_new" USING ("incomeBracket"::text::"IncomeBracket_new");
ALTER TYPE "IncomeBracket" RENAME TO "IncomeBracket_old";
ALTER TYPE "IncomeBracket_new" RENAME TO "IncomeBracket";
DROP TYPE "public"."IncomeBracket_old";
COMMIT;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "incomeBracketPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tasksOtherText" TEXT;
