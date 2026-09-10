import type { PrismaService } from "@/generated/effect-prisma";
import { SortOrder } from "@/generated/prisma/internal/prismaNamespace";
import {
  StatutSourcePermissionFindManyArgs,
  ProjectFindManyArgs,
} from "@/generated/prisma/models";
import { Effect } from "effect";

export const getProjectsEffect = Effect.fn("getProjects")(function* (
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
});
