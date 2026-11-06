"use client";

import { ImageIcon } from "lucide-react";
import Link from "next/link";
import { useId, useOptimistic, useState, useTransition } from "react";

import { reorderPins } from "@/actions/projects";
import { CoverImage } from "@/components/CoverImage";
import { PinButton } from "@/components/PinButton";
import { REORDER_PIN_SHORTCUTS } from "@/constants/projectFiles";
import { ARROW_LEFT_KEY, ARROW_RIGHT_KEY } from "@/constants/keys";
import { useIsApplePlatform } from "@/hooks/use-apple-platform";
import { Badge } from "@/components/ui/badge";
import {
  PROJECT_DRAG_TYPE,
  REORDER_PIN_HINT_APPLE,
  REORDER_PIN_HINT_DEFAULT,
} from "@/constants/projectHome";
import { PROJECT_STAGE_LABELS } from "@/constants/projects";
import { movePinBefore, movePinBy, type HomeProject } from "@/lib/projectHome";
import { projectPath } from "@/lib/paths";
import { projectColorStyle } from "@/lib/projects";
import { cn } from "@/lib/utils";

type ProjectRowProps = {
  heading: string;
  emptyLabel: string;
  projects: HomeProject[];
  pinned: boolean;
};

export function ProjectRow({
  heading,
  emptyLabel,
  projects,
  pinned,
}: ProjectRowProps) {
  const headingId = useId();
  const reorderHint = useIsApplePlatform()
    ? REORDER_PIN_HINT_APPLE
    : REORDER_PIN_HINT_DEFAULT;
  const [dragged, setDragged] = useState<string | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [ordered, setOrdered] = useOptimistic(
    projects,
    (current, ids: string[]) =>
      ids.flatMap((id) => current.find((project) => project.id === id) ?? []),
  );

  const reorder = (ids: string[]) =>
    startTransition(async () => {
      setOrdered(ids);
      await reorderPins(ids);
    });

  const ids = ordered.map(({ id }) => id);

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2
        id={headingId}
        className="text-muted-foreground text-sm font-semibold tracking-wide uppercase"
      >
        {heading}
      </h2>
      {ordered.length === 0 ? (
        <p className="text-muted-foreground text-sm italic">{emptyLabel}</p>
      ) : (
        <ul
          onDragOver={(e) => {
            if (pinned && e.dataTransfer.types.includes(PROJECT_DRAG_TYPE)) {
              e.preventDefault();
            }
          }}
          onDrop={(e) => {
            if (!pinned || !dragged) {
              return;
            }
            e.preventDefault();
            reorder(movePinBefore(ids, dragged, null));
            setDragged(null);
            setTarget(null);
          }}
          className="-mx-1 flex gap-3.5 overflow-x-auto px-1 pt-1 pb-3"
        >
          {ordered.map((project) => (
            <li
              key={project.id}
              draggable={pinned}
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData(PROJECT_DRAG_TYPE, project.id);
                setDragged(project.id);
              }}
              onDragEnd={() => {
                setDragged(null);
                setTarget(null);
              }}
              onDragOver={(e) => {
                if (pinned && dragged && dragged !== project.id) {
                  e.preventDefault();
                  e.stopPropagation();
                  setTarget(project.id);
                }
              }}
              onDrop={(e) => {
                if (!pinned || !dragged) {
                  return;
                }
                e.preventDefault();
                e.stopPropagation();
                reorder(movePinBefore(ids, dragged, project.id));
                setDragged(null);
                setTarget(null);
              }}
              style={projectColorStyle(project.color)}
              className={cn(
                "group bg-card focus-within:ring-ring/50 relative flex w-(--container-3xs) shrink-0 flex-col overflow-hidden rounded-xl border border-t-4 border-t-(--project-color) shadow-xs transition-shadow focus-within:ring-3 hover:shadow-md",
                dragged === project.id && "opacity-40",
                target === project.id && "ring-primary ring-2",
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
                  <ImageIcon aria-hidden className="size-7" />
                )}
              </div>
              <PinButton
                projectId={project.id}
                pinned={pinned}
                variant="outline"
                className={cn(
                  "bg-background/90 absolute top-2.5 right-2 z-10 transition-opacity group-hover:opacity-100 focus-visible:opacity-100",
                  !pinned && "opacity-0",
                )}
              />
              <div className="flex flex-1 flex-col gap-1.5 p-3.5">
                <h3 className="font-semibold">
                  <Link
                    href={projectPath(project.id)}
                    aria-keyshortcuts={
                      pinned ? REORDER_PIN_SHORTCUTS : undefined
                    }
                    aria-description={pinned ? reorderHint : undefined}
                    onKeyDown={(e) => {
                      if (!pinned || !e.altKey) {
                        return;
                      }
                      const offset =
                        e.key === ARROW_LEFT_KEY
                          ? -1
                          : e.key === ARROW_RIGHT_KEY
                            ? 1
                            : 0;
                      if (offset !== 0) {
                        e.preventDefault();
                        reorder(movePinBy(ids, project.id, offset));
                      }
                    }}
                    className="outline-hidden after:absolute after:inset-0"
                  >
                    {project.name}
                  </Link>
                </h3>
                {project.stage && (
                  <Badge variant="secondary" className="w-fit">
                    {PROJECT_STAGE_LABELS[project.stage]}
                  </Badge>
                )}
                {project.address && (
                  <p
                    className="text-muted-foreground truncate text-xs"
                    title={project.address}
                  >
                    {project.address}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
