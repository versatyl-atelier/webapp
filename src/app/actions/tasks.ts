import { TaskFindManyArgs } from "@/generated/prisma/models";
import prisma from "@/lib/prisma";

import { SortOrder } from "@/generated/prisma/internal/prismaNamespace";
import { Role } from "@/generated/prisma/enums";
import { cachedGetter } from "@/lib/effect";
import { Effect } from "effect";

export const getTasks = cachedGetter(
  () =>
    Effect.gen(function* () {
      const args: TaskFindManyArgs = {
        where: {
          isDeleted: false,
        },
        orderBy: {
          name: SortOrder.asc,
        },
      };
      return yield* Effect.tryPromise(() => prisma.task.findMany(args));
    }),
  Role.employee,
);
