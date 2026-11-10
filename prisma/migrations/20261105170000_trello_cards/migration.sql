-- CreateEnum
CREATE TYPE "TrelloCardRole" AS ENUM ('design', 'planification', 'atelier');

-- CreateEnum
CREATE TYPE "TrelloCardVariant" AS ENUM ('simple', 'caisson', 'finition');

-- CreateEnum
CREATE TYPE "TrelloCardState" AS ENUM ('active', 'hidden', 'archived', 'lost');

-- CreateEnum
CREATE TYPE "TrelloDestinationKey" AS ENUM ('design', 'planification', 'atelierSimple', 'atelierCaisson', 'atelierFinition');

-- AlterTable
ALTER TABLE "projectPieces" ADD COLUMN     "hasCaisson" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "hasFinition" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "trelloDestinations" (
    "key" "TrelloDestinationKey" NOT NULL,
    "boardId" TEXT NOT NULL,
    "boardName" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "listName" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trelloDestinations_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "trelloStageLists" (
    "stage" "ProjectStage" NOT NULL,
    "boardId" TEXT NOT NULL,
    "boardName" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "listName" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trelloStageLists_pkey" PRIMARY KEY ("stage")
);

-- CreateTable
CREATE TABLE "trelloWebhooks" (
    "boardId" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trelloWebhooks_pkey" PRIMARY KEY ("boardId")
);

-- CreateTable
CREATE TABLE "trelloCards" (
    "id" SERIAL NOT NULL,
    "projectId" TEXT NOT NULL,
    "phaseId" INTEGER,
    "pieceId" INTEGER,
    "role" "TrelloCardRole" NOT NULL,
    "variant" "TrelloCardVariant" NOT NULL DEFAULT 'simple',
    "trelloCardId" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "state" "TrelloCardState" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trelloCards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trelloEvents" (
    "id" SERIAL NOT NULL,
    "actionId" TEXT NOT NULL,
    "cardId" INTEGER NOT NULL,
    "trelloCardId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fromBoardId" TEXT,
    "fromListId" TEXT,
    "toBoardId" TEXT,
    "toListId" TEXT,
    "actorName" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trelloEvents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trelloStageLists_listId_key" ON "trelloStageLists"("listId");

-- CreateIndex
CREATE UNIQUE INDEX "trelloWebhooks_webhookId_key" ON "trelloWebhooks"("webhookId");

-- CreateIndex
CREATE UNIQUE INDEX "trelloCards_trelloCardId_key" ON "trelloCards"("trelloCardId");

-- CreateIndex
CREATE INDEX "trelloCards_projectId_idx" ON "trelloCards"("projectId");

-- CreateIndex
CREATE INDEX "trelloCards_phaseId_idx" ON "trelloCards"("phaseId");

-- CreateIndex
CREATE INDEX "trelloCards_pieceId_idx" ON "trelloCards"("pieceId");

-- CreateIndex
CREATE UNIQUE INDEX "trelloEvents_actionId_key" ON "trelloEvents"("actionId");

-- CreateIndex
CREATE INDEX "trelloEvents_cardId_idx" ON "trelloEvents"("cardId");

-- AddForeignKey
ALTER TABLE "trelloCards" ADD CONSTRAINT "trelloCards_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trelloCards" ADD CONSTRAINT "trelloCards_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "projectPhases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trelloCards" ADD CONSTRAINT "trelloCards_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "projectPieces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trelloEvents" ADD CONSTRAINT "trelloEvents_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "trelloCards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

