import "server-only";

import { Role } from "@/generated/prisma/enums";
import { cachedGetter } from "@/lib/effect";
import { getReportEffect, getReportProjectsEffect } from "@/effects/report";

export const getReportProjects = cachedGetter(getReportProjectsEffect, [
  Role.employee,
]);

export const getReport = cachedGetter(getReportEffect, [Role.employee]);
