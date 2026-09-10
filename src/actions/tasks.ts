import { Role } from "@/generated/prisma/enums";
import { cachedGetter } from "@/lib/effect";
import { getTasksEffect } from "@/effects/tasks";

export const getTasks = cachedGetter(getTasksEffect, Role.employee);
