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
import { TOOLS } from "@/constants/tools";

type ToolTilesProps = {
  isManager: boolean;
};

export function ToolTiles({ isManager }: ToolTilesProps) {
  return (
    <>
      <ul className="flex flex-wrap gap-3">
        {TOOLS.map((tool) => (
          <li key={tool.href}>
            <ToolTile tool={tool} />
          </li>
        ))}
      </ul>

      {isManager && (
        <ul className="mt-3 flex flex-wrap gap-3">
          <li>
            <Link href="/punch/gestionnaire">
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
