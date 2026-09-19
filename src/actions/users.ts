import "server-only";

import { Role } from "@/generated/prisma/enums";
import { cachedGetter } from "@/lib/effect";
import { getUsersEffect } from "@/effects/users";

export const getUsers = cachedGetter(getUsersEffect, [Role.manager]);
