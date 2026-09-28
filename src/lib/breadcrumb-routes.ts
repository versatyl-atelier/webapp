import "server-only";

import { notFound } from "next/navigation";

import { getCalendarEvent } from "@/actions/calendar";
import { getEmployee } from "@/actions/employees";
import { getProject } from "@/actions/projects";
import {
  CALENDAR_DATE_PARAM,
  CALENDAR_DAY_CRUMB_PATTERN,
  CALENDAR_EVENT_CRUMB_PATTERN,
  CALENDAR_EVENT_ID_PARAM,
  EMPLOYEE_CRUMB_PATTERN,
  EMPLOYEE_ID_PARAM,
  PROJECT_CRUMB_PATTERN,
  PROJECT_ID_PARAM,
  STATIC_CRUMB_LABELS,
} from "@/constants/breadcrumbs";
import type { CrumbRoutes } from "@/lib/breadcrumbs";
import { formatDayLabel, isDateKey } from "@/lib/calendar";

export const CRUMB_ROUTES: CrumbRoutes = {
  ...STATIC_CRUMB_LABELS,
  [EMPLOYEE_CRUMB_PATTERN]: async (params) => {
    const employee = await getEmployee(parseInt(params[EMPLOYEE_ID_PARAM], 10));
    if (!employee) {
      notFound();
    }
    return employee.name;
  },
  [CALENDAR_DAY_CRUMB_PATTERN]: async (params) => {
    const date = params[CALENDAR_DATE_PARAM];
    if (!isDateKey(date)) {
      notFound();
    }
    return formatDayLabel(date);
  },
  [CALENDAR_EVENT_CRUMB_PATTERN]: async (params) => {
    const event = await getCalendarEvent(
      Number(params[CALENDAR_EVENT_ID_PARAM]),
    );
    if (!event) {
      notFound();
    }
    return event.title;
  },
  [PROJECT_CRUMB_PATTERN]: async (params) => {
    const project = await getProject(params[PROJECT_ID_PARAM]);
    if (!project) {
      notFound();
    }
    return project.name;
  },
};
