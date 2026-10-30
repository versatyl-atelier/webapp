import { redirect } from "next/navigation";

import { ALL_EMPLOYEES_ACCESS_ROLES } from "@/constants/auth";
import { PUNCH_PATH, PUNCH_SELECT_EMPLOYEE_PROMPT } from "@/constants/punch";
import { employeePath } from "@/lib/paths";
import { requireActiveSession } from "@/lib/session";

export default async function Page() {
  const session = await requireActiveSession(PUNCH_PATH);
  if (
    session.employeeId !== null &&
    !ALL_EMPLOYEES_ACCESS_ROLES.includes(session.role)
  ) {
    redirect(employeePath(session.employeeId));
  }

  return (
    <p className="text-muted-foreground m-auto flex items-center gap-3 p-4 text-lg">
      <span aria-hidden className="text-3xl">
        ←
      </span>
      {PUNCH_SELECT_EMPLOYEE_PROMPT}
    </p>
  );
}
