-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DELETED');

-- CreateEnum
CREATE TYPE "EmailDomain" AS ENUM ('EWHA_AC_KR', 'EWHAIN_NET');

-- CreateEnum
CREATE TYPE "WorkplaceCategory" AS ENUM ('ON_CAMPUS', 'OFF_CAMPUS');

-- CreateEnum
CREATE TYPE "WorkPeriodType" AS ENUM ('SEMESTER', 'INTENSIVE', 'BOTH');

-- CreateEnum
CREATE TYPE "WorkTerm" AS ENUM ('SPRING', 'FALL', 'SUMMER', 'WINTER');

-- CreateEnum
CREATE TYPE "WorkDuration" AS ENUM ('ONE_SEMESTER', 'TWO_SEMESTERS', 'YEAR_PLUS');

-- CreateEnum
CREATE TYPE "IncomeBracket" AS ENUM ('LOW', 'MID', 'HIGH', 'UNDISCLOSED');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('OFFICE', 'PHONE', 'IN_PERSON', 'RESEARCH', 'WRITING', 'EVENT', 'REPETITIVE', 'SAFETY', 'PROFESSIONAL', 'OTHER');

-- CreateEnum
CREATE TYPE "StudyPossibility" AS ENUM ('POSSIBLE', 'LIMITED', 'IMPOSSIBLE');

-- CreateEnum
CREATE TYPE "WorkEnvironment" AS ENUM ('ALONE', 'WITH_PEERS', 'WITH_STAFF');

-- CreateEnum
CREATE TYPE "CoworkerType" AS ENUM ('STAFF', 'STUDENT', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "RecommendTag" AS ENUM ('STUDY_FRIENDLY', 'ACTIVE_WORK', 'LIKES_PEOPLE', 'AVOIDS_PEOPLE', 'NEW_EXPERIENCE', 'CAREER_FIT');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PUBLISHED', 'PENDING_DELETION', 'DELETED');

-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('PUBLISHED', 'PENDING_DELETION', 'DELETED');

-- CreateEnum
CREATE TYPE "DeletionTargetType" AS ENUM ('REVIEW', 'COMMENT');

-- CreateEnum
CREATE TYPE "DeletionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "emailHash" TEXT,
    "emailEncrypted" TEXT,
    "emailDomain" "EmailDomain",
    "role" "Role" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceTokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpCode" (
    "id" TEXT NOT NULL,
    "emailHash" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attemptsRemaining" INTEGER NOT NULL DEFAULT 3,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workplace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kakaoPlaceId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "district" TEXT NOT NULL,
    "category" "WorkplaceCategory" NOT NULL,
    "transitMinFromMainGate" INTEGER,
    "transitMinFromBackGate" INTEGER,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workplace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "workplaceId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "isAdminEntry" BOOLEAN NOT NULL DEFAULT false,
    "workPeriodType" "WorkPeriodType",
    "workYear" INTEGER,
    "workTerm" "WorkTerm",
    "workDuration" "WorkDuration",
    "incomeBracket" "IncomeBracket",
    "tasks" "TaskType"[],
    "autonomyScore" INTEGER,
    "studyPossibility" "StudyPossibility",
    "workEnvironment" "WorkEnvironment",
    "coworkerTypes" "CoworkerType"[],
    "recommendedFor" "RecommendTag"[],
    "overallRating" INTEGER,
    "freeText" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewParticipant" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "CommentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeletionRequest" (
    "id" TEXT NOT NULL,
    "targetType" "DeletionTargetType" NOT NULL,
    "reviewId" TEXT,
    "commentId" TEXT,
    "requesterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "DeletionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeletionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_emailHash_key" ON "User"("emailHash");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Device_deviceTokenHash_key" ON "Device"("deviceTokenHash");

-- CreateIndex
CREATE INDEX "Device_userId_idx" ON "Device"("userId");

-- CreateIndex
CREATE INDEX "Device_expiresAt_idx" ON "Device"("expiresAt");

-- CreateIndex
CREATE INDEX "OtpCode_emailHash_idx" ON "OtpCode"("emailHash");

-- CreateIndex
CREATE INDEX "OtpCode_expiresAt_idx" ON "OtpCode"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Workplace_kakaoPlaceId_key" ON "Workplace"("kakaoPlaceId");

-- CreateIndex
CREATE INDEX "Workplace_district_idx" ON "Workplace"("district");

-- CreateIndex
CREATE INDEX "Workplace_category_idx" ON "Workplace"("category");

-- CreateIndex
CREATE INDEX "Workplace_name_idx" ON "Workplace" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Review_workplaceId_idx" ON "Review"("workplaceId");

-- CreateIndex
CREATE INDEX "Review_authorId_idx" ON "Review"("authorId");

-- CreateIndex
CREATE INDEX "Review_status_idx" ON "Review"("status");

-- CreateIndex
CREATE INDEX "Review_isAdminEntry_idx" ON "Review"("isAdminEntry");

-- CreateIndex
CREATE INDEX "Review_freeText_idx" ON "Review" USING GIN ("freeText" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "ReviewParticipant_reviewId_idx" ON "ReviewParticipant"("reviewId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewParticipant_reviewId_userId_key" ON "ReviewParticipant"("reviewId", "userId");

-- CreateIndex
CREATE INDEX "Comment_reviewId_idx" ON "Comment"("reviewId");

-- CreateIndex
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");

-- CreateIndex
CREATE INDEX "DeletionRequest_status_idx" ON "DeletionRequest"("status");

-- CreateIndex
CREATE INDEX "DeletionRequest_requesterId_idx" ON "DeletionRequest"("requesterId");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workplace" ADD CONSTRAINT "Workplace_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_workplaceId_fkey" FOREIGN KEY ("workplaceId") REFERENCES "Workplace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewParticipant" ADD CONSTRAINT "ReviewParticipant_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewParticipant" ADD CONSTRAINT "ReviewParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeletionRequest" ADD CONSTRAINT "DeletionRequest_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeletionRequest" ADD CONSTRAINT "DeletionRequest_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeletionRequest" ADD CONSTRAINT "DeletionRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeletionRequest" ADD CONSTRAINT "DeletionRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
