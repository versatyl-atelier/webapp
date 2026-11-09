-- CreateIndex
CREATE UNIQUE INDEX "projects_dropboxFolderId_key" ON "projects"("dropboxFolderId");

-- CreateIndex
CREATE UNIQUE INDEX "projectPieces_dropboxFolderId_key" ON "projectPieces"("dropboxFolderId");

-- CreateIndex
CREATE UNIQUE INDEX "projectFileSections_dropboxFolderId_key" ON "projectFileSections"("dropboxFolderId");
