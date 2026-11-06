import { ToolTile } from "@/components/ToolTile";
import { Role } from "@/generated/prisma/enums";
import { toolsForRole } from "@/lib/tools";

type ToolTilesProps = {
  role: Role | null;
};

export function ToolTiles({ role }: ToolTilesProps) {
  return (
    <ul className="flex flex-wrap gap-3">
      {toolsForRole(role).map((tool) => (
        <li key={tool.href}>
          <ToolTile tool={tool} />
        </li>
      ))}
    </ul>
  );
}
