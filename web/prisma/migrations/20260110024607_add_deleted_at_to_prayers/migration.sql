-- AlterTable
ALTER TABLE "PrayerRequest" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "PrayerRequest_deletedAt_idx" ON "PrayerRequest"("deletedAt");
