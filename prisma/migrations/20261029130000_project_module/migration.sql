-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "isManual" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "submissionPrice" DROP NOT NULL;

-- AlterTable
ALTER TABLE "projectContacts" ADD COLUMN     "address" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "projectPhases" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "projectPieces" ADD COLUMN     "countertop" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "coverPath" TEXT,
ADD COLUMN     "coverX" DOUBLE PRECISION NOT NULL DEFAULT 50,
ADD COLUMN     "coverY" DOUBLE PRECISION NOT NULL DEFAULT 50,
ADD COLUMN     "coverZoom" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT,
ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "projectNotes" ADD COLUMN     "pieceId" INTEGER;

-- CreateTable
CREATE TABLE "projectFileSections" (
    "id" SERIAL NOT NULL,
    "projectId" TEXT NOT NULL,
    "pieceId" INTEGER,
    "name" TEXT NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projectFileSections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projectFileSections_projectId_idx" ON "projectFileSections"("projectId");

-- CreateIndex
CREATE INDEX "projectFileSections_pieceId_idx" ON "projectFileSections"("pieceId");

-- CreateIndex
CREATE INDEX "projectNotes_pieceId_idx" ON "projectNotes"("pieceId");

-- AddForeignKey
ALTER TABLE "projectNotes" ADD CONSTRAINT "projectNotes_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "projectPieces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projectFileSections" ADD CONSTRAINT "projectFileSections_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projectFileSections" ADD CONSTRAINT "projectFileSections_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "projectPieces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
