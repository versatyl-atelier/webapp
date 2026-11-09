-- CreateEnum
CREATE TYPE "LanceurOptionField" AS ENUM ('etape', 'installateur');

-- AlterTable
ALTER TABLE "employees" ADD COLUMN "color" TEXT NOT NULL DEFAULT '#4A90D9';

-- CreateTable
CREATE TABLE "lanceurPhases" (
    "phaseId" INTEGER NOT NULL,
    "pdmDate" DATE,
    "approvalDate" DATE,
    "deliveryDate" DATE,
    "price" DOUBLE PRECISION,
    "isSigned" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "etape" TEXT NOT NULL DEFAULT '',
    "installateur" TEXT NOT NULL DEFAULT '',
    "deliveryComment" TEXT NOT NULL DEFAULT '',
    "responsibleId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lanceurPhases_pkey" PRIMARY KEY ("phaseId")
);

-- CreateTable
CREATE TABLE "lanceurOptions" (
    "id" SERIAL NOT NULL,
    "field" "LanceurOptionField" NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lanceurOptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lanceurPhases_priority_idx" ON "lanceurPhases"("priority");

-- CreateIndex
CREATE INDEX "lanceurPhases_responsibleId_idx" ON "lanceurPhases"("responsibleId");

-- CreateIndex
CREATE UNIQUE INDEX "lanceurOptions_field_value_key" ON "lanceurOptions"("field", "value");

-- AddForeignKey
ALTER TABLE "lanceurPhases" ADD CONSTRAINT "lanceurPhases_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "projectPhases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lanceurPhases" ADD CONSTRAINT "lanceurPhases_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
