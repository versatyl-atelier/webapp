import "server-only";

import { Role } from "@/generated/prisma/enums";
import { cachedGetter } from "@/lib/effect";
import { getTimesheetEffect } from "@/effects/timesheet";

export const getTimesheet = cachedGetter(getTimesheetEffect, [Role.employee]);
