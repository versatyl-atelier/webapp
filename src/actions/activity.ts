"use server";

import "server-only";

import { cachedGetter } from "@/lib/effect";
import { Role } from "@/generated/prisma/enums";
import { getEmployeeActivityEffect } from "@/effects/activity";

export const getEmployeeActivity = cachedGetter(getEmployeeActivityEffect, [
  Role.atelier,
]);
