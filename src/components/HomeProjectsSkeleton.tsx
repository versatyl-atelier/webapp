import { HomeWidgetCard } from "@/components/HomeWidgetCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  HOME_PROJECT_CARD_WIDTH_CLASS,
  HOME_PROJECTS_HEADING,
  HOME_WIDGET_LINKS,
  HOME_WIDGETS,
  SKELETON_ROWS,
} from "@/constants/home";
import { cn } from "@/lib/utils";

const CARDS = Array.from({ length: SKELETON_ROWS }, (_, card) => card);

export function HomeProjectsSkeleton() {
  return (
    <HomeWidgetCard
      widget={HOME_WIDGETS.projects}
      title={HOME_PROJECTS_HEADING}
      link={HOME_WIDGET_LINKS.projects}
      busy
    >
      <div className="flex gap-3 overflow-hidden p-3">
        {CARDS.map((card) => (
          <div
            key={card}
            className={cn(
              "flex shrink-0 flex-col gap-1.5",
              HOME_PROJECT_CARD_WIDTH_CLASS,
            )}
          >
            <Skeleton className="aspect-video w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </HomeWidgetCard>
  );
}
