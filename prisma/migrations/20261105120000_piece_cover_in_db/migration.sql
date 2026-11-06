-- AlterTable
ALTER TABLE "projectPieces" DROP COLUMN "coverFileId",
ADD COLUMN     "coverUpdatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "projectPieceCovers" (
    "pieceId" INTEGER NOT NULL,
    "image" BYTEA NOT NULL,
    "mimeType" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projectPieceCovers_pkey" PRIMARY KEY ("pieceId")
);

-- AddForeignKey
ALTER TABLE "projectPieceCovers" ADD CONSTRAINT "projectPieceCovers_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "projectPieces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
