-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CalendarEventType" ADD VALUE 'divers';
ALTER TYPE "CalendarEventType" ADD VALUE 'personnel';

-- AlterTable
ALTER TABLE "calendarEvents" ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "subcategory" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "calendarEvents_ownerId_idx" ON "calendarEvents"("ownerId");

-- AddForeignKey
ALTER TABLE "calendarEvents" ADD CONSTRAINT "calendarEvents_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
