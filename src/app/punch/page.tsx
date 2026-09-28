import { EmployeeSelect } from "@/components/EmployeeSelect";

import { getEmployees } from "@/actions/employees";
import { pinEmployeeFirst } from "@/lib/employees";
import { Role } from "@/generated/prisma/enums";
import { requireActiveSession } from "@/lib/session";

export default async function Page() {
  const session = await requireActiveSession("/punch");
  const employees = await getEmployees();
  return (
    <EmployeeSelect
      employees={pinEmployeeFirst(employees || [], session.employeeId)}
      currentEmployeeId={session.employeeId}
      canAccessAll={session.role === Role.manager}
      className="w-md self-center"
    />
  );
}
