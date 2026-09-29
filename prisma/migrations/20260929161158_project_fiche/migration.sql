-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "address" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "projectContacts" (
    "id" SERIAL NOT NULL,
    "projectId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL DEFAULT '',
    "company" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projectContacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projectPhases" (
    "id" SERIAL NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projectPhases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projectPieces" (
    "id" SERIAL NOT NULL,
    "projectId" TEXT NOT NULL,
    "phaseId" INTEGER,
    "type" TEXT NOT NULL DEFAULT '',
    "caissonMaterial" TEXT NOT NULL DEFAULT '',
    "cladding" TEXT NOT NULL DEFAULT '',
    "doors" TEXT NOT NULL DEFAULT '',
    "drawers" TEXT NOT NULL DEFAULT '',
    "hardware" TEXT NOT NULL DEFAULT '',
    "finish" TEXT NOT NULL DEFAULT '',
    "cabinetCount" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projectPieces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projectContacts_projectId_idx" ON "projectContacts"("projectId");

-- CreateIndex
CREATE INDEX "projectPhases_projectId_idx" ON "projectPhases"("projectId");

-- CreateIndex
CREATE INDEX "projectPieces_projectId_idx" ON "projectPieces"("projectId");

-- CreateIndex
CREATE INDEX "projectPieces_phaseId_idx" ON "projectPieces"("phaseId");

-- AddForeignKey
ALTER TABLE "projectContacts" ADD CONSTRAINT "projectContacts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projectPhases" ADD CONSTRAINT "projectPhases_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projectPieces" ADD CONSTRAINT "projectPieces_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projectPieces" ADD CONSTRAINT "projectPieces_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "projectPhases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
