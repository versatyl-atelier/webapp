import type { ReactNode } from "react";

import { HomeWidgetCard } from "@/components/HomeWidgetCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SKELETON_ROWS,
  type HomeWidgetId,
  type HomeWidgetLink,
} from "@/constants/home";
import { cn } from "@/lib/utils";

const ROWS = Array.from({ length: SKELETON_ROWS }, (_, row) => row);

type HomeWidgetSkeletonProps = {
  widget: HomeWidgetId;
  title: ReactNode;
  link: HomeWidgetLink | null;
  heightClass: string;
};

export function HomeWidgetSkeleton({
  widget,
  title,
  link,
  heightClass,
}: HomeWidgetSkeletonProps) {
  return (
    <HomeWidgetCard widget={widget} title={title} link={link} busy>
      <div className={cn("flex flex-col gap-2 p-3", heightClass)}>
        {ROWS.map((row) => (
          <Skeleton key={row} className="h-5 w-full" />
        ))}
      </div>
    </HomeWidgetCard>
  );
}
