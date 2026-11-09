import { randomUUID } from "node:crypto";

import { ConfigError, Effect, Schema } from "effect";

import {
  createDropboxFolder,
  dropboxRootPath,
  listDropboxChildFolders,
  listDropboxSubfolders,
  renameDropboxFolder,
  resolveDropboxFolder,
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
import { DROPBOX_SYNC_STATUS } from "@/constants/projectFiles";
import {
  NEW_PROJECT_STAGE,
  PROJECT_CREATED_MESSAGE,
} from "@/constants/projects";
import type { PrismaService } from "@/generated/effect-prisma";
import {
  folderLabel,
  joinDropboxPath,
  newPieceFolder,
  newProjectFolder,
  pieceSectionFolders,
  planFolderAdoption,
  renumberedFolder,
  uniqueFolderName,
} from "@/lib/dropbox";
import { nextSortOrder, pieceCopyName } from "@/lib/projects";
import { Forbidden } from "@/schemas/auth.schemas";
import {
  DropboxError,
  DropboxFolderMissing,
  DropboxNotLinked,
  type DropboxFolder,
} from "@/schemas/dropbox.schemas";
import {
  FileSectionIdSchema,
  FileSectionNameSchema,
  PieceIdSchema,
  ProjectIdSchema,
  type PieceFormData,
  type PieceFormState,
  type ProjectCreateFormData,
  type ProjectCreateFormState,
  type ProjectHeaderFormData,
  type ProjectHeaderFormState,
} from "@/schemas/projects.schemas";

type DropboxSoftError =
  | DropboxError
  | DropboxFolderMissing
  | DropboxNotLinked
  | ConfigError.ConfigError;

const isDropboxSoftError = (error: unknown): error is DropboxSoftError =>
  error instanceof DropboxError ||
  error instanceof DropboxFolderMissing ||
  error instanceof DropboxNotLinked ||
  ConfigError.isConfigError(error);

export const bestEffortDropbox = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
): Effect.Effect<A | null, Exclude<E, DropboxSoftError>, R> =>
  effect.pipe(
    Effect.catchIf(
      (error): error is Extract<E, DropboxSoftError> =>
        isDropboxSoftError(error),
      (error) =>
        Effect.logWarning(DROPBOX_SYNC_FAILED_MESSAGE, error).pipe(
          Effect.as(null),
        ),
    ),
  ) as Effect.Effect<A | null, Exclude<E, DropboxSoftError>, R>;

const sameName = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

const parentOf = (folder: DropboxFolder) =>
  folder.path_display.slice(0, folder.path_display.length - folder.name.length);

const siblingNames = Effect.fn("siblingNames")(function* (
  folder: DropboxFolder,
) {
  const names = yield* listDropboxSubfolders(parentOf(folder));
  return names.filter((name) => !sameName(name, folder.name));
});

const folderIfExists = (folderId: string) =>
  resolveDropboxFolder(folderId).pipe(
    Effect.catchTag("DropboxFolderMissing", () => Effect.succeed(null)),
  );

const linkedProjectFolder = Effect.fn("linkedProjectFolder")(function* (
  prisma: PrismaService,
  projectId: string,
) {
  const project = yield* prisma.project.findUnique({
    where: { id: projectId },
    select: { dropboxFolderId: true },
  });
  if (!project?.dropboxFolderId) {
    return yield* new DropboxNotLinked({ projectId });
  }
  return yield* resolveDropboxFolder(project.dropboxFolderId);
});

const linkedParentFolder = Effect.fn("linkedParentFolder")(function* (
  prisma: PrismaService,
  projectId: string,
  pieceId: number | null,
) {
  if (pieceId === null) {
    return yield* linkedProjectFolder(prisma, projectId);
  }
  const piece = yield* prisma.projectPiece.findUnique({
    where: { id: pieceId },
    select: { dropboxFolderId: true },
  });
  if (!piece?.dropboxFolderId) {
    return yield* new DropboxNotLinked({ projectId });
  }
  return yield* resolveDropboxFolder(piece.dropboxFolderId);
});

const createSectionFolders = Effect.fn("createSectionFolders")(function* (
  prisma: PrismaService,
  parent: DropboxFolder,
  projectId: string,
  pieceId: number | null,
  sections: readonly { name: string; folder: string }[],
) {
  for (const [sortOrder, section] of sections.entries()) {
    const created = yield* createDropboxFolder(
      joinDropboxPath(parent.path_display, section.folder),
    );
    yield* prisma.projectFileSection.create({
      data: {
        projectId,
        pieceId,
        name: section.name,
        dropboxFolder: created.name,
        dropboxFolderId: created.id,
        sortOrder,
      },
    });
  }
});

const createProjectTree = Effect.fn("createProjectTree")(function* (
  prisma: PrismaService,
  projectId: string,
  name: string,
) {
  const root = yield* dropboxRootPath;
  const existing = yield* listDropboxSubfolders(root);
  const folder = yield* createDropboxFolder(
    joinDropboxPath(root, newProjectFolder(name, existing)),
  );
  yield* prisma.project.update({
    where: { id: projectId },
    data: { dropboxFolder: folder.name, dropboxFolderId: folder.id },
  });
  yield* createSectionFolders(
    prisma,
    folder,
    projectId,
    null,
    PROJECT_SECTIONS,
  );
  return folder;
});

const createPieceTree = Effect.fn("createPieceTree")(function* (
  prisma: PrismaService,
  pieceId: number,
) {
  const piece = yield* prisma.projectPiece.findUnique({
    where: { id: pieceId },
    select: { projectId: true, type: true, dropboxFolderId: true },
  });
  if (!piece || piece.dropboxFolderId) {
    return null;
  }
  const parent = yield* linkedProjectFolder(prisma, piece.projectId);
  const existing = yield* listDropboxSubfolders(parent.path_display);
  const folder = yield* createDropboxFolder(
    joinDropboxPath(parent.path_display, newPieceFolder(piece.type, existing)),
  );
  yield* prisma.projectPiece.update({
    where: { id: pieceId },
    data: { dropboxFolder: folder.name, dropboxFolderId: folder.id },
  });
  yield* createSectionFolders(
    prisma,
    folder,
    piece.projectId,
    pieceId,
    pieceSectionFolders(),
  );
  return folder;
});

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
  yield* bestEffortDropbox(createProjectTree(prisma, id, name));
  return { message: PROJECT_CREATED_MESSAGE, projectId: id };
});

export const createProjectFolderEffect = Effect.fn("createProjectFolder")(
  function* (prisma: PrismaService, projectId: unknown) {
    const id = yield* Schema.decodeUnknown(ProjectIdSchema)(projectId);
    yield* assertProjectAccess(prisma, id);
    const project = yield* prisma.project.findUnique({
      where: { id },
      select: { name: true, isManual: true, dropboxFolderId: true },
    });
    if (!project?.isManual || project.dropboxFolderId) {
      return yield* new Forbidden({ projectId: id });
    }
    yield* createProjectTree(prisma, id, project.name);
    const pieces = yield* prisma.projectPiece.findMany({
      where: { projectId: id, isDeleted: false },
      select: { id: true },
    });
    for (const piece of pieces) {
      yield* createPieceTree(prisma, piece.id);
    }
  },
);

export const accessibleSection = Effect.fn("accessibleSection")(function* (
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
      dropboxFolderId: true,
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
  const parent = yield* linkedParentFolder(prisma, projectId, parsedPieceId);
  const existing = yield* listDropboxSubfolders(parent.path_display);
  const folder = yield* createDropboxFolder(
    joinDropboxPath(
      parent.path_display,
      uniqueFolderName(parsedName, existing),
    ),
  );
  const siblings = yield* prisma.projectFileSection.findMany({
    where: { projectId, pieceId: parsedPieceId },
    select: { sortOrder: true },
  });
  yield* prisma.projectFileSection.create({
    data: {
      projectId,
      pieceId: parsedPieceId,
      name: parsedName,
      dropboxFolder: folder.name,
      dropboxFolderId: folder.id,
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
    let folderName = section.dropboxFolder;
    if (section.dropboxFolderId) {
      const current = yield* resolveDropboxFolder(section.dropboxFolderId);
      const wanted = uniqueFolderName(
        renumberedFolder(current.name, parsedName),
        yield* siblingNames(current),
      );
      folderName = (yield* renameDropboxFolder(current.id, wanted)).name;
    }
    yield* prisma.projectFileSection.update({
      where: { id: section.id },
      data: { name: parsedName, dropboxFolder: folderName },
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

const renamePieceFolder = Effect.fn("renamePieceFolder")(function* (
  prisma: PrismaService,
  pieceId: number,
  folderId: string,
  name: string,
) {
  const current = yield* resolveDropboxFolder(folderId);
  const wanted = uniqueFolderName(
    renumberedFolder(current.name, name),
    yield* siblingNames(current),
  );
  const renamed = yield* renameDropboxFolder(current.id, wanted);
  yield* prisma.projectPiece.update({
    where: { id: pieceId },
    data: { dropboxFolder: renamed.name },
  });
});

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
          select: { type: true, dropboxFolderId: true },
        });
  const state = yield* savePieceEffect(prisma, formState, form);
  if (state?.errors || state?.pieceId === undefined) {
    return state;
  }
  const pieceId = state.pieceId;
  if (!before) {
    yield* bestEffortDropbox(createPieceTree(prisma, pieceId));
  } else if (before.dropboxFolderId && before.type !== form.type) {
    yield* bestEffortDropbox(
      renamePieceFolder(prisma, pieceId, before.dropboxFolderId, form.type),
    );
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
    select: { name: true, isManual: true, dropboxFolderId: true },
  });
  const state = yield* saveProjectHeaderEffect(prisma, formState, form);
  if (before?.isManual && before.dropboxFolderId && before.name !== form.name) {
    const folderId = before.dropboxFolderId;
    yield* bestEffortDropbox(
      Effect.gen(function* () {
        const current = yield* resolveDropboxFolder(folderId);
        const renamed = yield* renameDropboxFolder(
          current.id,
          uniqueFolderName(form.name, yield* siblingNames(current)),
        );
        yield* prisma.project.update({
          where: { id: form.projectId },
          data: { dropboxFolder: renamed.name },
        });
      }),
    );
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
  yield* bestEffortDropbox(createPieceTree(prisma, copy.id));
});

const knownFolders = (
  rows: readonly {
    dropboxFolderId: string | null;
    dropboxFolder: string | null;
  }[],
) =>
  new Map(
    rows.flatMap(({ dropboxFolderId, dropboxFolder }) =>
      dropboxFolderId && dropboxFolder
        ? [[dropboxFolderId, dropboxFolder] as const]
        : [],
    ),
  );

const refreshFolderNames = (
  prisma: PrismaService,
  children: readonly { id: string; name: string }[],
) =>
  Effect.forEach(children, (child) =>
    Effect.all([
      prisma.projectFileSection.updateMany({
        where: { dropboxFolderId: child.id },
        data: { dropboxFolder: child.name },
      }),
      prisma.projectPiece.updateMany({
        where: { dropboxFolderId: child.id },
        data: { dropboxFolder: child.name },
      }),
    ]),
  );

const adoptSections = Effect.fn("adoptSections")(function* (
  prisma: PrismaService,
  projectId: string,
  pieceId: number | null,
  parent: DropboxFolder,
) {
  const rows = yield* prisma.projectFileSection.findMany({
    where: { projectId, pieceId },
    select: { dropboxFolderId: true, dropboxFolder: true, sortOrder: true },
  });
  const children = yield* listDropboxChildFolders(parent.path_display);
  const plan = planFolderAdoption(
    children,
    knownFolders(rows),
    pieceId === null ? "project" : "piece",
  );
  yield* refreshFolderNames(prisma, plan.refresh);
  const firstOrder = nextSortOrder(rows);
  for (const [index, section] of plan.sections.entries()) {
    yield* prisma.projectFileSection.create({
      data: {
        projectId,
        pieceId,
        name: section.name,
        dropboxFolder: section.folder,
        dropboxFolderId: section.id,
        isCustom: section.isCustom,
        sortOrder: firstOrder + index,
      },
    });
  }
  return { plan, adopted: plan.sections.length };
});

export const syncFromDropboxEffect = Effect.fn("syncFromDropbox")(function* (
  prisma: PrismaService,
  projectId: unknown,
) {
  const id = yield* Schema.decodeUnknown(ProjectIdSchema)(projectId);
  yield* assertProjectAccess(prisma, id);
  yield* Effect.annotateLogsScoped({ projectId: id });
  const project = yield* prisma.project.findUnique({
    where: { id },
    select: { dropboxFolderId: true, dropboxFolder: true },
  });
  if (!project?.dropboxFolderId) {
    return { status: DROPBOX_SYNC_STATUS.unlinked, adopted: 0 };
  }
  const folder = yield* folderIfExists(project.dropboxFolderId);
  if (!folder) {
    return { status: DROPBOX_SYNC_STATUS.missing, adopted: 0 };
  }
  if (folder.name !== project.dropboxFolder) {
    yield* prisma.project.update({
      where: { id },
      data: { dropboxFolder: folder.name },
    });
  }

  const pieceRows = yield* prisma.projectPiece.findMany({
    where: { projectId: id },
    select: { dropboxFolderId: true, dropboxFolder: true },
  });
  const projectChildren = yield* listDropboxChildFolders(folder.path_display);
  const rootRows = yield* prisma.projectFileSection.findMany({
    where: { projectId: id, pieceId: null },
    select: { dropboxFolderId: true, dropboxFolder: true },
  });
  const plan = planFolderAdoption(
    projectChildren,
    knownFolders([...rootRows, ...pieceRows]),
    "project",
  );
  yield* refreshFolderNames(prisma, plan.refresh);

  const phase = yield* prisma.projectPhase.findFirst({
    where: { projectId: id, isDeleted: false },
    select: { id: true },
    orderBy: { sortOrder: "asc" },
  });
  const phaseId = phase?.id ?? null;
  for (const child of plan.pieces) {
    yield* prisma.projectPiece.create({
      data: {
        projectId: id,
        phaseId,
        type: folderLabel(child.name),
        dropboxFolder: child.name,
        dropboxFolderId: child.id,
        sortOrder: yield* piecesSortOrder(prisma, id, phaseId),
      },
    });
  }
  const rootAdoption = yield* adoptSections(prisma, id, null, folder);

  const pieces = yield* prisma.projectPiece.findMany({
    where: { projectId: id, isDeleted: false, dropboxFolderId: { not: null } },
    select: { id: true, dropboxFolderId: true, dropboxFolder: true },
  });
  let adopted = plan.pieces.length + rootAdoption.adopted;
  const missingPieceIds: number[] = [];
  for (const piece of pieces) {
    const pieceFolder = piece.dropboxFolderId
      ? yield* folderIfExists(piece.dropboxFolderId)
      : null;
    if (!pieceFolder) {
      missingPieceIds.push(piece.id);
      continue;
    }
    if (pieceFolder.name !== piece.dropboxFolder) {
      yield* prisma.projectPiece.update({
        where: { id: piece.id },
        data: { dropboxFolder: pieceFolder.name },
      });
    }
    adopted += (yield* adoptSections(prisma, id, piece.id, pieceFolder))
      .adopted;
  }
  yield* Effect.annotateLogsScoped({ adopted });
  return { status: DROPBOX_SYNC_STATUS.ok, adopted, missingPieceIds };
});

export const unlinkProjectEffect = Effect.fn("unlinkProject")(function* (
  prisma: PrismaService,
  projectId: unknown,
) {
  const id = yield* Schema.decodeUnknown(ProjectIdSchema)(projectId);
  yield* assertProjectAccess(prisma, id);
  const cleared = { dropboxFolder: null, dropboxFolderId: null };
  yield* prisma.projectFileSection.updateMany({
    where: { projectId: id },
    data: cleared,
  });
  yield* prisma.projectPiece.updateMany({
    where: { projectId: id },
    data: cleared,
  });
  yield* prisma.project.update({ where: { id }, data: cleared });
});

export const recreateProjectTreeEffect = Effect.fn("recreateProjectTree")(
  function* (prisma: PrismaService, projectId: unknown) {
    const id = yield* Schema.decodeUnknown(ProjectIdSchema)(projectId);
    yield* assertProjectAccess(prisma, id);
    const project = yield* prisma.project.findUnique({
      where: { id },
      select: { name: true, dropboxFolder: true, dropboxFolderId: true },
    });
    if (!project?.dropboxFolderId) {
      return yield* new DropboxNotLinked({ projectId: id });
    }
    const root = yield* dropboxRootPath;
    const existing = yield* listDropboxSubfolders(root);
    const folder = yield* createDropboxFolder(
      joinDropboxPath(
        root,
        newProjectFolder(project.dropboxFolder ?? project.name, existing),
      ),
    );
    yield* prisma.project.update({
      where: { id },
      data: { dropboxFolder: folder.name, dropboxFolderId: folder.id },
    });
    const sections = yield* prisma.projectFileSection.findMany({
      where: { projectId: id, isDeleted: false },
      select: {
        id: true,
        pieceId: true,
        name: true,
        dropboxFolder: true,
      },
    });
    const pieces = yield* prisma.projectPiece.findMany({
      where: { projectId: id, isDeleted: false },
      select: { id: true, type: true, dropboxFolder: true },
    });
    const pieceFolders = new Map<number, DropboxFolder>();
    for (const piece of pieces) {
      const created = yield* createDropboxFolder(
        joinDropboxPath(
          folder.path_display,
          piece.dropboxFolder ??
            newPieceFolder(
              piece.type,
              yield* listDropboxSubfolders(folder.path_display),
            ),
        ),
      );
      yield* prisma.projectPiece.update({
        where: { id: piece.id },
        data: { dropboxFolder: created.name, dropboxFolderId: created.id },
      });
      pieceFolders.set(piece.id, created);
    }
    for (const section of sections) {
      const parent =
        section.pieceId === null ? folder : pieceFolders.get(section.pieceId);
      if (!parent) {
        continue;
      }
      const created = yield* createDropboxFolder(
        joinDropboxPath(
          parent.path_display,
          section.dropboxFolder ?? section.name,
        ),
      );
      yield* prisma.projectFileSection.update({
        where: { id: section.id },
        data: { dropboxFolder: created.name, dropboxFolderId: created.id },
      });
    }
  },
);

export const recreateSectionFolderEffect = Effect.fn("recreateSectionFolder")(
  function* (prisma: PrismaService, sectionId: unknown) {
    const section = yield* accessibleSection(prisma, sectionId);
    const parent = yield* linkedParentFolder(
      prisma,
      section.projectId,
      section.pieceId,
    );
    const created = yield* createDropboxFolder(
      joinDropboxPath(
        parent.path_display,
        section.dropboxFolder ?? section.name,
      ),
    );
    yield* prisma.projectFileSection.update({
      where: { id: section.id },
      data: { dropboxFolder: created.name, dropboxFolderId: created.id },
    });
  },
);
