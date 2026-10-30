import { describe, expect, it } from "vitest";

import { ATELIER_TOOL_HREFS, MANAGER_TOOL, TOOLS } from "@/constants/tools";
import { Role } from "@/generated/prisma/enums";
import { toolsForRole } from "@/lib/tools";

describe("toolsForRole", () => {
  it("limits the atelier role to its tools", () => {
    expect(toolsForRole(Role.atelier).map(({ href }) => href)).toEqual(
      ATELIER_TOOL_HREFS,
    );
  });

  it("adds the manager interface for managers only", () => {
    expect(toolsForRole(Role.manager)).toEqual([...TOOLS, MANAGER_TOOL]);
    expect(toolsForRole(Role.employee)).toEqual(TOOLS);
    expect(toolsForRole(null)).toEqual(TOOLS);
  });
});
