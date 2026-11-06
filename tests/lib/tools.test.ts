import { describe, expect, it } from "vitest";

import {
  ATELIER_TOOL_HREFS,
  MANAGER_TOOL,
  EMPLOYEE_TOOLS,
} from "@/constants/tools";
import { PUNCH_TOOLS } from "@/constants/punch";
import { Role } from "@/generated/prisma/enums";
import { punchToolsForRole, toolsForRole } from "@/lib/tools";

describe("toolsForRole", () => {
  it("limits the atelier role to its tools", () => {
    expect(toolsForRole(Role.atelier).map(({ href }) => href)).toEqual(
      ATELIER_TOOL_HREFS,
    );
  });

  it("adds the manager interface for managers only", () => {
    expect(toolsForRole(Role.manager)).toEqual([
      ...EMPLOYEE_TOOLS,
      MANAGER_TOOL,
    ]);
    expect(toolsForRole(Role.employee)).toEqual(EMPLOYEE_TOOLS);
    expect(toolsForRole(null)).toEqual([]);
  });
});

describe("punchToolsForRole", () => {
  it("gives the atelier role no navigation", () => {
    expect(punchToolsForRole(Role.atelier)).toEqual([]);
    expect(punchToolsForRole(null)).toEqual([]);
  });

  it("hides the manager-only entries from employees", () => {
    expect(punchToolsForRole(Role.manager)).toEqual(PUNCH_TOOLS);
    expect(
      punchToolsForRole(Role.employee).some(({ managerOnly }) => managerOnly),
    ).toBe(false);
  });
});
