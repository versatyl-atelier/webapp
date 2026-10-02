import Link from "next/link";

import { getPipelineProjects } from "@/actions/projects";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  EMPTY_PIPELINE_LABEL,
  PIPELINE_COLUMN_HEIGHT_CLASS,
} from "@/constants/home";
import { DONE_PROJECT_STAGE, PROJECT_STAGE_LABELS } from "@/constants/projects";
import { formatDayLabel, type DateKey } from "@/lib/calendar";
import { projectPath } from "@/lib/paths";
import {
  activeProjectCount,
  activeProjectsLabel,
  projectColorStyle,
  projectsByStage,
} from "@/lib/projects";
import { cn } from "@/lib/utils";

type ProductionPipelineProps = {
  today: DateKey;
};

export async function ProductionPipeline({ today }: ProductionPipelineProps) {
  const projects = await getPipelineProjects();
  const stages = projectsByStage(projects);

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="grid-cols-[1fr_auto] items-center border-b py-3">
        <CardTitle className="text-sm font-semibold">
          {activeProjectsLabel(activeProjectCount(stages))}
        </CardTitle>
        <CardDescription className="text-xs first-letter:uppercase">
          {formatDayLabel(today)}
        </CardDescription>
      </CardHeader>
      {projects.length === 0 ? (
        <p className="text-muted-foreground p-4 text-sm">
          {EMPTY_PIPELINE_LABEL}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <ol className="grid min-w-240 grid-cols-8">
            {stages.map(({ stage, projects: stageProjects }) => {
              const isDone = stage === DONE_PROJECT_STAGE;
              return (
                <li
                  key={stage}
                  className={cn(
                    "flex flex-col gap-2.5 border-r px-2.5 py-3 last:border-r-0",
                    PIPELINE_COLUMN_HEIGHT_CLASS,
                    isDone && "bg-muted/50",
                  )}
                >
                  <h3
                    className={cn(
                      "text-2xs grid grid-cols-[minmax(0,1fr)_auto] items-start gap-1 font-semibold tracking-wide uppercase",
                      isDone
                        ? "text-muted-foreground/70"
                        : "text-muted-foreground",
                    )}
                  >
                    <span className="hyphens-auto">
                      {PROJECT_STAGE_LABELS[stage]}
                    </span>
                    <Badge variant="secondary" className="text-2xs shrink-0">
                      {stageProjects.length}
                    </Badge>
                  </h3>
                  <ul className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
                    {stageProjects.map(({ id, name, color }) => (
                      <li key={id}>
                        <Link
                          href={projectPath(id)}
                          title={name}
                          style={projectColorStyle(color)}
                          className={cn(
                            "focus-visible:ring-ring block truncate rounded-sm bg-(--project-color) px-2 py-1 text-xs font-medium text-white transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                            isDone && "opacity-45",
                          )}
                        >
                          {name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </Card>
  );
}
