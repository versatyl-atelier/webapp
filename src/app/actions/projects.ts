"use server";

import "server-only";

import {
  ProjectFindManyArgs,
  StatutSourcePermissionFindManyArgs,
} from "@/generated/prisma/models";
import { SortOrder } from "@/generated/prisma/internal/prismaNamespace";
import { Role } from "@/generated/prisma/enums";
import { cachedGetter } from "@/lib/effect";
import type { PrismaService } from "@/generated/effect-prisma";
import { Effect } from "effect";

export const getProjects = cachedGetter(
  Effect.fn("getProjects")(function* (
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
    const allowedSources = (yield* prisma.statutSourcePermission.findMany(
      opts,
    )).map(({ sourceId }) => sourceId);
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
  }),
  Role.employee,
);
