-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "dropboxFolderId" TEXT;

-- AlterTable
ALTER TABLE "projectPieces" ADD COLUMN     "dropboxFolderId" TEXT;

-- AlterTable
ALTER TABLE "projectFileSections" ADD COLUMN     "dropboxFolderId" TEXT;
