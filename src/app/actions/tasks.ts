import { TaskFindManyArgs } from "@/generated/prisma/models";
import { PrismaService } from "@/generated/effect-prisma";

import { SortOrder } from "@/generated/prisma/internal/prismaNamespace";
import { Role } from "@/generated/prisma/enums";
import { cachedGetter } from "@/lib/effect";

export const getTasks = cachedGetter(function* () {
  const prisma = yield* PrismaService;
  const args: TaskFindManyArgs = {
    where: {
      isDeleted: false,
    },
    orderBy: {
      name: SortOrder.asc,
    },
  };
  return yield* prisma.task.findMany(args);
}, Role.employee);
