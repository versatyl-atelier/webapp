import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Tool } from "@/constants/tools";
import { cn } from "@/lib/utils";

type ToolTileProps = {
  tool: Tool;
};

export function ToolTile({
  tool: { href, icon, title, description, tags = [], disabled },
}: ToolTileProps) {
  const card = (
    <Card
      className={cn(
        "h-36 w-44 shadow-sm transition-shadow",
        disabled ? "opacity-35" : "hover:shadow-lg",
      )}
    >
      <CardHeader className="text-xl">{icon}</CardHeader>
      <CardContent>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <ul className="mt-2 flex gap-2">
          {tags.map((tag?: string) => (
            <Badge
              render={<li />}
              key={tag}
              className="text-2xs rounded-sm"
              variant="secondary"
            >
              {tag}
            </Badge>
          ))}
        </ul>
      </CardContent>
    </Card>
  );

  return disabled ? (
    <div aria-disabled>{card}</div>
  ) : (
    <Link href={href}>{card}</Link>
  );
}
