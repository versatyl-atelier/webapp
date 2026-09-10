import type { PrismaService } from "@/generated/effect-prisma";
import { SortOrder } from "@/generated/prisma/internal/prismaNamespace";
import { TaskFindManyArgs } from "@/generated/prisma/models";
import { Effect } from "effect";

export const getTasksEffect = Effect.fn("getTasks")(function* (
  prisma: PrismaService,
) {
  const args: TaskFindManyArgs = {
    where: {
      isDeleted: false,
    },
    orderBy: {
      name: SortOrder.asc,
    },
  };
  return yield* prisma.task.findMany(args);
});
