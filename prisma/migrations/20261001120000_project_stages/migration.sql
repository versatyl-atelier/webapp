-- CreateEnum
CREATE TYPE "ProjectStage" AS ENUM ('venteDesign', 'planification', 'programmation', 'production', 'finition', 'livraison', 'installation', 'termine');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "stage" "ProjectStage";

-- AlterTable
ALTER TABLE "calendarEvents" ADD COLUMN     "projectId" TEXT;

-- CreateTable
CREATE TABLE "statutStagePermissions" (
    "statutId" TEXT NOT NULL,
    "stage" "ProjectStage" NOT NULL,

    CONSTRAINT "statutStagePermissions_pkey" PRIMARY KEY ("statutId","stage")
);

-- MigrateData: Trello sources become project stages
CREATE TEMPORARY TABLE "sourceStages" ("sourceId" TEXT PRIMARY KEY, "stage" "ProjectStage" NOT NULL);
INSERT INTO "sourceStages" ("sourceId", "stage") VALUES
    ('cli', 'venteDesign'),
    ('pla', 'planification'),
    ('sho', 'production');

UPDATE "projects" AS p
SET "stage" = s."stage"
FROM "sourceStages" AS s
WHERE p."sourceId" = s."sourceId";

INSERT INTO "statutStagePermissions" ("statutId", "stage")
SELECT DISTINCT ssp."statutId", s."stage"
FROM "statutSourcePermissions" AS ssp
JOIN "sourceStages" AS s ON s."sourceId" = ssp."sourceId";

-- MigrateData: link Trello calendar events to the project of the same Trello card
UPDATE "calendarEvents" AS e
SET "projectId" = p."id"
FROM "projects" AS p
WHERE e."trelloCardId" = p."id";

DROP TABLE "sourceStages";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_sourceId_fkey";

-- DropForeignKey
ALTER TABLE "statutSourcePermissions" DROP CONSTRAINT "statutSourcePermissions_sourceId_fkey";

-- DropForeignKey
ALTER TABLE "statutSourcePermissions" DROP CONSTRAINT "statutSourcePermissions_statutId_fkey";

-- DropForeignKey
ALTER TABLE "trelloImports" DROP CONSTRAINT "trelloImports_sourceId_fkey";

-- DropIndex
DROP INDEX "projects_sourceId_idx";

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "sourceId";

-- DropTable
DROP TABLE "statutSourcePermissions";

-- DropTable
DROP TABLE "trelloImports";

-- DropTable
DROP TABLE "trelloSources";

-- CreateIndex
CREATE INDEX "statutStagePermissions_stage_idx" ON "statutStagePermissions"("stage");

-- CreateIndex
CREATE INDEX "calendarEvents_projectId_idx" ON "calendarEvents"("projectId");

-- CreateIndex
CREATE INDEX "projects_stage_idx" ON "projects"("stage");

-- AddForeignKey
ALTER TABLE "statutStagePermissions" ADD CONSTRAINT "statutStagePermissions_statutId_fkey" FOREIGN KEY ("statutId") REFERENCES "statuts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendarEvents" ADD CONSTRAINT "calendarEvents_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
