import { EmployeeSelect } from "@/components/EmployeeSelect";

import { getEmployees } from "@/actions/employees";
import { PUNCH_EMPLOYEES_PATH } from "@/constants/punch";
import { pinEmployeeFirst } from "@/lib/employees";
import { ALL_EMPLOYEES_ACCESS_ROLES } from "@/constants/auth";
import { requireActiveSession } from "@/lib/session";

export default async function Page() {
  const session = await requireActiveSession(PUNCH_EMPLOYEES_PATH);
  const employees = await getEmployees();
  return (
    <EmployeeSelect
      employees={pinEmployeeFirst(employees || [], session.employeeId)}
      currentEmployeeId={session.employeeId}
      canAccessAll={ALL_EMPLOYEES_ACCESS_ROLES.includes(session.role)}
      className="mt-4 w-md self-center"
    />
  );
}
