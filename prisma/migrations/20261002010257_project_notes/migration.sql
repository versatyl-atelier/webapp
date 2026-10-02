-- CreateTable
CREATE TABLE "projectNotes" (
    "id" SERIAL NOT NULL,
    "projectId" TEXT NOT NULL,
    "phaseId" INTEGER,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projectNotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projectNoteVersions" (
    "id" SERIAL NOT NULL,
    "noteId" INTEGER NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "stage" "ProjectStage",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projectNoteVersions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projectNotes_projectId_idx" ON "projectNotes"("projectId");

-- CreateIndex
CREATE INDEX "projectNotes_phaseId_idx" ON "projectNotes"("phaseId");

-- CreateIndex
CREATE INDEX "projectNoteVersions_noteId_idx" ON "projectNoteVersions"("noteId");

-- AddForeignKey
ALTER TABLE "projectNotes" ADD CONSTRAINT "projectNotes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projectNotes" ADD CONSTRAINT "projectNotes_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "projectPhases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projectNoteVersions" ADD CONSTRAINT "projectNoteVersions_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "projectNotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projectNoteVersions" ADD CONSTRAINT "projectNoteVersions_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
