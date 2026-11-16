import { ImageIcon, Pin } from "lucide-react";
import Link from "next/link";

import { getProjectHome } from "@/actions/projects";
import { CoverImage } from "@/components/CoverImage";
import { HomeWidgetCard } from "@/components/HomeWidgetCard";
import {
  HOME_PINNED_PROJECT_LABEL,
  HOME_PROJECT_CARD_WIDTH_CLASS,
  HOME_PROJECTS_EMPTY_LABEL,
  HOME_PROJECTS_HEADING,
  HOME_PROJECTS_LIMIT,
  HOME_WIDGET_LINKS,
  HOME_WIDGETS,
} from "@/constants/home";
import { homeProjectCards } from "@/lib/home";
import { projectPath } from "@/lib/paths";
import { projectColorStyle } from "@/lib/projects";
import { cn } from "@/lib/utils";

export async function HomeProjects() {
  const projects = homeProjectCards(
    await getProjectHome(),
    HOME_PROJECTS_LIMIT,
  );

  return (
    <HomeWidgetCard
      widget={HOME_WIDGETS.projects}
      title={HOME_PROJECTS_HEADING}
      link={HOME_WIDGET_LINKS.projects}
    >
      {projects.length === 0 ? (
        <p className="text-muted-foreground p-3 text-sm">
          {HOME_PROJECTS_EMPTY_LABEL}
        </p>
      ) : (
        <ul className="flex gap-3 overflow-x-auto p-3">
          {projects.map((project) => (
            <li
              key={project.id}
              style={projectColorStyle(project.color)}
              className={cn(
                "group bg-card focus-within:ring-ring/50 relative flex shrink-0 flex-col overflow-hidden rounded-lg border border-t-3 border-t-(--project-color) shadow-xs transition-shadow focus-within:ring-3 hover:shadow-md",
                HOME_PROJECT_CARD_WIDTH_CLASS,
              )}
            >
              <div className="bg-muted text-muted-foreground flex aspect-video items-center justify-center overflow-hidden border-b">
                {project.coverPieceId !== null && project.coverUpdatedAt ? (
                  <CoverImage
                    projectId={project.id}
                    pieceId={project.coverPieceId}
                    version={project.coverUpdatedAt}
                    framing={{
                      x: project.coverX,
                      y: project.coverY,
                      zoom: project.coverZoom,
                    }}
                  />
                ) : (
                  <ImageIcon aria-hidden className="size-5" />
                )}
              </div>
              {project.pinned && (
                <span className="bg-background/90 absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full border">
                  <Pin aria-hidden className="size-3" />
                  <span className="sr-only">{HOME_PINNED_PROJECT_LABEL}</span>
                </span>
              )}
              <h3 className="truncate px-2 py-1.5 text-xs font-semibold">
                <Link
                  href={projectPath(project.id)}
                  className="outline-hidden after:absolute after:inset-0"
                >
                  {project.name}
                </Link>
              </h3>
            </li>
          ))}
        </ul>
      )}
    </HomeWidgetCard>
  );
}
