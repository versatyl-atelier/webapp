-- CreateEnum
CREATE TYPE "CalendarEventType" AS ENUM ('livraison', 'installation', 'manuel');

-- CreateEnum
CREATE TYPE "CalendarEventColor" AS ENUM ('blue', 'teal', 'purple', 'orange', 'pink', 'indigo', 'lime', 'amber');

-- CreateEnum
CREATE TYPE "RecurrenceFrequency" AS ENUM ('daily', 'weekly', 'monthly', 'yearly');

-- CreateEnum
CREATE TYPE "RecurrenceEnd" AS ENUM ('never', 'date', 'count');

-- DropTable
DROP TABLE "calendarSources";

-- CreateTable
CREATE TABLE "calendarEvents" (
    "id" SERIAL NOT NULL,
    "type" "CalendarEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL DEFAULT '',
    "date" DATE NOT NULL,
    "hour" INTEGER NOT NULL,
    "color" "CalendarEventColor" NOT NULL,
    "frequency" "RecurrenceFrequency",
    "interval" INTEGER NOT NULL DEFAULT 1,
    "weekdays" INTEGER[],
    "endType" "RecurrenceEnd" NOT NULL DEFAULT 'never',
    "endDate" DATE,
    "endCount" INTEGER,
    "trelloCardId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendarEvents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "calendarEvents_trelloCardId_key" ON "calendarEvents"("trelloCardId");

-- CreateIndex
CREATE INDEX "calendarEvents_date_idx" ON "calendarEvents"("date");
