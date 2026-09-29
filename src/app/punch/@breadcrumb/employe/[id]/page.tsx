import { notFound } from "next/navigation";

import { getEmployee } from "@/actions/employees";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { FreezeForm } from "@/components/FreezeForm";
import { WeekCrumbs } from "@/components/WeekCrumbs";
import { CALENDAR_WEEK_PARAM, DAYS_PER_WEEK } from "@/constants/calendar";
import {
  addDays,
  mondayOf,
  parseWeekParam,
  toLocalDateKey,
  type DateKey,
} from "@/lib/calendar";
import { getEmployeeWeek, MAX_WEEKS_BACK } from "@/lib/employee-week";
import { employeeWeekPath } from "@/lib/paths";
import type { EmployeePageParams } from "@/app/punch/employe/[id]/page";

export default async function EmployeBreadcrumb({
  params,
  searchParams,
}: EmployeePageParams) {
  const { id } = await params;
  const employee = await getEmployee(parseInt(id, 10));
  if (!employee) {
    notFound();
  }

  const today = toLocalDateKey(new Date());
  const todayWeekStart = mondayOf(today);
  const weekStartKey = parseWeekParam(
    (await searchParams)[CALENDAR_WEEK_PARAM],
    today,
  );
  const { weekStart, weekly, objective, weekFrozen } = await getEmployeeWeek(
    employee,
    weekStartKey,
  );

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1 py-1 pr-2 md:flex-row md:items-center">
      <AppBreadcrumb segments={["punch", "employe", id]}>
        <WeekCrumbs
          weekStart={weekStartKey}
          todayWeekStart={todayWeekStart}
          minWeekStart={addDays(
            todayWeekStart,
            -MAX_WEEKS_BACK * DAYS_PER_WEEK,
          )}
          maxWeekStart={todayWeekStart}
          weekPath={(weekStart: DateKey) =>
            employeeWeekPath(employee.id, weekStart)
          }
        />
      </AppBreadcrumb>
      <FreezeForm
        employeeId={employee.id}
        weekStart={weekStart}
        weekTotal={weekly}
        objective={objective}
        weekFrozen={weekFrozen}
        className="md:ml-auto"
      />
    </div>
  );
}
