-- CreateTable
CREATE TABLE "AppUser" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "brokerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppUser_externalId_key" ON "AppUser"("externalId");

-- CreateIndex
CREATE INDEX "AppUser_brokerId_idx" ON "AppUser"("brokerId");

-- AddForeignKey
ALTER TABLE "AppUser" ADD CONSTRAINT "AppUser_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker"("id") ON DELETE SET NULL ON UPDATE CASCADE;
