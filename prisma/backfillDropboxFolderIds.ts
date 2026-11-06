import "dotenv/config";

import { Effect } from "effect";

import { dropboxRootPath, getDropboxMetadata } from "@/effects/dropbox";
import { joinDropboxPath } from "@/lib/dropbox";
import prisma from "@/lib/prisma";

type FolderRow = {
  dropboxFolder: string | null;
  dropboxFolderId: string | null;
};

const idAt = (path: string) =>
  getDropboxMetadata(path).pipe(
    Effect.map(({ id }) => id),
    Effect.catchAll(() => Effect.succeed(null)),
  );

const backfill = Effect.gen(function* () {
  const root = yield* dropboxRootPath;
  const projects = yield* Effect.promise(() =>
    prisma.project.findMany({
      where: { isManual: true, dropboxFolder: { not: null } },
      select: {
        id: true,
        dropboxFolder: true,
        dropboxFolderId: true,
        pieces: {
          select: { id: true, dropboxFolder: true, dropboxFolderId: true },
        },
        fileSections: {
          select: {
            id: true,
            pieceId: true,
            dropboxFolder: true,
            dropboxFolderId: true,
          },
        },
      },
    }),
  );
  const needsId = (row: FolderRow) =>
    row.dropboxFolder !== null && row.dropboxFolderId === null;
  let updated = 0;
  let notFound = 0;
  const record = (id: string | null) => {
    if (id === null) {
      notFound += 1;
    } else {
      updated += 1;
    }
  };

  for (const project of projects) {
    if (!project.dropboxFolder) {
      continue;
    }
    const projectPath = joinDropboxPath(root, project.dropboxFolder);
    if (needsId(project)) {
      const id = yield* idAt(projectPath);
      record(id);
      if (id) {
        yield* Effect.promise(() =>
          prisma.project.update({
            where: { id: project.id },
            data: { dropboxFolderId: id },
          }),
        );
      }
    }
    const piecePaths = new Map<number, string>();
    for (const piece of project.pieces) {
      if (!piece.dropboxFolder) {
        continue;
      }
      const piecePath = joinDropboxPath(projectPath, piece.dropboxFolder);
      piecePaths.set(piece.id, piecePath);
      if (needsId(piece)) {
        const id = yield* idAt(piecePath);
        record(id);
        if (id) {
          yield* Effect.promise(() =>
            prisma.projectPiece.update({
              where: { id: piece.id },
              data: { dropboxFolderId: id },
            }),
          );
        }
      }
    }
    for (const section of project.fileSections) {
      const parent =
        section.pieceId === null
          ? projectPath
          : piecePaths.get(section.pieceId);
      if (!parent || !section.dropboxFolder || !needsId(section)) {
        continue;
      }
      const id = yield* idAt(joinDropboxPath(parent, section.dropboxFolder));
      record(id);
      if (id) {
        yield* Effect.promise(() =>
          prisma.projectFileSection.update({
            where: { id: section.id },
            data: { dropboxFolderId: id },
          }),
        );
      }
    }
  }
  console.log(
    `Folder ids filled: ${updated}, not found in Dropbox: ${notFound}`,
  );
});

Effect.runPromise(Effect.scoped(backfill))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
