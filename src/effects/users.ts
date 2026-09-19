import type { PrismaService } from "@/generated/effect-prisma";
import { SortOrder } from "@/generated/prisma/internal/prismaNamespace";
import type { UserFindManyArgs } from "@/generated/prisma/models";
import { Effect } from "effect";

export const getUsersEffect = Effect.fn("getUsers")(function* (
  prisma: PrismaService,
) {
  const args = {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      employee: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      name: SortOrder.asc,
    },
  } satisfies UserFindManyArgs;
  return yield* prisma.user.findMany(args);
});
