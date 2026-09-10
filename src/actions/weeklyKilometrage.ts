"use server";

import "server-only";

import { cachedGetter } from "@/lib/effect";
import { Role } from "@/generated/prisma/enums";
import { getWeeklyKilometrageEffect } from "@/effects/weeklyKilometrage";

export const getWeeklyKilometrage = cachedGetter(
  getWeeklyKilometrageEffect,
  Role.employee,
);
