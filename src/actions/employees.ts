import "server-only";

import { Role } from "@/generated/prisma/enums";
import { cachedGetter } from "@/lib/effect";
import {
  getEmployeeEffect,
  getEmployeesEffect,
  getEmployeesWithoutAccountEffect,
} from "@/effects/employees";

export const getEmployee = cachedGetter(getEmployeeEffect, [Role.atelier]);

export const getEmployees = cachedGetter(getEmployeesEffect, [Role.atelier]);

export const getEmployeesWithoutAccount = cachedGetter(
  getEmployeesWithoutAccountEffect,
  [Role.manager],
);
