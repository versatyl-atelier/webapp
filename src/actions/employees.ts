import "server-only";

import { Role } from "@/generated/prisma/enums";
import { cachedGetter } from "@/lib/effect";
import { getEmployeeEffect, getEmployeesEffect } from "@/effects/employees";

export const getEmployee = cachedGetter(getEmployeeEffect, Role.employee);

export const getEmployees = cachedGetter(getEmployeesEffect, Role.employee);
