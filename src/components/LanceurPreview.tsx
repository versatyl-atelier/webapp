import { getLanceurPreview } from "@/actions/lanceur";
import { ActionTooltip } from "@/components/ActionTooltip";
import { HomeWidgetCard } from "@/components/HomeWidgetCard";
import { HOME_SIDE_WIDGET_HEIGHT_CLASS, HOME_WIDGETS } from "@/constants/home";
import { PLAN_LOAD_CLASSES } from "@/constants/lanceurPlan";
import {
  LANCEUR_PREVIEW_EMPTY_LABEL,
  LANCEUR_PREVIEW_HEADING,
  LANCEUR_PREVIEW_LOAD_LABEL,
} from "@/constants/lanceurPreview";
import type { DateKey } from "@/lib/calendar";
import { homeWidgetLink } from "@/lib/home";
import {
  formatPreviewPoints,
  previewGridStyle,
  previewRowDescription,
  previewSpanStyle,
  type LanceurPreviewMonth,
} from "@/lib/lanceurPreview";
import { cn } from "@/lib/utils";

const ROW_CLASS = "flex items-center";
const LABEL_CLASS = "w-28 shrink-0 truncate px-3";
const TIMELINE_CLASS =
  "grid min-w-0 flex-1 grid-cols-(--preview-columns) grid-rows-1 self-stretch pr-3";
const CELL_CLASS = "col-(--preview-column) row-start-1";

type LanceurPreviewProps = {
  today: DateKey;
  interactive: boolean;
};

function MonthLines({ months }: { months: LanceurPreviewMonth[] }) {
  return months.map((month) => (
    <span
      key={month.key}
      style={previewSpanStyle(month)}
      className={cn(CELL_CLASS, "border-l")}
    />
  ));
}

export async function LanceurPreview({
  today,
  interactive,
}: LanceurPreviewProps) {
  const preview = await getLanceurPreview(today);
  const hasToday = preview.todayIndex >= 0;

  return (
    <HomeWidgetCard
      widget={HOME_WIDGETS.lanceur}
      title={LANCEUR_PREVIEW_HEADING}
      link={homeWidgetLink(HOME_WIDGETS.lanceur, interactive)}
    >
      <div
        style={previewGridStyle(preview)}
        className={cn(
          "text-2xs overflow-y-auto",
          HOME_SIDE_WIDGET_HEIGHT_CLASS,
        )}
      >
        <div aria-hidden className="bg-card sticky top-0 z-10 border-b pt-1">
          <div className={ROW_CLASS}>
            <span className={LABEL_CLASS} />
            <div className={TIMELINE_CLASS}>
              {preview.months.map((month) => (
                <span
                  key={month.key}
                  style={previewSpanStyle(month)}
                  className={cn(
                    CELL_CLASS,
                    "text-muted-foreground truncate border-l px-1 font-semibold capitalize",
                  )}
                >
                  {month.label}
                </span>
              ))}
            </div>
          </div>
          <div className={cn(ROW_CLASS, "h-4")}>
            <span className={cn(LABEL_CLASS, "text-muted-foreground")}>
              {LANCEUR_PREVIEW_LOAD_LABEL}
            </span>
            <div className={TIMELINE_CLASS}>
              {preview.weeks.map((week) => {
                const rounded = Math.round(week.points);
                return (
                  <span
                    key={week.weekStart}
                    title={formatPreviewPoints(week.points)}
                    style={previewSpanStyle(week)}
                    className={cn(
                      CELL_CLASS,
                      "text-foreground/55 text-3xs border-l text-center leading-4 font-semibold",
                      PLAN_LOAD_CLASSES[week.level],
                    )}
                  >
                    {rounded > 0 ? rounded : ""}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
        {preview.rows.length === 0 ? (
          <p className="text-muted-foreground p-3 text-sm">
            {LANCEUR_PREVIEW_EMPTY_LABEL}
          </p>
        ) : (
          <ul className="py-1">
            {preview.rows.map((row) => {
              const description = previewRowDescription(row);
              return (
                <li key={row.id}>
                  <ActionTooltip
                    label={description}
                    render={<div className={cn(ROW_CLASS, "h-5")} />}
                  >
                    <span className="sr-only">{description}</span>
                    <span
                      aria-hidden
                      className={cn(LABEL_CLASS, "font-medium")}
                    >
                      {row.label}
                    </span>
                    <div
                      aria-hidden
                      className={cn(TIMELINE_CLASS, "items-center")}
                    >
                      <MonthLines months={preview.months} />
                      {hasToday && (
                        <span className="border-info col-(--preview-today) row-start-1 h-full border-l" />
                      )}
                      {row.planningSpan && (
                        <span
                          style={previewSpanStyle(row.planningSpan, row.color)}
                          className={cn(
                            CELL_CLASS,
                            "h-2 rounded-xs bg-(--project-color)/30",
                          )}
                        />
                      )}
                      {row.productionSpan && (
                        <span
                          style={previewSpanStyle(
                            row.productionSpan,
                            row.color,
                          )}
                          className={cn(
                            CELL_CLASS,
                            "h-2 rounded-xs bg-(--project-color)",
                          )}
                        />
                      )}
                    </div>
                  </ActionTooltip>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </HomeWidgetCard>
  );
}
