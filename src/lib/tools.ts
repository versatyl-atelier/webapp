import {
  ATELIER_TOOL_HREFS,
  MANAGER_TOOL,
  EMPLOYEE_TOOLS,
  type Tool,
} from "@/constants/tools";
import { Role } from "@/generated/prisma/enums";

export function toolsForRole(role: Role | null): Tool[] {
  switch (role) {
    case Role.manager:
      return [...EMPLOYEE_TOOLS, MANAGER_TOOL];
    case Role.atelier:
      return EMPLOYEE_TOOLS.filter(({ href }) =>
        ATELIER_TOOL_HREFS.includes(href),
      );
    case Role.employee:
      return EMPLOYEE_TOOLS;
    default:
      return [];
  }
}
