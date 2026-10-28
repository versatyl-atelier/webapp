import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import {
  ACTIVITY_DOT_CLASSES,
  ACTIVITY_EMPTY_LABEL,
  ACTIVITY_LABELS,
  ACTIVITY_TITLE,
} from "@/constants/activity";
import {
  activityDayLabel,
  activityDetail,
  formatActivityTime,
  groupActivityByDay,
  type ActivityEvent,
} from "@/lib/activity";
import { cn } from "@/lib/utils";

type ActivityLogProps = {
  events: readonly ActivityEvent[];
};

export function ActivityLog({ events }: ActivityLogProps) {
  const days = groupActivityByDay(events);

  return (
    <SidebarGroup>
      <SidebarGroupLabel
        render={<h2 />}
        className="border-sidebar-border mb-2 rounded-none border-b font-bold uppercase"
      >
        {ACTIVITY_TITLE}
      </SidebarGroupLabel>
      <SidebarGroupContent className="space-y-3">
        {days.length === 0 ? (
          <p className="text-muted-foreground px-2 text-sm">
            {ACTIVITY_EMPTY_LABEL}
          </p>
        ) : (
          days.map(({ dayKey, events: dayEvents }) => (
            <section key={dayKey}>
              <h3 className="text-sidebar-foreground/70 px-2 text-xs font-semibold first-letter:uppercase">
                {activityDayLabel(dayKey)}
              </h3>
              <ol className="mt-1">
                {dayEvents.map((event) => {
                  const detail = activityDetail(event);
                  return (
                    <li key={event.id} className="flex gap-2 px-2 py-1.5">
                      <span
                        aria-hidden
                        className={cn(
                          "mt-1.5 size-2 shrink-0 rounded-full",
                          ACTIVITY_DOT_CLASSES[event.kind],
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-medium">
                            {ACTIVITY_LABELS[event.kind]}
                          </span>
                          <time
                            dateTime={event.at.toISOString()}
                            className="text-muted-foreground shrink-0 font-mono text-xs"
                          >
                            {formatActivityTime(event.at)}
                          </time>
                        </div>
                        {detail && (
                          <p className="text-muted-foreground text-xs wrap-break-word">
                            {detail}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))
        )}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
