-- CreateEnum
CREATE TYPE "SubjectItemStatus" AS ENUM ('PENDING', 'LIFTED', 'WAIVED', 'FAILED');

-- AlterTable: Charterer contact fields (additive, nullable — backward compatible)
ALTER TABLE "Charterer" ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT;

-- AlterTable: SubjectItem.status String -> SubjectItemStatus
-- Non-destructive: cast existing values via USING (all seeded values are valid enum labels).
ALTER TABLE "SubjectItem" ALTER COLUMN "status" TYPE "SubjectItemStatus" USING ("status"::"SubjectItemStatus"),
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- CreateTable: FixtureStatusChange (append-only audit trail)
CREATE TABLE "FixtureStatusChange" (
    "id" TEXT NOT NULL,
    "fixtureId" TEXT NOT NULL,
    "fromStatus" "FixtureStatus" NOT NULL,
    "toStatus" "FixtureStatus" NOT NULL,
    "actor" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FixtureStatusChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FixtureStatusChange_fixtureId_createdAt_idx" ON "FixtureStatusChange"("fixtureId", "createdAt");

-- AddForeignKey
ALTER TABLE "FixtureStatusChange" ADD CONSTRAINT "FixtureStatusChange_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "Fixture"("id") ON DELETE CASCADE ON UPDATE CASCADE;
