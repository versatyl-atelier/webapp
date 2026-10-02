import { Card, CardAction, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CALENDAR_PATH } from "@/constants/calendar";
import {
  CALENDAR_LINK_LABEL,
  SKELETON_ROWS,
  TODAY_EVENTS_LIST_HEIGHT_CLASS,
  TODAY_HEADING,
} from "@/constants/home";
import { DateKey, formatDayMonth } from "@/lib/calendar";
import { HomeCardLink } from "@/components/HomeCardLink";
import { cn } from "@/lib/utils";

const ROWS = Array.from({ length: SKELETON_ROWS }, (_, row) => row);
type TodayEventsSkeletonProps = {
  today: DateKey;
};
export function TodayEventsSkeleton({ today }: TodayEventsSkeletonProps) {
  return (
    <Card size="sm" aria-busy className="gap-0 py-0">
      <CardHeader className="bg-muted/50 border-b py-2.5">
        <CardTitle className="font-semibold">
          {TODAY_HEADING} — {formatDayMonth(today)}
        </CardTitle>
        <CardAction>
          <HomeCardLink href={CALENDAR_PATH}>
            {CALENDAR_LINK_LABEL}
          </HomeCardLink>
        </CardAction>
      </CardHeader>
      <ul className={cn("overflow-y-auto", TODAY_EVENTS_LIST_HEIGHT_CLASS)}>
        {ROWS.map((row) => (
          <li
            key={row}
            className="flex items-center gap-2.5 border-b px-3 py-2 last:border-b-0"
          >
            <Skeleton className="h-3 w-11 shrink-0" />
            <Skeleton className="size-5 shrink-0 rounded-sm" />
            <Skeleton className="h-3 flex-1" />
          </li>
        ))}
      </ul>
    </Card>
  );
}
