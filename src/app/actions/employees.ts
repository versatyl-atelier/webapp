import "server-only";

import type { EmployeeFindManyArgs } from "@/generated/prisma/models";

import prisma from "@/lib/prisma";

import { SortOrder } from "@/generated/prisma/internal/prismaNamespace";
import { Role } from "@/generated/prisma/enums";
import { Effect } from "effect";
import { cachedGetter } from "@/lib/effect";

export const getEmployee = cachedGetter(
  (id: number) =>
    Effect.gen(function* () {
      const args = {
        include: {
          weeklyObjectives: {
            select: {
              weekStart: true,
              objective: true,
            },
          },
        },
        where: {
          id,
        },
      };
      return prisma.employee.findUnique(args);
    }),
  Role.employee,
);

export const getEmployees = cachedGetter(
  () =>
    Effect.gen(function* () {
      const args: EmployeeFindManyArgs = {
        where: {
          isDeleted: false,
        },
        select: {
          id: true,
          name: true,
          weeklyTarget: true,
        },
        orderBy: {
          displayOrder: SortOrder.asc,
        },
      };
      return prisma.employee.findMany(args);
    }),
  Role.employee,
);
