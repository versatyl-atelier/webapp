"use server";

import "server-only";

import {
  ProjectFindManyArgs,
  StatutSourcePermissionFindManyArgs,
} from "@/generated/prisma/models";
import prisma from "@/lib/prisma";
import { SortOrder } from "@/generated/prisma/internal/prismaNamespace";
import { Role } from "@/generated/prisma/enums";
import { cachedGetter } from "@/lib/effect";
import { Effect } from "effect";

export const getProjects = cachedGetter(
  (employeeId: number) =>
    Effect.gen(function* () {
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
      const allowedSources = (yield* Effect.tryPromise(() =>
        prisma.statutSourcePermission.findMany(opts),
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
      return yield* Effect.tryPromise(() => prisma.project.findMany(args));
    }),
  Role.employee,
);
