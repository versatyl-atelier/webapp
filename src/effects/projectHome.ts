import { Effect, Schema } from "effect";

import { getActiveSession } from "@/effects/auth";
import { getDropboxThumbnail } from "@/effects/dropbox";
import {
  accessibleProjectsWhere,
  assertProjectAccess,
} from "@/effects/projects";
import { HOME_RECENT_LIMIT } from "@/constants/projectHome";
import type { PrismaService } from "@/generated/effect-prisma";
import type { ProjectSelect } from "@/generated/prisma/models";
import { SortOrder } from "@/generated/prisma/internal/prismaNamespace";
import { mergePinOrder, type HomeProject } from "@/lib/projectHome";
import { DropboxError } from "@/schemas/dropbox.schemas";
import { ProjectIdSchema, ProjectIdsSchema } from "@/schemas/projects.schemas";

const homeProjectSelect = {
  id: true,
  name: true,
  color: true,
  stage: true,
  address: true,
  pieces: {
    where: { isDeleted: false, coverFileId: { not: null } },
    select: { coverFileId: true },
    orderBy: [{ sortOrder: SortOrder.asc }, { id: SortOrder.asc }],
    take: 1,
  },
} satisfies ProjectSelect;

const toHomeProject = ({
  pieces,
  ...project
}: {
  id: string;
  name: string;
  color: string;
  stage: HomeProject["stage"];
  address: string;
  pieces: { coverFileId: string | null }[];
}): HomeProject => ({
  ...project,
  coverFileId: pieces[0]?.coverFileId ?? null,
});

export const getProjectHomeEffect = Effect.fn("getProjectHome")(function* (
  prisma: PrismaService,
) {
  const session = yield* getActiveSession();
  const accessible = yield* accessibleProjectsWhere(prisma);
  if (!accessible) {
    return { pinned: [], recent: [] };
  }
  const visible = { AND: [accessible, { isDeleted: false }] };
  const pins = yield* prisma.projectPin.findMany({
    where: { userId: session.userId, project: visible },
    select: { project: { select: homeProjectSelect } },
    orderBy: [{ sortOrder: SortOrder.asc }, { createdAt: SortOrder.asc }],
  });
  const pinned = pins.map(({ project }) => toHomeProject(project));
  const views = yield* prisma.projectView.findMany({
    where: {
      userId: session.userId,
      projectId: { notIn: pinned.map(({ id }) => id) },
      project: visible,
    },
    select: { project: { select: homeProjectSelect } },
    orderBy: { viewedAt: SortOrder.desc },
    take: HOME_RECENT_LIMIT,
  });
  const recent = views.map(({ project }) => toHomeProject(project));
  yield* Effect.annotateLogsScoped({
    pinnedProjects: pinned.length,
    recentProjects: recent.length,
  });
  return { pinned, recent };
});

export const recordProjectViewEffect = Effect.fn("recordProjectView")(
  function* (prisma: PrismaService, projectId: unknown) {
    const id = yield* Schema.decodeUnknown(ProjectIdSchema)(projectId);
    yield* assertProjectAccess(prisma, id);
    const session = yield* getActiveSession();
    yield* prisma.projectView.upsert({
      where: { userId_projectId: { userId: session.userId, projectId: id } },
      create: { userId: session.userId, projectId: id },
      update: { viewedAt: new Date() },
    });
  },
);

export const isProjectPinnedEffect = Effect.fn("isProjectPinned")(function* (
  prisma: PrismaService,
  projectId: string,
) {
  const session = yield* getActiveSession();
  const count = yield* prisma.projectPin.count({
    where: { userId: session.userId, projectId },
  });
  return count > 0;
});

export const pinProjectEffect = Effect.fn("pinProject")(function* (
  prisma: PrismaService,
  projectId: unknown,
) {
  const id = yield* Schema.decodeUnknown(ProjectIdSchema)(projectId);
  yield* assertProjectAccess(prisma, id);
  const session = yield* getActiveSession();
  const last = yield* prisma.projectPin.findFirst({
    where: { userId: session.userId },
    select: { sortOrder: true },
    orderBy: { sortOrder: SortOrder.desc },
  });
  yield* prisma.projectPin.upsert({
    where: { userId_projectId: { userId: session.userId, projectId: id } },
    create: {
      userId: session.userId,
      projectId: id,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
    update: {},
  });
});

export const unpinProjectEffect = Effect.fn("unpinProject")(function* (
  prisma: PrismaService,
  projectId: unknown,
) {
  const id = yield* Schema.decodeUnknown(ProjectIdSchema)(projectId);
  const session = yield* getActiveSession();
  yield* prisma.projectPin.deleteMany({
    where: { userId: session.userId, projectId: id },
  });
});

export const reorderPinsEffect = Effect.fn("reorderPins")(function* (
  prisma: PrismaService,
  projectIds: unknown,
) {
  const requested = yield* Schema.decodeUnknown(ProjectIdsSchema)(projectIds);
  const session = yield* getActiveSession();
  const existing = yield* prisma.projectPin.findMany({
    where: { userId: session.userId },
    select: { projectId: true },
    orderBy: [{ sortOrder: SortOrder.asc }, { createdAt: SortOrder.asc }],
  });
  const order = mergePinOrder(
    requested,
    existing.map(({ projectId }) => projectId),
  );
  yield* prisma.$transaction(
    Effect.all(
      order.map((projectId, sortOrder) =>
        prisma.projectPin.update({
          where: {
            userId_projectId: { userId: session.userId, projectId },
          },
          data: { sortOrder },
        }),
      ),
    ),
  );
});

export const getProjectCoverImageEffect = Effect.fn("getProjectCoverImage")(
  function* (prisma: PrismaService, projectId: string) {
    yield* assertProjectAccess(prisma, projectId);
    const piece = yield* prisma.projectPiece.findFirst({
      where: { projectId, isDeleted: false, coverFileId: { not: null } },
      select: { coverFileId: true },
      orderBy: [{ sortOrder: SortOrder.asc }, { id: SortOrder.asc }],
    });
    if (!piece?.coverFileId) {
      return null;
    }
    return yield* getDropboxThumbnail(piece.coverFileId).pipe(
      Effect.catchIf(
        (error) => error instanceof DropboxError,
        (error) =>
          Effect.logWarning("Cover thumbnail unavailable", error).pipe(
            Effect.as(null),
          ),
      ),
    );
  },
);
