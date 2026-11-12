import { getEmployees } from "@/actions/employees";
import { EmployeeList } from "@/components/EmployeeList";
import { PunchNav } from "@/components/PunchNav";
import { ToolSidebar } from "@/components/ToolSidebar";
import { SidebarContent } from "@/components/ui/sidebar";
import { ALL_EMPLOYEES_ACCESS_ROLES } from "@/constants/auth";
import { PUNCH_PATH } from "@/constants/punch";
import { Role } from "@/generated/prisma/enums";
import { pinEmployeeFirst } from "@/lib/employees";
import { getSession } from "@/lib/session";
import { punchToolsForRole } from "@/lib/tools";

export async function PunchSidebar() {
  const session = await getSession();
  const role = session?.role ?? null;
  const employees =
    role !== null && ALL_EMPLOYEES_ACCESS_ROLES.includes(role)
      ? pinEmployeeFirst(
          (await getEmployees()) ?? [],
          session?.employeeId ?? null,
        ).map(({ id, name }) => ({ id, name }))
      : null;

  return (
    <ToolSidebar glyph="⏱" title="Punch" href={PUNCH_PATH}>
      <SidebarContent>
        <PunchNav tools={punchToolsForRole(role)} />
        {employees && (
          <EmployeeList
            employees={employees}
            filterable={role === Role.manager}
          />
        )}
      </SidebarContent>
    </ToolSidebar>
  );
}
