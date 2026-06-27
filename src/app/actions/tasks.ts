import { TaskFindManyArgs } from "@/generated/prisma/models";
import prisma from "@/lib/prisma";
import { cache } from "react";
import { restrictToRole } from "@/app/actions/auth";
import { SortOrder } from "@/generated/prisma/internal/prismaNamespace";
import { Role } from "@/generated/prisma/enums";

export const getTasks = cache(async () => {
  return restrictToRole(Role.employee, async () => {
    const args: TaskFindManyArgs = {
      where: {
        isDeleted: false,
      },
      orderBy: {
        name: SortOrder.asc,
      },
    };
    return await prisma.task.findMany(args);
  });
});
