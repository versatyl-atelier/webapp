import Link from "next/link";
import { Plus } from "lucide-react";

import { getCalendarOccurrences } from "@/actions/calendar";
import { EventCategoryIcon } from "@/components/EventCategoryIcon";
import { Button } from "@/components/ui/button";
import { DialogTitle } from "@/components/ui/dialog";
import {
  ADD_EVENT_LABEL,
  EDIT_EVENT_LABEL,
  EMPTY_DAY_LABEL,
} from "@/constants/calendar";
import { Role } from "@/generated/prisma/enums";
import {
  calendarEventPath,
  eventColorClass,
  formatDayLabel,
  formatHour,
  newCalendarEventPath,
  type CalendarOccurrence,
  type DateKey,
} from "@/lib/calendar";
import { hasRole } from "@/lib/permissions";
import { getSession } from "@/lib/session";
import { cn } from "@/lib/utils";

type CalendarDayDetailProps = {
  date: DateKey;
  isModal?: boolean;
};

const ROW_CLASS =
  "flex items-center gap-2.5 rounded-md px-3 py-2 text-white overflow-hidden";

function OccurrenceRowContent({
  occurrence,
}: {
  occurrence: CalendarOccurrence;
}) {
  return (
    <>
      <EventCategoryIcon
        category={occurrence.category}
        className="size-3.5 text-sm"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">
          {occurrence.title}
        </span>
        <span className="block truncate text-xs tabular-nums opacity-85">
          {formatHour(occurrence.hour)}
          {occurrence.detail && ` · ${occurrence.detail}`}
        </span>
      </span>
    </>
  );
}

export async function CalendarDayDetail({
  date,
  isModal = false,
}: CalendarDayDetailProps) {
  const [occurrences, session] = await Promise.all([
    getCalendarOccurrences(date, date),
    getSession(),
  ]);
  const canEdit = !!session && hasRole(session.role, Role.manager);

  const Heading = isModal ? DialogTitle : "h1";

  return (
    <section className="flex min-h-0 flex-col">
      <header className="flex items-center justify-between gap-3 border-b pr-8 pb-4">
        <Heading className="truncate text-lg font-semibold tracking-tight capitalize">
          {formatDayLabel(date)}
        </Heading>
        {canEdit && (
          <Button asChild variant="outline" size="sm">
            <Link href={newCalendarEventPath(date)}>
              <Plus />
              {ADD_EVENT_LABEL}
            </Link>
          </Button>
        )}
      </header>
      {occurrences.length === 0 ? (
        <p className="text-muted-foreground px-0.5 pt-4 text-sm">
          {EMPTY_DAY_LABEL}
        </p>
      ) : (
        <ul className="flex min-h-0 flex-col gap-2 overflow-y-auto pt-4">
          {occurrences.map((occurrence) => (
            <li key={occurrence.key}>
              {canEdit ? (
                <Link
                  href={calendarEventPath(occurrence.eventId)}
                  title={EDIT_EVENT_LABEL}
                  className={cn(
                    ROW_CLASS,
                    "focus-visible:ring-ring transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                    eventColorClass(occurrence.color),
                  )}
                >
                  <OccurrenceRowContent occurrence={occurrence} />
                </Link>
              ) : (
                <div
                  className={cn(ROW_CLASS, eventColorClass(occurrence.color))}
                >
                  <OccurrenceRowContent occurrence={occurrence} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
