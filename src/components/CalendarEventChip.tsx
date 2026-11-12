import Link from "next/link";

import { ActionTooltip } from "@/components/ActionTooltip";
import { EventCategoryIcon } from "@/components/EventCategoryIcon";
import {
  occurrenceColorClass,
  occurrenceDescription,
  occurrenceSubtitle,
  type CalendarOccurrence,
} from "@/lib/calendar";
import { occurrenceColorStyle } from "@/lib/projects";
import { cn } from "@/lib/utils";

export type ChipHighlight = "none" | "match" | "dim";

type CalendarEventChipProps = {
  occurrence: CalendarOccurrence;
  href: string;
  compact: boolean;
  highlight: ChipHighlight;
};

const HIGHLIGHT_CLASSES: Record<ChipHighlight, string> = {
  none: "",
  match: "ring-primary ring-2",
  dim: "opacity-20",
};

const CHIP_LINK_CLASS =
  "focus-visible:ring-ring block transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none";

export function CalendarEventChip({
  occurrence,
  href,
  compact,
  highlight,
}: CalendarEventChipProps) {
  const description = occurrenceDescription(occurrence);
  const chipStyle = occurrenceColorStyle(occurrence);
  const chipClass = cn(
    CHIP_LINK_CLASS,
    occurrenceColorClass(occurrence),
    HIGHLIGHT_CLASSES[highlight],
  );

  if (compact) {
    return (
      <li className="pointer-events-auto w-4/5 shrink-0">
        <ActionTooltip
          label={description}
          render={
            <Link
              href={href}
              scroll={false}
              style={chipStyle}
              className={cn("h-1.5 w-full rounded-full", chipClass)}
            />
          }
        >
          <span className="sr-only">{description}</span>
        </ActionTooltip>
      </li>
    );
  }

  return (
    <li className="pointer-events-auto shrink-0">
      <ActionTooltip
        label={description}
        render={
          <Link
            href={href}
            scroll={false}
            style={chipStyle}
            className={cn(
              "overflow-hidden rounded-sm px-1.5 pt-0.5 pb-1",
              chipClass,
            )}
          />
        }
      >
        <span className="flex items-center gap-1 text-xs font-semibold">
          <EventCategoryIcon
            category={occurrence.category}
            className="text-2xs"
          />
          <span className="truncate">{occurrence.title}</span>
        </span>
        <span className="text-2xs block truncate tabular-nums opacity-85">
          {occurrenceSubtitle(occurrence)}
        </span>
      </ActionTooltip>
    </li>
  );
}
