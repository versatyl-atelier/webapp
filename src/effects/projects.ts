import type { PrismaService } from "@/generated/effect-prisma";
import { SortOrder } from "@/generated/prisma/internal/prismaNamespace";
import {
  StatutSourcePermissionFindManyArgs,
  ProjectFindManyArgs,
} from "@/generated/prisma/models";
import { Effect } from "effect";
import { assertEmployeeAccess, getActiveSession } from "@/effects/auth";
import { Role } from "@/generated/prisma/enums";

const getAllowedSourceIds = Effect.fn("getAllowedSourceIds")(function* (
  prisma: PrismaService,
  employeeId: number,
) {
  const opts: StatutSourcePermissionFindManyArgs = {
    where: {
      statut: {
        employees: {
          some: {
            id: employeeId,
          },
        },
      },
    },
    select: {
      sourceId: true,
    },
  };
  return (yield* prisma.statutSourcePermission.findMany(opts)).map(
    ({ sourceId }) => sourceId,
  );
});

export const getProjectsEffect = Effect.fn("getProjects")(function* (
  prisma: PrismaService,
  employeeId: number,
) {
  yield* assertEmployeeAccess(employeeId);
  const allowedSources = yield* getAllowedSourceIds(prisma, employeeId);
  if (allowedSources.length === 0) {
    return [];
  }
  const args: ProjectFindManyArgs = {
    where: {
      sourceId: {
        in: allowedSources,
      },
    },
    orderBy: {
      name: SortOrder.asc,
    },
  };
  return yield* prisma.project.findMany(args);
});

export const getAllProjectsEffect = Effect.fn("getAllProjects")(function* (
  prisma: PrismaService,
) {
  const args: ProjectFindManyArgs = {
    select: {
      id: true,
      name: true,
      isDeleted: true,
    },
    orderBy: {
      name: SortOrder.asc,
    },
  };
  return yield* prisma.project.findMany(args);
});

export const getProjectEffect = Effect.fn("getProject")(function* (
  prisma: PrismaService,
  id: string,
) {
  const session = yield* getActiveSession();
  if (session.role === Role.manager) {
    return yield* prisma.project.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
  }
  if (session.employeeId === null) {
    return null;
  }
  const allowedSources = yield* getAllowedSourceIds(prisma, session.employeeId);
  return yield* prisma.project.findFirst({
    where: { id, sourceId: { in: allowedSources } },
    select: { id: true, name: true },
  });
});
