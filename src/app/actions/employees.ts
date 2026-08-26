import "server-only";

import type { EmployeeFindManyArgs } from "@/generated/prisma/models";

import { PrismaService } from "@/generated/effect-prisma";

import { SortOrder } from "@/generated/prisma/internal/prismaNamespace";
import { Role } from "@/generated/prisma/enums";
import { cachedGetter } from "@/lib/effect";

export const getEmployee = cachedGetter(function* (id: number) {
  const prisma = yield* PrismaService;
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
  const employees = yield* prisma.employee.findUnique(args);
  return employees;
}, Role.employee);

export const getEmployees = cachedGetter(function* () {
  const prisma = yield* PrismaService;
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
  const employees = yield* prisma.employee.findMany(args);
  return employees;
}, Role.employee);
