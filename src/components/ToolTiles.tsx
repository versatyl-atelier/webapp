import Link from "next/link";
import { Wrench } from "lucide-react";

import { ToolTile } from "@/components/ToolTile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MANAGER_PATH } from "@/constants/auth";
import { ATELIER_TOOL_HREFS, TOOLS } from "@/constants/tools";
import { Role } from "@/generated/prisma/enums";

type ToolTilesProps = {
  role: Role | null;
};

export function ToolTiles({ role }: ToolTilesProps) {
  const isManager = role === Role.manager;
  const tools =
    role === Role.atelier
      ? TOOLS.filter(({ href }) => ATELIER_TOOL_HREFS.includes(href))
      : TOOLS;

  return (
    <>
      <ul className="flex flex-wrap gap-3">
        {tools.map((tool) => (
          <li key={tool.href}>
            <ToolTile tool={tool} />
          </li>
        ))}
      </ul>

      {isManager && (
        <ul className="mt-3 flex flex-wrap gap-3">
          <li>
            <Link href={MANAGER_PATH}>
              <Card className="h-36 w-44 shadow-sm transition-shadow hover:shadow-lg">
                <CardHeader className="text-xl">
                  <Wrench />
                </CardHeader>
                <CardContent>
                  <CardTitle>Interface Gestionnaire</CardTitle>
                  <CardDescription>Comptes, config, etc.</CardDescription>
                </CardContent>
              </Card>
            </Link>
          </li>
        </ul>
      )}
    </>
  );
}
