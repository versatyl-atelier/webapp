import "dotenv/config";

import prisma from "@/lib/prisma";

const NOT_LINKED = { dropboxFolder: null, dropboxFolderId: null };

async function unlinkNonManualDropbox() {
  const nonManual = { project: { isManual: false } };
  const sections = await prisma.projectFileSection.deleteMany({
    where: nonManual,
  });
  const pieces = await prisma.projectPiece.updateMany({
    where: { ...nonManual, dropboxFolder: { not: null } },
    data: NOT_LINKED,
  });
  const projects = await prisma.project.updateMany({
    where: { isManual: false, dropboxFolder: { not: null } },
    data: NOT_LINKED,
  });
  console.log(
    `Unlinked ${projects.count} projects and ${pieces.count} pieces, removed ${sections.count} sections`,
  );
}

unlinkNonManualDropbox()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
