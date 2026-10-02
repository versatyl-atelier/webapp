import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PIPELINE_COLUMN_HEIGHT_CLASS } from "@/constants/home";
import { DateKey, formatDayLabel } from "@/lib/calendar";
import { DONE_PROJECT_STAGE, PROJECT_STAGE_LABELS } from "@/constants/projects";
import { projectsByStage } from "@/lib/projects";
import { cn } from "@/lib/utils";

type ProductionPipelineSkeletonProps = {
  today: DateKey;
};
export function ProductionPipelineSkeleton({
  today,
}: ProductionPipelineSkeletonProps) {
  const stages = projectsByStage([]);
  return (
    <Card aria-busy className="gap-0 py-0">
      <CardHeader className="grid-cols-[1fr_auto] items-center border-b py-3">
        <CardTitle>
          <Skeleton className="h-4 w-32" />
        </CardTitle>
        <CardDescription className="text-xs first-letter:uppercase">
          {formatDayLabel(today)}
        </CardDescription>
      </CardHeader>
      <div className="overflow-x-auto">
        <ol className="grid min-w-240 grid-cols-8">
          {stages.map(({ stage }) => {
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
                    "text-2xs flex items-start justify-between gap-1 font-semibold tracking-wide uppercase",
                    isDone
                      ? "text-muted-foreground/70"
                      : "text-muted-foreground",
                  )}
                >
                  <span className="hyphens-auto">
                    {PROJECT_STAGE_LABELS[stage]}
                  </span>
                  <Skeleton className="h-4 w-5 shrink-0 rounded-4xl" />
                </h3>
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </Card>
  );
}
