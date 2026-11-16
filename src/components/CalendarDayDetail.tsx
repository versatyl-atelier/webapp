import Link from "next/link";
import { Plus } from "lucide-react";

import { getCalendarOccurrences } from "@/actions/calendar";
import { ActionTooltip } from "@/components/ActionTooltip";
import { EventCategoryIcon } from "@/components/EventCategoryIcon";
import { Button } from "@/components/ui/button";
import { DialogTitle } from "@/components/ui/dialog";
import {
  ADD_EVENT_LABEL,
  EDIT_EVENT_LABEL,
  EMPTY_DAY_LABEL,
} from "@/constants/calendar";
import { LANCEUR_EVENT_OPEN_LABEL } from "@/constants/lanceurCalendar";
import { Role } from "@/generated/prisma/enums";
import {
  occurrenceColorClass,
  formatDayLabel,
  newCalendarEventPath,
  occurrenceHref,
  occurrenceMeta,
  type CalendarOccurrence,
  type DateKey,
} from "@/lib/calendar";
import { hasRole } from "@/lib/permissions";
import { getSession } from "@/lib/session";
import { occurrenceColorStyle } from "@/lib/projects";
import { cn } from "@/lib/utils";

type CalendarDayDetailProps = {
  date: DateKey;
  isModal?: boolean;
};

const ROW_CLASS =
  "flex items-center gap-2.5 rounded-md px-3 py-2 overflow-hidden";
const ROW_LINK_CLASS =
  "focus-visible:ring-ring transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";

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
          {occurrenceMeta(occurrence)}
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
          <Button
            render={<Link href={newCalendarEventPath(date)} />}
            nativeButton={false}
            variant="outline"
            size="sm"
          >
            <Plus />
            {ADD_EVENT_LABEL}
          </Button>
        )}
      </header>
      {occurrences.length === 0 ? (
        <p className="text-muted-foreground px-0.5 pt-4 text-sm">
          {EMPTY_DAY_LABEL}
        </p>
      ) : (
        <ul className="flex min-h-0 flex-col gap-2 overflow-y-auto pt-4">
          {occurrences.map((occurrence) => {
            const href = occurrenceHref(occurrence, canEdit);
            return (
              <li key={occurrence.key}>
                {href ? (
                  <ActionTooltip
                    label={
                      occurrence.href
                        ? LANCEUR_EVENT_OPEN_LABEL
                        : EDIT_EVENT_LABEL
                    }
                    render={
                      <Link
                        href={href}
                        style={occurrenceColorStyle(occurrence)}
                        className={cn(
                          ROW_CLASS,
                          ROW_LINK_CLASS,
                          occurrenceColorClass(occurrence),
                        )}
                      />
                    }
                  >
                    <OccurrenceRowContent occurrence={occurrence} />
                  </ActionTooltip>
                ) : (
                  <div
                    className={cn(ROW_CLASS, occurrenceColorClass(occurrence))}
                  >
                    <OccurrenceRowContent occurrence={occurrence} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
