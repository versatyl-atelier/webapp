import { getEmployeeActivity } from "@/actions/activity";
import { ActivityLog } from "@/components/ActivityLog";
import { CALENDAR_WEEK_PARAM } from "@/constants/calendar";
import { parseWeekParam, toLocalDateKey } from "@/lib/calendar";
import { PunchSidebar } from "@/app/punch/PunchSidebar";
import type { EmployeePageParams } from "@/app/punch/employe/[id]/page";

export default async function EmployeSidebar({
  params,
  searchParams,
}: EmployeePageParams) {
  const { id } = await params;
  const weekStartKey = parseWeekParam(
    (await searchParams)[CALENDAR_WEEK_PARAM],
    toLocalDateKey(new Date()),
  );
  const events = await getEmployeeActivity(parseInt(id, 10), weekStartKey);

  return (
    <PunchSidebar>
      <ActivityLog events={events} />
    </PunchSidebar>
  );
}
