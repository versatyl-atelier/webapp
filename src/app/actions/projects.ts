import { cache } from "react";

import { restrictToRole } from "./auth";
import {
  ProjectFindManyArgs,
  StatutSourcePermissionFindManyArgs,
} from "@/generated/prisma/models";
import prisma from "@/lib/prisma";
import { SortOrder } from "@/generated/prisma/internal/prismaNamespace";
import { Role } from "@/generated/prisma/enums";

export const getProjects = cache(async (employeeId: number) => {
  return restrictToRole(Role.employee, async () => {
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
      await prisma.statutSourcePermission.findMany(opts)
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
    return await prisma.project.findMany(args);
  });
});
