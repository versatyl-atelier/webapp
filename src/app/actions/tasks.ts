import { TaskFindManyArgs } from "@/generated/prisma/models";

import { SortOrder } from "@/generated/prisma/internal/prismaNamespace";
import { Role } from "@/generated/prisma/enums";
import { cachedGetter } from "@/lib/effect";
import type { PrismaService } from "@/generated/effect-prisma";
import { Effect } from "effect";

export const getTasks = cachedGetter(
  Effect.fn("getTasks")(function* (prisma: PrismaService) {
    const args: TaskFindManyArgs = {
      where: {
        isDeleted: false,
      },
      orderBy: {
        name: SortOrder.asc,
      },
    };
    return yield* prisma.task.findMany(args);
  }),
  Role.employee,
);
