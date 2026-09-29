import { notFound } from "next/navigation";

import { getEmployee } from "@/actions/employees";
import { getActivePunch } from "@/actions/multiPunch";
import { getProjects } from "@/actions/projects";
import { getTasks } from "@/actions/tasks";
import MultiPunchForm from "@/components/MultiPunchForm";
import { CALENDAR_WEEK_PARAM } from "@/constants/calendar";
import { parseWeekParam, toLocalDateKey } from "@/lib/calendar";
import { getEmployeeWeek } from "@/lib/employee-week";
import { WEEK_FROZEN_MESSAGE } from "@/schemas/frozenWeeks.schemas";
import { PunchSidebar } from "@/app/punch/PunchSidebar";
import { PageContextProvider } from "@/app/punch/employe/[id]/context-provider";
import type { EmployeePageParams } from "@/app/punch/employe/[id]/page";

export default async function EmployeSidebar({
  params,
  searchParams,
}: EmployeePageParams) {
  const { id } = await params;
  const employeeId = parseInt(id, 10);
  const employee = await getEmployee(employeeId);
  if (!employee) {
    notFound();
  }

  const weekStartKey = parseWeekParam(
    (await searchParams)[CALENDAR_WEEK_PARAM],
    toLocalDateKey(new Date()),
  );
  const { weekFrozen } = await getEmployeeWeek(employee, weekStartKey);
  const activePunch = await getActivePunch(employeeId);

  return (
    <PunchSidebar>
      <PageContextProvider
        projectsPromise={getProjects(employeeId)}
        tasksPromise={getTasks()}
      >
        <MultiPunchForm
          employeeId={employeeId}
          activePunch={activePunch}
          disabled={weekFrozen ? WEEK_FROZEN_MESSAGE : undefined}
        />
      </PageContextProvider>
    </PunchSidebar>
  );
}
