import { randomUUID } from "node:crypto";

import { ConfigError, Effect, Schema } from "effect";

import {
  createDropboxFolder,
  dropboxRootPath,
  listDropboxSubfolders,
  moveDropboxFolder,
} from "@/effects/dropbox";
import {
  accessiblePiece,
  assertProjectAccess,
  piecesSortOrder,
  saveProjectHeaderEffect,
  savePieceEffect,
} from "@/effects/projects";
import { getActiveSession } from "@/effects/auth";
import {
  DROPBOX_SYNC_FAILED_MESSAGE,
  PROJECT_SECTIONS,
} from "@/constants/dropbox";
import {
  NEW_PROJECT_STAGE,
  PROJECT_CREATED_MESSAGE,
} from "@/constants/projects";
import type { PrismaService } from "@/generated/effect-prisma";
import {
  choosePieceFolder,
  chooseProjectFolder,
  joinDropboxPath,
  pieceSectionFolders,
  renumberedFolder,
  uniqueFolderName,
} from "@/lib/dropbox";
import { nextSortOrder, pieceCopyName } from "@/lib/projects";
import { Forbidden } from "@/schemas/auth.schemas";
import { DropboxError } from "@/schemas/dropbox.schemas";
import {
  FileSectionIdSchema,
  FileSectionNameSchema,
  PieceIdSchema,
  type PieceFormData,
  type PieceFormState,
  type ProjectCreateFormData,
  type ProjectCreateFormState,
  type ProjectHeaderFormData,
  type ProjectHeaderFormState,
} from "@/schemas/projects.schemas";

const sameFolder = (a: string, b: string) =>
  a.toLowerCase() === b.toLowerCase();

export const bestEffortDropbox = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
): Effect.Effect<
  A | null,
  Exclude<E, DropboxError | ConfigError.ConfigError>,
  R
> =>
  effect.pipe(
    Effect.catchIf(
      (error): error is Extract<E, DropboxError | ConfigError.ConfigError> =>
        error instanceof DropboxError || ConfigError.isConfigError(error),
      (error) =>
        Effect.logWarning(DROPBOX_SYNC_FAILED_MESSAGE, error).pipe(
          Effect.as(null),
        ),
    ),
  ) as Effect.Effect<
    A | null,
    Exclude<E, DropboxError | ConfigError.ConfigError>,
    R
  >;

const ensureProjectSections = Effect.fn("ensureProjectSections")(function* (
  prisma: PrismaService,
  projectId: string,
  projectDropboxPath: string,
) {
  const known = (yield* prisma.projectFileSection.findMany({
    where: { projectId, pieceId: null, isCustom: false },
    select: { dropboxFolder: true },
  })).map(({ dropboxFolder }) => dropboxFolder);
  for (const [sortOrder, { name, folder }] of PROJECT_SECTIONS.entries()) {
    yield* createDropboxFolder(joinDropboxPath(projectDropboxPath, folder));
    if (!known.includes(folder)) {
      yield* prisma.projectFileSection.create({
        data: { projectId, name, dropboxFolder: folder, sortOrder },
      });
    }
  }
});

export const syncProjectFolders = Effect.fn("syncProjectFolders")(function* (
  prisma: PrismaService,
  projectId: string,
) {
  yield* Effect.annotateLogsScoped({ projectId });
  const project = yield* prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true, dropboxFolder: true },
  });
  if (!project) {
    return yield* new Forbidden({ projectId });
  }
  const root = yield* dropboxRootPath;
  const existing = yield* listDropboxSubfolders(root);
  const claimed = (yield* prisma.project.findMany({
    where: { id: { not: projectId }, dropboxFolder: { not: null } },
    select: { dropboxFolder: true },
  })).flatMap(({ dropboxFolder }) => (dropboxFolder ? [dropboxFolder] : []));
  const current = project.dropboxFolder;
  let folder = current ?? chooseProjectFolder(project.name, existing, claimed);
  if (current && project.name) {
    const wanted = uniqueFolderName(
      project.name,
      [...existing, ...claimed].filter((other) => !sameFolder(other, current)),
    );
    if (!sameFolder(wanted, current) && existing.includes(current)) {
      yield* moveDropboxFolder(
        joinDropboxPath(root, current),
        joinDropboxPath(root, wanted),
      );
      folder = wanted;
    }
  }
  const path = joinDropboxPath(root, folder);
  yield* createDropboxFolder(path);
  if (folder !== current) {
    yield* prisma.project.update({
      where: { id: projectId },
      data: { dropboxFolder: folder },
    });
  }
  yield* ensureProjectSections(prisma, projectId, path);
  return { folder, path };
});

export const syncPieceFolders = Effect.fn("syncPieceFolders")(function* (
  prisma: PrismaService,
  pieceId: number,
) {
  yield* Effect.annotateLogsScoped({ pieceId });
  const piece = yield* prisma.projectPiece.findUnique({
    where: { id: pieceId },
    select: { projectId: true, type: true, dropboxFolder: true },
  });
  if (!piece) {
    return yield* new Forbidden({});
  }
  const project = yield* syncProjectFolders(prisma, piece.projectId);
  const existing = yield* listDropboxSubfolders(project.path);
  const claimed = (yield* prisma.projectPiece.findMany({
    where: {
      projectId: piece.projectId,
      id: { not: pieceId },
      dropboxFolder: { not: null },
    },
    select: { dropboxFolder: true },
  })).flatMap(({ dropboxFolder }) => (dropboxFolder ? [dropboxFolder] : []));
  const current = piece.dropboxFolder;
  let folder = current ?? choosePieceFolder(piece.type, existing, claimed);
  if (current) {
    const wanted = uniqueFolderName(
      renumberedFolder(current, piece.type),
      [...existing, ...claimed].filter((other) => !sameFolder(other, current)),
    );
    if (!sameFolder(wanted, current) && existing.includes(current)) {
      yield* moveDropboxFolder(
        joinDropboxPath(project.path, current),
        joinDropboxPath(project.path, wanted),
      );
      folder = wanted;
    }
  }
  const path = joinDropboxPath(project.path, folder);
  yield* createDropboxFolder(path);
  if (folder !== current) {
    yield* prisma.projectPiece.update({
      where: { id: pieceId },
      data: { dropboxFolder: folder },
    });
  }
  const known = (yield* prisma.projectFileSection.findMany({
    where: { pieceId, isCustom: false },
    select: { dropboxFolder: true },
  })).map(({ dropboxFolder }) => dropboxFolder);
  for (const [
    sortOrder,
    { name, folder: sectionFolder },
  ] of pieceSectionFolders().entries()) {
    yield* createDropboxFolder(joinDropboxPath(path, sectionFolder));
    if (!known.includes(sectionFolder)) {
      yield* prisma.projectFileSection.create({
        data: {
          projectId: piece.projectId,
          pieceId,
          name,
          dropboxFolder: sectionFolder,
          sortOrder,
        },
      });
    }
  }
  return { folder, path };
});

export const ensurePieceFoldersEffect = Effect.fn("ensurePieceFolders")(
  function* (prisma: PrismaService, pieceId: unknown) {
    const piece = yield* accessiblePiece(prisma, pieceId);
    yield* syncPieceFolders(prisma, piece.id);
  },
);

export const createProjectEffect = Effect.fn("createProject")(function* (
  prisma: PrismaService,
  _formState: ProjectCreateFormState,
  { name }: ProjectCreateFormData,
) {
  const id = randomUUID();
  yield* Effect.annotateLogsScoped({ projectId: id });
  yield* prisma.project.create({
    data: { id, name, isManual: true, stage: NEW_PROJECT_STAGE },
    select: { id: true },
  });
  yield* bestEffortDropbox(syncProjectFolders(prisma, id));
  return { message: PROJECT_CREATED_MESSAGE, projectId: id };
});

const accessibleSection = Effect.fn("accessibleSection")(function* (
  prisma: PrismaService,
  sectionId: unknown,
) {
  const id = yield* Schema.decodeUnknown(FileSectionIdSchema)(sectionId);
  yield* Effect.annotateLogsScoped({ sectionId: id });
  const section = yield* prisma.projectFileSection.findUnique({
    where: { id },
    select: {
      id: true,
      projectId: true,
      pieceId: true,
      name: true,
      dropboxFolder: true,
      isCustom: true,
      isDeleted: true,
    },
  });
  if (!section) {
    return yield* new Forbidden({});
  }
  yield* assertProjectAccess(prisma, section.projectId);
  return section;
});

const sectionParentPath = Effect.fn("sectionParentPath")(function* (
  prisma: PrismaService,
  projectId: string,
  pieceId: number | null,
) {
  if (pieceId === null) {
    return (yield* syncProjectFolders(prisma, projectId)).path;
  }
  return (yield* syncPieceFolders(prisma, pieceId)).path;
});

export const addFileSectionEffect = Effect.fn("addFileSection")(function* (
  prisma: PrismaService,
  projectId: string,
  pieceId: unknown,
  name: unknown,
) {
  yield* assertProjectAccess(prisma, projectId);
  const parsedName = yield* Schema.decodeUnknown(FileSectionNameSchema)(name);
  const parsedPieceId = yield* Schema.decodeUnknown(
    Schema.NullOr(PieceIdSchema),
  )(pieceId);
  if (parsedPieceId !== null) {
    const piece = yield* accessiblePiece(prisma, parsedPieceId);
    if (piece.projectId !== projectId) {
      return yield* new Forbidden({ projectId });
    }
  }
  const parent = yield* sectionParentPath(prisma, projectId, parsedPieceId);
  const folder = uniqueFolderName(
    parsedName,
    yield* listDropboxSubfolders(parent),
  );
  yield* createDropboxFolder(joinDropboxPath(parent, folder));
  const siblings = yield* prisma.projectFileSection.findMany({
    where: { projectId, pieceId: parsedPieceId },
    select: { sortOrder: true },
  });
  yield* prisma.projectFileSection.create({
    data: {
      projectId,
      pieceId: parsedPieceId,
      name: parsedName,
      dropboxFolder: folder,
      isCustom: true,
      sortOrder: nextSortOrder(siblings),
    },
  });
});

export const renameFileSectionEffect = Effect.fn("renameFileSection")(
  function* (prisma: PrismaService, sectionId: unknown, name: unknown) {
    const section = yield* accessibleSection(prisma, sectionId);
    if (!section.isCustom) {
      return yield* new Forbidden({ projectId: section.projectId });
    }
    const parsedName = yield* Schema.decodeUnknown(FileSectionNameSchema)(name);
    const current = section.dropboxFolder;
    const parent = yield* sectionParentPath(
      prisma,
      section.projectId,
      section.pieceId,
    );
    let folder = current;
    if (current) {
      const existing = yield* listDropboxSubfolders(parent);
      const wanted = uniqueFolderName(
        parsedName,
        existing.filter((other) => !sameFolder(other, current)),
      );
      if (!sameFolder(wanted, current) && existing.includes(current)) {
        yield* moveDropboxFolder(
          joinDropboxPath(parent, current),
          joinDropboxPath(parent, wanted),
        );
        folder = wanted;
      }
    }
    yield* prisma.projectFileSection.update({
      where: { id: section.id },
      data: { name: parsedName, dropboxFolder: folder },
    });
  },
);

export const deleteFileSectionEffect = Effect.fn("deleteFileSection")(
  function* (prisma: PrismaService, sectionId: unknown) {
    const section = yield* accessibleSection(prisma, sectionId);
    if (!section.isCustom) {
      return yield* new Forbidden({ projectId: section.projectId });
    }
    const session = yield* getActiveSession();
    yield* prisma.projectFileSection.update({
      where: { id: section.id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: session.userId,
      },
    });
  },
);

export const restoreFileSectionEffect = Effect.fn("restoreFileSection")(
  function* (prisma: PrismaService, sectionId: unknown) {
    const section = yield* accessibleSection(prisma, sectionId);
    if (!section.isDeleted) {
      return;
    }
    yield* prisma.projectFileSection.update({
      where: { id: section.id },
      data: { isDeleted: false, deletedAt: null, deletedBy: null },
    });
  },
);

export const savePieceWithFoldersEffect = Effect.fn("savePiece")(function* (
  prisma: PrismaService,
  formState: PieceFormState,
  form: PieceFormData,
) {
  const before =
    form.id === undefined
      ? null
      : yield* prisma.projectPiece.findUnique({
          where: { id: form.id },
          select: { type: true, dropboxFolder: true },
        });
  const state = yield* savePieceEffect(prisma, formState, form);
  if (state?.errors || state?.pieceId === undefined) {
    return state;
  }
  const needsSync =
    !before || !before.dropboxFolder || before.type !== form.type;
  if (needsSync) {
    yield* bestEffortDropbox(syncPieceFolders(prisma, state.pieceId));
  }
  return state;
});

export const saveProjectHeaderWithFoldersEffect = Effect.fn(
  "saveProjectHeader",
)(function* (
  prisma: PrismaService,
  formState: ProjectHeaderFormState,
  form: ProjectHeaderFormData,
) {
  const before = yield* prisma.project.findUnique({
    where: { id: form.projectId },
    select: { name: true, isManual: true },
  });
  const state = yield* saveProjectHeaderEffect(prisma, formState, form);
  if (before?.isManual && before.name !== form.name) {
    yield* bestEffortDropbox(syncProjectFolders(prisma, form.projectId));
  }
  return state;
});

export const duplicatePieceEffect = Effect.fn("duplicatePiece")(function* (
  prisma: PrismaService,
  pieceId: unknown,
) {
  const { id } = yield* accessiblePiece(prisma, pieceId);
  const source = yield* prisma.projectPiece.findUnique({
    where: { id },
    select: {
      projectId: true,
      phaseId: true,
      type: true,
      description: true,
      caissonMaterial: true,
      cladding: true,
      countertop: true,
      drawers: true,
      finish: true,
      cabinetCount: true,
    },
  });
  if (!source) {
    return yield* new Forbidden({});
  }
  const copy = yield* prisma.projectPiece.create({
    data: {
      ...source,
      type: pieceCopyName(source.type),
      sortOrder: yield* piecesSortOrder(
        prisma,
        source.projectId,
        source.phaseId,
      ),
    },
    select: { id: true },
  });
  yield* Effect.annotateLogsScoped({ createdPieceId: copy.id });
  yield* bestEffortDropbox(syncPieceFolders(prisma, copy.id));
});
