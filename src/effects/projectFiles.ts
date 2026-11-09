import { Effect, Schema } from "effect";

import {
  DROPBOX_FILE_TAG,
  DROPBOX_MAX_UPLOAD_BYTES,
  DROPBOX_NOT_FOUND_PREFIX,
  FILE_THUMBNAIL_SIZES,
  FILE_TOO_LARGE_MESSAGE,
} from "@/constants/dropbox";
import {
  createDropboxUploadLink,
  deleteDropboxPath,
  dropboxTemporaryLink,
  getDropboxMetadata,
  getDropboxThumbnail,
  listDropboxFolder,
  resolveDropboxFolder,
  restoreDropboxFile,
} from "@/effects/dropbox";
import { accessibleSection } from "@/effects/projectFolders";
import { assertProjectAccess } from "@/effects/projects";
import type { PrismaService } from "@/generated/effect-prisma";
import {
  hasThumbnail,
  isWithinDropboxPath,
  joinDropboxPath,
  parseSubpath,
  uniqueFileName,
} from "@/lib/dropbox";
import { sortSectionFiles, toSectionFile } from "@/lib/projectFiles";
import { Forbidden } from "@/schemas/auth.schemas";
import { DropboxError } from "@/schemas/dropbox.schemas";
import {
  DropboxFileIdSchema,
  FileNameSchema,
  FileSizeSchema,
  ProjectIdSchema,
} from "@/schemas/projects.schemas";

const projectRoot = Effect.fn("projectRoot")(function* (
  prisma: PrismaService,
  projectId: string,
) {
  const project = yield* prisma.project.findUnique({
    where: { id: projectId },
    select: { dropboxFolderId: true },
  });
  if (!project?.dropboxFolderId) {
    return yield* new Forbidden({ projectId });
  }
  return (yield* resolveDropboxFolder(project.dropboxFolderId)).path_lower;
});

const assertFileInProject = Effect.fn("assertFileInProject")(function* (
  prisma: PrismaService,
  projectId: unknown,
  fileId: unknown,
) {
  const project = yield* Schema.decodeUnknown(ProjectIdSchema)(projectId);
  yield* assertProjectAccess(prisma, project);
  const id = yield* Schema.decodeUnknown(DropboxFileIdSchema)(fileId);
  yield* Effect.annotateLogsScoped({ projectId: project, dropboxFileId: id });
  const metadata = yield* getDropboxMetadata(id);
  const root = yield* projectRoot(prisma, project);
  if (!isWithinDropboxPath(metadata.path_lower, root)) {
    return yield* new Forbidden({ projectId: project });
  }
  return { metadata, projectId: project };
});

const sectionDirectory = Effect.fn("sectionDirectory")(function* (
  section: {
    projectId: string;
    dropboxFolderId: string | null;
  },
  subpath: unknown,
) {
  if (!section.dropboxFolderId) {
    return yield* new Forbidden({ projectId: section.projectId });
  }
  const segments = parseSubpath(
    yield* Schema.decodeUnknown(Schema.NullishOr(Schema.String))(subpath),
  );
  if (!segments) {
    return yield* new Forbidden({ projectId: section.projectId });
  }
  const folder = yield* resolveDropboxFolder(section.dropboxFolderId);
  return joinDropboxPath(folder.path_display, ...segments);
});

export const listSectionFilesEffect = Effect.fn("listSectionFiles")(function* (
  prisma: PrismaService,
  sectionId: unknown,
  subpath: unknown,
) {
  const section = yield* accessibleSection(prisma, sectionId);
  const directory = yield* sectionDirectory(section, subpath);
  const entries = yield* listDropboxFolder(directory).pipe(
    Effect.catchIf(
      (error) =>
        error instanceof DropboxError &&
        (error.summary?.startsWith(DROPBOX_NOT_FOUND_PREFIX) ?? false),
      () => Effect.succeed([]),
    ),
  );
  const files = sortSectionFiles(entries.map(toSectionFile));
  yield* Effect.annotateLogsScoped({ sectionFiles: files.length });
  return files;
});

export const createUploadEffect = Effect.fn("createUpload")(function* (
  prisma: PrismaService,
  sectionId: unknown,
  subpath: unknown,
  fileName: unknown,
  fileSize: unknown,
) {
  const section = yield* accessibleSection(prisma, sectionId);
  const name = yield* Schema.decodeUnknown(FileNameSchema)(fileName);
  const size = yield* Schema.decodeUnknown(FileSizeSchema)(fileSize);
  if (size > DROPBOX_MAX_UPLOAD_BYTES) {
    return { errors: { dataValidation: FILE_TOO_LARGE_MESSAGE } };
  }
  const directory = yield* sectionDirectory(section, subpath);
  const existing = yield* listDropboxFolder(directory);
  const finalName = uniqueFileName(
    name,
    existing.map((entry) => entry.name),
  );
  const path = joinDropboxPath(directory, finalName);
  const link = yield* createDropboxUploadLink(path);
  yield* Effect.annotateLogsScoped({
    projectId: section.projectId,
    sectionId: section.id,
    uploadPath: path,
    uploadSize: size,
  });
  return { link, name: finalName };
});

export const finalizeUploadEffect = Effect.fn("finalizeUpload")(function* (
  prisma: PrismaService,
  sectionId: unknown,
  subpath: unknown,
  fileName: unknown,
) {
  const section = yield* accessibleSection(prisma, sectionId);
  const name = yield* Schema.decodeUnknown(FileNameSchema)(fileName);
  const directory = yield* sectionDirectory(section, subpath);
  const metadata = yield* getDropboxMetadata(joinDropboxPath(directory, name));
  yield* Effect.annotateLogsScoped({
    projectId: section.projectId,
    sectionId: section.id,
    uploadedFileId: metadata.id,
    uploadedSize: metadata.size,
  });
  return toSectionFile(metadata);
});

export const deleteFileEffect = Effect.fn("deleteFile")(function* (
  prisma: PrismaService,
  projectId: unknown,
  fileId: unknown,
) {
  const { metadata, projectId: project } = yield* assertFileInProject(
    prisma,
    projectId,
    fileId,
  );
  if (metadata[".tag"] !== DROPBOX_FILE_TAG) {
    return yield* new Forbidden({ projectId: project });
  }
  const deleted = yield* deleteDropboxPath(metadata.id);
  return { path: deleted.path_display, rev: deleted.rev ?? "" };
});

export const restoreFileEffect = Effect.fn("restoreFile")(function* (
  prisma: PrismaService,
  projectId: unknown,
  path: unknown,
  rev: unknown,
) {
  const project = yield* Schema.decodeUnknown(ProjectIdSchema)(projectId);
  yield* assertProjectAccess(prisma, project);
  const target = yield* Schema.decodeUnknown(Schema.String)(path);
  const revision = yield* Schema.decodeUnknown(Schema.String)(rev);
  const root = yield* projectRoot(prisma, project);
  if (!isWithinDropboxPath(target, root)) {
    return yield* new Forbidden({ projectId: project });
  }
  yield* Effect.annotateLogsScoped({ restoredPath: target });
  yield* restoreDropboxFile(target, revision);
});

export const getFileLinkEffect = Effect.fn("getFileLink")(function* (
  prisma: PrismaService,
  projectId: unknown,
  fileId: unknown,
) {
  const { metadata } = yield* assertFileInProject(prisma, projectId, fileId);
  return yield* dropboxTemporaryLink(metadata.id);
});

export const getFileThumbnailEffect = Effect.fn("getFileThumbnail")(function* (
  prisma: PrismaService,
  projectId: string,
  fileId: string,
  size: string,
) {
  const { metadata } = yield* assertFileInProject(prisma, projectId, fileId);
  const allowed = FILE_THUMBNAIL_SIZES.find((candidate) => candidate === size);
  if (!allowed || !hasThumbnail(metadata.name)) {
    return null;
  }
  return yield* getDropboxThumbnail(metadata.id, allowed).pipe(
    Effect.catchIf(
      (error) => error instanceof DropboxError,
      (error) =>
        Effect.logWarning("File thumbnail unavailable", error).pipe(
          Effect.as(null),
        ),
    ),
  );
});
