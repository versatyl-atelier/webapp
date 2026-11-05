-- CreateEnum
CREATE TYPE "LanceurLogField" AS ENUM ('price', 'pdmDate', 'approvalDate', 'deliveryDate');

-- CreateTable
CREATE TABLE "lanceurLogs" (
    "id" SERIAL NOT NULL,
    "phaseId" INTEGER NOT NULL,
    "field" "LanceurLogField" NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lanceurLogs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lanceurLogs_phaseId_createdAt_idx" ON "lanceurLogs"("phaseId", "createdAt");

-- AddForeignKey
ALTER TABLE "lanceurLogs" ADD CONSTRAINT "lanceurLogs_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "lanceurPhases"("phaseId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lanceurLogs" ADD CONSTRAINT "lanceurLogs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
