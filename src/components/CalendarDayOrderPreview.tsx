import {
  PREVIEW_EYEBROW,
  PREVIEW_NEW_BADGE,
  PREVIEW_POSITION_OUT_OF,
  PREVIEW_POSITION_PREFIX,
  PREVIEW_POSITION_SUFFIX,
  EMPTY_DAY_LABEL,
} from "@/constants/calendar";
import {
  eventColorClass,
  formatDayLabel,
  formatHour,
  ordinal,
  type CalendarOccurrence,
  type DateKey,
  type DayOrderPreview,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";

type PreviewItem = Pick<
  CalendarOccurrence,
  "date" | "hour" | "title" | "color"
> & {
  key: string;
};

type CalendarDayOrderPreviewProps = {
  date: DateKey;
  preview: DayOrderPreview<PreviewItem>;
  pending: boolean;
};

export function CalendarDayOrderPreview({
  date,
  preview: { items, position },
  pending,
}: CalendarDayOrderPreviewProps) {
  return (
    <aside
      aria-live="polite"
      aria-busy={pending}
      className={cn(
        "bg-card overflow-hidden rounded-xl border shadow-sm transition-opacity",
        pending && "opacity-60",
      )}
    >
      <header className="border-b px-4 py-3">
        <p className="text-muted-foreground text-2xs font-semibold tracking-wide uppercase">
          {PREVIEW_EYEBROW}
        </p>
        <h2 className="mt-0.5 text-sm font-semibold capitalize">
          {formatDayLabel(date)}
        </h2>
      </header>
      {items.length === 0 ? (
        <p className="text-muted-foreground px-4 py-3 text-xs">
          {EMPTY_DAY_LABEL}
        </p>
      ) : (
        <ol className="flex flex-col gap-1.5 px-3 py-2.5">
          {items.map((item) => (
            <li
              key={item.key}
              className={cn(
                "flex items-center gap-2 rounded-sm px-2 py-1.5 text-xs",
                item.isNew
                  ? "border-punch-accent bg-punch-accent/10 border border-dashed"
                  : "bg-muted",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  eventColorClass(item.color),
                )}
              />
              <span className="text-muted-foreground w-10 shrink-0 tabular-nums">
                {formatHour(item.hour)}
              </span>
              <span className="min-w-0 flex-1 truncate">{item.title}</span>
              {item.isNew && (
                <span className="text-punch-accent text-2xs shrink-0 font-bold tracking-wide uppercase">
                  {PREVIEW_NEW_BADGE}
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
      <p className="text-muted-foreground border-t px-4 py-2.5 text-xs">
        {PREVIEW_POSITION_PREFIX}{" "}
        <strong className="text-foreground">{ordinal(position)}</strong>{" "}
        {PREVIEW_POSITION_SUFFIX}
        {items.length > 1 && ` (${PREVIEW_POSITION_OUT_OF} ${items.length})`}.
      </p>
    </aside>
  );
}
