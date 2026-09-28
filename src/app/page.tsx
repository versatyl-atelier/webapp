import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AppCard = {
  href: string;
  icon: string;
  title: string;
  description: string;
  tags?: string[];
  disabled?: boolean;
};
const apps: AppCard[] = [
  {
    href: "projets",
    icon: "📁",
    title: "Projets",
    description: "Phases, pièces et listes",
    tags: ["Nouveau"],
  },
  {
    href: "punch",
    icon: "⏱",
    title: "Punch",
    description: "Timesheet atelier",
  },
  {
    href: "lanceur-de-dates",
    icon: "📅",
    title: "Lanceur",
    description: "Planification production",
  },
  {
    href: "calendrier",
    icon: "🗓",
    title: "Calendrier",
    description: "Échéances et événements",
  },
  {
    href: "notes",
    icon: "📝",
    title: "Notes",
    description: "Phase 2",
    disabled: true,
  },
];
export default async function Home() {
  return (
    <main className="px-4">
      <h2 className="text-muted-foreground my-4 text-xs font-bold uppercase">
        Applications
      </h2>
      <ul className="flex flex-wrap gap-3">
        {apps.map(({ href, icon, title, description, tags = [], disabled }) => (
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
        ))}
      </ul>
    </main>
  );
}
