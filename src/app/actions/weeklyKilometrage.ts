"use server";

import "server-only";

import { cache } from "react";

import prisma from "@/lib/prisma";
import { restrictToRole } from "./auth";
import { Role } from "@/generated/prisma/enums";
import type { WeeklyKilometrageFindFirstArgs } from "@/generated/prisma/models";

export const getWeeklyKilometrage = cache(async (employeeId: number, weekStart: Date) =>
  restrictToRole(Role.employee, async () => {
    const args: WeeklyKilometrageFindFirstArgs = {
      where: {
        employeeId,
        weekStart,
        isDeleted: false,
      },
    };
    return await prisma.weeklyKilometrage.findFirst(args);
  }),
);
