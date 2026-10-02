import Link from "next/link";
import { Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TOOLS } from "@/constants/tools";
import { cn } from "@/lib/utils";

type ToolTilesProps = {
  isManager: boolean;
};

export function ToolTiles({ isManager }: ToolTilesProps) {
  return (
    <>
      <ul className="flex flex-wrap gap-3">
        {TOOLS.map(
          ({ href, icon, title, description, tags = [], disabled }) => (
            <li key={href}>
              <Link href={href}>
                <Card
                  className={cn(
                    "h-36 w-44 shadow-sm transition-shadow hover:shadow-lg",
                    disabled ? "opacity-35" : "",
                  )}
                >
                  <CardHeader className="text-xl">{icon}</CardHeader>
                  <CardContent>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                    <ul className="mt-2 flex gap-2">
                      {tags.map((tag?: string) => (
                        <Badge
                          asChild
                          key={tag}
                          className="text-2xs rounded-sm"
                          variant="secondary"
                        >
                          <li>{tag}</li>
                        </Badge>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ),
        )}
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
