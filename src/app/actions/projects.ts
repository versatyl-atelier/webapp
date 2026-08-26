"use server";

import "server-only";

import {
  ProjectFindManyArgs,
  StatutSourcePermissionFindManyArgs,
} from "@/generated/prisma/models";
import { PrismaService } from "@/generated/effect-prisma";
import { SortOrder } from "@/generated/prisma/internal/prismaNamespace";
import { Role } from "@/generated/prisma/enums";
import { cachedGetter } from "@/lib/effect";

export const getProjects = cachedGetter(function* (employeeId: number) {
  const prisma = yield* PrismaService;
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
  const allowedSources = (
    yield* prisma.statutSourcePermission.findMany(opts)
  ).map(({ sourceId }) => sourceId);
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
}, Role.employee);
