import { ToolTile } from "@/components/ToolTile";
import { PUNCH_DATA_TILE, PUNCH_PATH, PUNCH_TILE } from "@/constants/punch";
import { Role } from "@/generated/prisma/enums";
import { punchHomeHref } from "@/lib/paths";
import { requireActiveSession } from "@/lib/session";

export default async function Page() {
  const session = await requireActiveSession(PUNCH_PATH);
  const punchTile = { ...PUNCH_TILE, href: punchHomeHref(session.employeeId) };
  const tiles =
    session.role === Role.atelier ? [punchTile] : [punchTile, PUNCH_DATA_TILE];

  return (
    <ul className="mt-8 flex flex-wrap justify-center gap-3 self-center">
      {tiles.map((tile) => (
        <li key={tile.href}>
          <ToolTile tool={tile} />
        </li>
      ))}
    </ul>
  );
}
