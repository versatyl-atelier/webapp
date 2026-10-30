import {
  ATELIER_TOOL_HREFS,
  MANAGER_TOOL,
  TOOLS,
  type Tool,
} from "@/constants/tools";
import { Role } from "@/generated/prisma/enums";

export function toolsForRole(role: Role | null): Tool[] {
  if (role === Role.atelier) {
    return TOOLS.filter(({ href }) => ATELIER_TOOL_HREFS.includes(href));
  }
  return role === Role.manager ? [...TOOLS, MANAGER_TOOL] : TOOLS;
}
