import { EventCategoryIcon } from "@/components/EventCategoryIcon";
import {
  eventColorClass,
  occurrenceDescription,
  occurrenceSubtitle,
  type CalendarOccurrence,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";

export type ChipHighlight = "none" | "match" | "dim";

type CalendarEventChipProps = {
  occurrence: CalendarOccurrence;
  compact: boolean;
  highlight: ChipHighlight;
};

const HIGHLIGHT_CLASSES: Record<ChipHighlight, string> = {
  none: "",
  match: "ring-primary ring-2",
  dim: "opacity-20",
};

export function CalendarEventChip({
  occurrence,
  compact,
  highlight,
}: CalendarEventChipProps) {
  const description = occurrenceDescription(occurrence);

  if (compact) {
    return (
      <li
        title={description}
        className={cn(
          "h-1.5 w-4/5 shrink-0 rounded-full",
          eventColorClass(occurrence.color),
          HIGHLIGHT_CLASSES[highlight],
        )}
      >
        <span className="sr-only">{description}</span>
      </li>
    );
  }

  return (
    <li
      title={description}
      className={cn(
        "shrink-0 overflow-hidden rounded-sm px-1.5 pt-0.5 pb-1 text-white",
        eventColorClass(occurrence.color),
        HIGHLIGHT_CLASSES[highlight],
      )}
    >
      <p className="flex items-center gap-1 text-xs font-semibold">
        <EventCategoryIcon
          category={occurrence.category}
          className="text-2xs"
        />
        <span className="truncate">{occurrence.title}</span>
      </p>
      <p className="text-2xs truncate tabular-nums opacity-85">
        {occurrenceSubtitle(occurrence)}
      </p>
    </li>
  );
}
