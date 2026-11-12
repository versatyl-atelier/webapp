-- AlterEnum
ALTER TYPE "ProjectType" ADD VALUE 'jobine';

-- AlterTable
ALTER TABLE "timeEntryProjects" ADD COLUMN "jobineId" INTEGER;

-- CreateTable
CREATE TABLE "jobines" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "color" TEXT NOT NULL DEFAULT '#C9850C',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "timeEntryProjects_jobineId_idx" ON "timeEntryProjects"("jobineId");

-- AddForeignKey
ALTER TABLE "timeEntryProjects" ADD CONSTRAINT "timeEntryProjects_jobineId_fkey" FOREIGN KEY ("jobineId") REFERENCES "jobines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
