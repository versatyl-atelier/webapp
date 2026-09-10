import type { PrismaService } from "@/generated/effect-prisma";
import { SortOrder } from "@/generated/prisma/internal/prismaNamespace";
import type { EmployeeFindManyArgs } from "@/generated/prisma/models";
import { Effect } from "effect";

export const getEmployeesEffect = Effect.fn("getEmployees")(function* (
  prisma: PrismaService,
) {
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
});
export const getEmployeeEffect = Effect.fn("getEmployee")(function* (
  prisma: PrismaService,
  id: number,
) {
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
});
