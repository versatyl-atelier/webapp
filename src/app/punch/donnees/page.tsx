import { ToolTile } from "@/components/ToolTile";
import { PUNCH_DATA_PATH, PUNCH_DATA_TOOLS } from "@/constants/punch";
import { Role } from "@/generated/prisma/enums";
import { requireActiveSession } from "@/lib/session";

export default async function Page() {
  const session = await requireActiveSession(PUNCH_DATA_PATH);
  const isManager = session.role === Role.manager;

  return (
    <ul className="mt-8 flex flex-wrap justify-center gap-3 self-center">
      {PUNCH_DATA_TOOLS.map((tool) => (
        <li key={tool.href}>
          <ToolTile
            tool={{
              ...tool,
              disabled: tool.disabled || (tool.managerOnly && !isManager),
            }}
          />
        </li>
      ))}
    </ul>
  );
}
