-- AlterTable
ALTER TABLE "projectPieces" RENAME COLUMN "coverPath" TO "coverFileId";

-- CreateTable
CREATE TABLE "projectViews" (
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projectViews_pkey" PRIMARY KEY ("userId","projectId")
);

-- CreateTable
CREATE TABLE "projectPins" (
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projectPins_pkey" PRIMARY KEY ("userId","projectId")
);

-- CreateIndex
CREATE INDEX "projectViews_userId_viewedAt_idx" ON "projectViews"("userId", "viewedAt");

-- CreateIndex
CREATE INDEX "projectPins_userId_sortOrder_idx" ON "projectPins"("userId", "sortOrder");

-- AddForeignKey
ALTER TABLE "projectViews" ADD CONSTRAINT "projectViews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projectViews" ADD CONSTRAINT "projectViews_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projectPins" ADD CONSTRAINT "projectPins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projectPins" ADD CONSTRAINT "projectPins_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
