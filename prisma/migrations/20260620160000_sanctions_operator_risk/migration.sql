-- CreateEnum
CREATE TYPE "ScreeningStatus" AS ENUM ('CLEAR', 'REVIEW', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ScreeningSubjectType" AS ENUM ('VESSEL', 'OWNER', 'OPERATOR', 'CHARTERER');

-- CreateEnum
CREATE TYPE "ScreeningReviewAction" AS ENUM ('REVIEWED', 'ESCALATED', 'CANNOT_PROCEED', 'REVIEW_CLEARED');

-- CreateTable: Operator party, additive and nullable from Vessel/Fixture.
CREATE TABLE "Operator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "notes" TEXT,
    "latestScreeningStatus" "ScreeningStatus",
    "latestScreeningResultId" TEXT,
    "latestScreenedAt" TIMESTAMP(3),
    "latestScreeningTtlExpiresAt" TIMESTAMP(3),
    "latestScreeningSourceName" TEXT,
    "latestScreeningListName" TEXT,
    "latestScreeningListVersion" TEXT,
    "latestScreeningListDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operator_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Owner latest-screening cache with provenance.
ALTER TABLE "Owner"
ADD COLUMN "latestScreeningStatus" "ScreeningStatus",
ADD COLUMN "latestScreeningResultId" TEXT,
ADD COLUMN "latestScreenedAt" TIMESTAMP(3),
ADD COLUMN "latestScreeningTtlExpiresAt" TIMESTAMP(3),
ADD COLUMN "latestScreeningSourceName" TEXT,
ADD COLUMN "latestScreeningListName" TEXT,
ADD COLUMN "latestScreeningListVersion" TEXT,
ADD COLUMN "latestScreeningListDate" TIMESTAMP(3);

-- AlterTable: Charterer latest-screening cache with provenance.
ALTER TABLE "Charterer"
ADD COLUMN "latestScreeningStatus" "ScreeningStatus",
ADD COLUMN "latestScreeningResultId" TEXT,
ADD COLUMN "latestScreenedAt" TIMESTAMP(3),
ADD COLUMN "latestScreeningTtlExpiresAt" TIMESTAMP(3),
ADD COLUMN "latestScreeningSourceName" TEXT,
ADD COLUMN "latestScreeningListName" TEXT,
ADD COLUMN "latestScreeningListVersion" TEXT,
ADD COLUMN "latestScreeningListDate" TIMESTAMP(3);

-- AlterTable: Vessel flag/operator plus latest-screening cache with provenance.
ALTER TABLE "Vessel"
ADD COLUMN "flagState" TEXT,
ADD COLUMN "operatorId" TEXT,
ADD COLUMN "latestScreeningStatus" "ScreeningStatus",
ADD COLUMN "latestScreeningResultId" TEXT,
ADD COLUMN "latestScreenedAt" TIMESTAMP(3),
ADD COLUMN "latestScreeningTtlExpiresAt" TIMESTAMP(3),
ADD COLUMN "latestScreeningSourceName" TEXT,
ADD COLUMN "latestScreeningListName" TEXT,
ADD COLUMN "latestScreeningListVersion" TEXT,
ADD COLUMN "latestScreeningListDate" TIMESTAMP(3);

-- AlterTable: Fixture can snapshot the selected operator for a deal.
ALTER TABLE "Fixture"
ADD COLUMN "operatorId" TEXT;

-- CreateTable: immutable screening evidence/result trail.
CREATE TABLE "ScreeningResult" (
    "id" TEXT NOT NULL,
    "subjectType" "ScreeningSubjectType" NOT NULL,
    "status" "ScreeningStatus" NOT NULL,
    "query" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceJurisdiction" TEXT,
    "sourceListName" TEXT NOT NULL,
    "sourceListVersion" TEXT NOT NULL,
    "sourceListDate" TIMESTAMP(3),
    "sourceRecordId" TEXT,
    "sourceRecordUrl" TEXT,
    "matchedName" TEXT,
    "matchedIdentifier" TEXT,
    "matchType" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "reason" TEXT NOT NULL,
    "screenedAt" TIMESTAMP(3) NOT NULL,
    "ttlExpiresAt" TIMESTAMP(3) NOT NULL,
    "evidence" JSONB NOT NULL,
    "fixtureId" TEXT,
    "requirementId" TEXT,
    "vesselId" TEXT,
    "ownerId" TEXT,
    "operatorId" TEXT,
    "chartererId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScreeningResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable: minimal human review record. True BLOCKED cannot be broker-cleared in service code.
CREATE TABLE "ScreeningReview" (
    "id" TEXT NOT NULL,
    "screeningResultId" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "action" "ScreeningReviewAction" NOT NULL,
    "rationale" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScreeningReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Vessel_operatorId_idx" ON "Vessel"("operatorId");

-- CreateIndex
CREATE INDEX "Fixture_operatorId_idx" ON "Fixture"("operatorId");

-- CreateIndex
CREATE INDEX "ScreeningResult_subjectType_status_idx" ON "ScreeningResult"("subjectType", "status");

-- CreateIndex
CREATE INDEX "ScreeningResult_fixtureId_createdAt_idx" ON "ScreeningResult"("fixtureId", "createdAt");

-- CreateIndex
CREATE INDEX "ScreeningResult_requirementId_createdAt_idx" ON "ScreeningResult"("requirementId", "createdAt");

-- CreateIndex
CREATE INDEX "ScreeningResult_vesselId_screenedAt_idx" ON "ScreeningResult"("vesselId", "screenedAt");

-- CreateIndex
CREATE INDEX "ScreeningResult_ownerId_screenedAt_idx" ON "ScreeningResult"("ownerId", "screenedAt");

-- CreateIndex
CREATE INDEX "ScreeningResult_operatorId_screenedAt_idx" ON "ScreeningResult"("operatorId", "screenedAt");

-- CreateIndex
CREATE INDEX "ScreeningResult_chartererId_screenedAt_idx" ON "ScreeningResult"("chartererId", "screenedAt");

-- CreateIndex
CREATE INDEX "ScreeningReview_screeningResultId_createdAt_idx" ON "ScreeningReview"("screeningResultId", "createdAt");

-- CreateIndex
CREATE INDEX "ScreeningReview_brokerId_createdAt_idx" ON "ScreeningReview"("brokerId", "createdAt");

-- AddForeignKey
ALTER TABLE "Vessel" ADD CONSTRAINT "Vessel_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScreeningResult" ADD CONSTRAINT "ScreeningResult_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "Fixture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScreeningResult" ADD CONSTRAINT "ScreeningResult_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScreeningResult" ADD CONSTRAINT "ScreeningResult_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "Vessel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScreeningResult" ADD CONSTRAINT "ScreeningResult_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScreeningResult" ADD CONSTRAINT "ScreeningResult_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScreeningResult" ADD CONSTRAINT "ScreeningResult_chartererId_fkey" FOREIGN KEY ("chartererId") REFERENCES "Charterer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScreeningReview" ADD CONSTRAINT "ScreeningReview_screeningResultId_fkey" FOREIGN KEY ("screeningResultId") REFERENCES "ScreeningResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScreeningReview" ADD CONSTRAINT "ScreeningReview_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
