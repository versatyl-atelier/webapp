import { cache } from "react";

import type { EmployeeFindManyArgs } from "@/generated/prisma/models";

import { restrictToRole } from "@/app/actions/auth";
import prisma from "@/lib/prisma";
import { SortOrder } from "@/generated/prisma/internal/prismaNamespace";
import { Role } from "@/generated/prisma/enums";

export const getEmployee = cache(async (employeeId: number) =>
  restrictToRole(Role.employee, async () => {
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
        id: employeeId,
      },
    };
    return await prisma.employee.findUnique(args);
  }),
);

export const getEmployees = cache(async () =>
  restrictToRole(Role.employee, async () => {
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
    return await prisma.employee.findMany(args);
  }),
);
