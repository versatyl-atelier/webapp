import Link from "next/link";
import type { ReactNode } from "react";
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
import { addDays, formatWeekLabel, type DateKey } from "@/lib/calendar";

type WeekCrumbsProps = {
  weekStart: DateKey;
  todayWeekStart: DateKey;
  weekPath: (weekStart: DateKey) => string;
  minWeekStart?: DateKey;
  maxWeekStart?: DateKey;
};

type WeekNavButtonProps = {
  href: string;
  label: string;
  disabled: boolean;
  children: ReactNode;
};

function WeekNavButton({
  href,
  label,
  disabled,
  children,
}: WeekNavButtonProps) {
  if (disabled) {
    return (
      <Button variant="ghost" size="icon-xs" disabled aria-label={label}>
        {children}
      </Button>
    );
  }
  return (
    <Button asChild variant="ghost" size="icon-xs">
      <Link href={href} aria-label={label} title={label}>
        {children}
      </Link>
    </Button>
  );
}

export function WeekCrumbs({
  weekStart,
  todayWeekStart,
  weekPath,
  minWeekStart,
  maxWeekStart,
}: WeekCrumbsProps) {
  const previousWeekStart = addDays(weekStart, -DAYS_PER_WEEK);
  const nextWeekStart = addDays(weekStart, DAYS_PER_WEEK);

  return (
    <>
      <BreadcrumbItem role="group" aria-label={WEEK_NAV_LABEL}>
        <BreadcrumbPage className="font-bold">
          {formatWeekLabel(weekStart)}
        </BreadcrumbPage>
        <WeekNavButton
          href={weekPath(previousWeekStart)}
          label={PREVIOUS_WEEK_LABEL}
          disabled={!!minWeekStart && previousWeekStart < minWeekStart}
        >
          <ChevronLeft />
        </WeekNavButton>
        <WeekNavButton
          href={weekPath(nextWeekStart)}
          label={NEXT_WEEK_LABEL}
          disabled={!!maxWeekStart && nextWeekStart > maxWeekStart}
        >
          <ChevronRight />
        </WeekNavButton>
        <Button asChild variant="outline" size="xs">
          <Link href={weekPath(todayWeekStart)}>{TODAY_LABEL}</Link>
        </Button>
      </BreadcrumbItem>
    </>
  );
}
