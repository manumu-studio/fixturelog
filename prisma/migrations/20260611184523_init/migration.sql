-- CreateEnum
CREATE TYPE "FixtureStatus" AS ENUM ('DRAFT', 'NEGOTIATING', 'ON_SUBS', 'FIXED', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "RequirementStatus" AS ENUM ('ENQUIRY', 'SHORTLISTED', 'NEGOTIATING', 'ON_SUBS', 'FIXED', 'LOST');

-- CreateEnum
CREATE TYPE "VesselStatus" AS ENUM ('OPEN', 'ON_HIRE', 'YARD', 'LAID_UP');

-- CreateEnum
CREATE TYPE "PositionSource" AS ENUM ('SEEDED', 'MANUAL', 'AIS', 'IMPORTED');

-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "VesselType" AS ENUM ('PSV', 'AHTS', 'MPSV', 'CSV', 'ERRV', 'DSV', 'CTV', 'SOV', 'OTHER');

-- CreateEnum
CREATE TYPE "DPClass" AS ENUM ('DP1', 'DP2', 'DP3', 'NONE');

-- CreateEnum
CREATE TYPE "WorkscopeCode" AS ENUM ('SUPPLY', 'ANCHOR_HANDLING', 'RIG_MOVE', 'TOWING', 'CONSTRUCTION', 'IMR', 'ROV_SUPPORT', 'STANDBY', 'WIND_OM');

-- CreateEnum
CREATE TYPE "RegionCode" AS ENUM ('NORTH_SEA', 'BRAZIL', 'US_GULF', 'WEST_AFRICA', 'MIDDLE_EAST', 'SE_ASIA', 'MEDITERRANEAN');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('GBP', 'USD', 'NOK');

-- CreateEnum
CREATE TYPE "CharterType" AS ENUM ('SPOT', 'TERM');

-- CreateEnum
CREATE TYPE "CharterPartyForm" AS ENUM ('SUPPLYTIME_2017', 'OTHER');

-- CreateTable
CREATE TABLE "Owner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Charterer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sector" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Charterer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Broker" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "office" TEXT,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Broker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "code" "RegionCode" NOT NULL,
    "name" TEXT NOT NULL,
    "centerLat" DOUBLE PRECISION NOT NULL,
    "centerLng" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workscope" (
    "id" TEXT NOT NULL,
    "code" "WorkscopeCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workscope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateBenchmark" (
    "id" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "vesselType" "VesselType" NOT NULL,
    "workscopeId" TEXT,
    "basisDate" TIMESTAMP(3) NOT NULL,
    "minRate" DOUBLE PRECISION NOT NULL,
    "medianRate" DOUBLE PRECISION NOT NULL,
    "maxRate" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateBenchmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vessel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imo" TEXT,
    "mmsi" TEXT,
    "vesselType" "VesselType" NOT NULL,
    "ownerId" TEXT NOT NULL,
    "deckAreaM2" DOUBLE PRECISION,
    "bollardPullT" DOUBLE PRECISION,
    "dpClass" "DPClass" NOT NULL,
    "builtYear" INTEGER,
    "status" "VesselStatus" NOT NULL,
    "openRegionId" TEXT,
    "openPort" TEXT,
    "openDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vessel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PositionSnapshot" (
    "id" TEXT NOT NULL,
    "vesselId" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "portName" TEXT,
    "availabilityFrom" TIMESTAMP(3),
    "source" "PositionSource" NOT NULL,
    "confidence" "ConfidenceLevel" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PositionSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Requirement" (
    "id" TEXT NOT NULL,
    "chartererId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "workscopeId" TEXT NOT NULL,
    "vesselTypeNeeded" "VesselType" NOT NULL,
    "minDeckAreaM2" DOUBLE PRECISION,
    "minBollardPullT" DOUBLE PRECISION,
    "minDpClass" "DPClass",
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "durationDays" INTEGER,
    "charterType" "CharterType" NOT NULL,
    "dayRateBudget" DOUBLE PRECISION,
    "status" "RequirementStatus" NOT NULL,
    "sourceChannel" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Requirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fixture" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT,
    "vesselId" TEXT NOT NULL,
    "chartererId" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "workscopeId" TEXT NOT NULL,
    "charterType" "CharterType" NOT NULL,
    "status" "FixtureStatus" NOT NULL,
    "agreedDayRate" DOUBLE PRECISION NOT NULL,
    "currency" "Currency" NOT NULL,
    "mobilizationFee" DOUBLE PRECISION,
    "demobilizationFee" DOUBLE PRECISION,
    "durationDays" INTEGER,
    "deliveryPort" TEXT,
    "redeliveryPort" TEXT,
    "commencement" TIMESTAMP(3),
    "charterPartyForm" "CharterPartyForm" NOT NULL,
    "subjectsSummary" TEXT,
    "fixedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fixture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectItem" (
    "id" TEXT NOT NULL,
    "fixtureId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "owner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubjectItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recap" (
    "id" TEXT NOT NULL,
    "fixtureId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "generatedMarkdown" TEXT NOT NULL,
    "generatedText" TEXT NOT NULL,
    "mainTerms" JSONB NOT NULL,
    "approvedByBrokerId" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherSnapshot" (
    "id" TEXT NOT NULL,
    "fixtureId" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "waveHeightM" DOUBLE PRECISION NOT NULL,
    "swellHeightM" DOUBLE PRECISION,
    "windWaveHeightM" DOUBLE PRECISION,
    "workabilityVerdict" TEXT NOT NULL,
    "laycanFrom" TIMESTAMP(3),
    "laycanTo" TIMESTAMP(3),
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeatherSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Region_code_key" ON "Region"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Workscope_code_key" ON "Workscope"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Vessel_imo_key" ON "Vessel"("imo");

-- CreateIndex
CREATE UNIQUE INDEX "Vessel_mmsi_key" ON "Vessel"("mmsi");

-- CreateIndex
CREATE INDEX "Vessel_status_openRegionId_openDate_idx" ON "Vessel"("status", "openRegionId", "openDate");

-- CreateIndex
CREATE INDEX "Fixture_regionId_fixedAt_idx" ON "Fixture"("regionId", "fixedAt");

-- AddForeignKey
ALTER TABLE "RateBenchmark" ADD CONSTRAINT "RateBenchmark_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateBenchmark" ADD CONSTRAINT "RateBenchmark_workscopeId_fkey" FOREIGN KEY ("workscopeId") REFERENCES "Workscope"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vessel" ADD CONSTRAINT "Vessel_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vessel" ADD CONSTRAINT "Vessel_openRegionId_fkey" FOREIGN KEY ("openRegionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionSnapshot" ADD CONSTRAINT "PositionSnapshot_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "Vessel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_chartererId_fkey" FOREIGN KEY ("chartererId") REFERENCES "Charterer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_workscopeId_fkey" FOREIGN KEY ("workscopeId") REFERENCES "Workscope"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "Vessel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_chartererId_fkey" FOREIGN KEY ("chartererId") REFERENCES "Charterer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_workscopeId_fkey" FOREIGN KEY ("workscopeId") REFERENCES "Workscope"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectItem" ADD CONSTRAINT "SubjectItem_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "Fixture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recap" ADD CONSTRAINT "Recap_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "Fixture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recap" ADD CONSTRAINT "Recap_approvedByBrokerId_fkey" FOREIGN KEY ("approvedByBrokerId") REFERENCES "Broker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherSnapshot" ADD CONSTRAINT "WeatherSnapshot_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "Fixture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
