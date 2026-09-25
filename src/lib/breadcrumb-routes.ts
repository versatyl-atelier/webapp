import "server-only";

import { notFound } from "next/navigation";

import { getEmployee } from "@/actions/employees";
import {
  EMPLOYEE_CRUMB_PATTERN,
  EMPLOYEE_ID_PARAM,
  STATIC_CRUMB_LABELS,
} from "@/constants/breadcrumbs";
import type { CrumbRoutes } from "@/lib/breadcrumbs";

export const CRUMB_ROUTES: CrumbRoutes = {
  ...STATIC_CRUMB_LABELS,
  [EMPLOYEE_CRUMB_PATTERN]: async (params) => {
    const employee = await getEmployee(parseInt(params[EMPLOYEE_ID_PARAM], 10));
    if (!employee) {
      notFound();
    }
    return employee.name;
  },
};
