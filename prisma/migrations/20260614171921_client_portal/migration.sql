-- CreateEnum
CREATE TYPE "VesselImageSource" AS ENUM ('STOCK', 'OPERATOR', 'WIKIMEDIA', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "AppRole" AS ENUM ('BROKER', 'CLIENT');

-- AlterTable
ALTER TABLE "AppUser" ADD COLUMN     "chartererId" TEXT,
ADD COLUMN     "role" "AppRole" NOT NULL DEFAULT 'BROKER';

-- AlterTable
ALTER TABLE "Vessel" ADD COLUMN     "imageCredit" TEXT,
ADD COLUMN     "imageSource" "VesselImageSource" NOT NULL DEFAULT 'STOCK',
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "AppUser_chartererId_idx" ON "AppUser"("chartererId");

-- AddForeignKey
ALTER TABLE "AppUser" ADD CONSTRAINT "AppUser_chartererId_fkey" FOREIGN KEY ("chartererId") REFERENCES "Charterer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
