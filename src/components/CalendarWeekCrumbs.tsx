import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BreadcrumbItem, BreadcrumbPage } from "@/components/ui/breadcrumb";
import {
  DAYS_PER_WEEK,
  NEXT_WEEK_LABEL,
  PREVIOUS_WEEK_LABEL,
  TODAY_LABEL,
  WEEK_NAV_LABEL,
} from "@/constants/calendar";
import {
  addDays,
  calendarWeekPath,
  formatWeekLabel,
  type DateKey,
} from "@/lib/calendar";

type CalendarWeekCrumbsProps = {
  weekStart: DateKey;
  todayWeekStart: DateKey;
};

export function CalendarWeekCrumbs({
  weekStart,
  todayWeekStart,
}: CalendarWeekCrumbsProps) {
  return (
    <>
      <BreadcrumbItem role="group" aria-label={WEEK_NAV_LABEL}>
        <BreadcrumbPage className="font-bold">
          {formatWeekLabel(weekStart)}
        </BreadcrumbPage>
        <Button asChild variant="ghost" size="icon-xs">
          <Link
            href={calendarWeekPath(addDays(weekStart, -DAYS_PER_WEEK))}
            aria-label={PREVIOUS_WEEK_LABEL}
            title={PREVIOUS_WEEK_LABEL}
          >
            <ChevronLeft />
          </Link>
        </Button>
        <Button asChild variant="ghost" size="icon-xs">
          <Link
            href={calendarWeekPath(addDays(weekStart, DAYS_PER_WEEK))}
            aria-label={NEXT_WEEK_LABEL}
            title={NEXT_WEEK_LABEL}
          >
            <ChevronRight />
          </Link>
        </Button>
        <Button asChild variant="outline" size="xs">
          <Link href={calendarWeekPath(todayWeekStart)}>{TODAY_LABEL}</Link>
        </Button>
      </BreadcrumbItem>
    </>
  );
}
