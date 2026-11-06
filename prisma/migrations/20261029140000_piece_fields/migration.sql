-- AlterTable
ALTER TABLE "projectPieces"
ALTER COLUMN "cladding" DROP DEFAULT,
ALTER COLUMN "cladding" TYPE TEXT[] USING CASE WHEN "cladding" = '' THEN ARRAY[]::TEXT[] ELSE ARRAY["cladding"] END,
ALTER COLUMN "cladding" SET DEFAULT ARRAY[]::TEXT[],
DROP COLUMN "doors",
DROP COLUMN "hardware";
