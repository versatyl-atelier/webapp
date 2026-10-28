import Link from "next/link";

import { SelectableBody, SelectableRow } from "@/components/SelectableRows";
import { WEEKDAY_LABELS } from "@/constants/calendar";
import {
  DIFFERENCE_COLUMN_LABEL,
  EMPLOYEE_COLUMN_LABEL,
  FROZEN_LABEL,
  KILOMETRAGE_COLUMN_LABEL,
  KILOMETRAGE_UNIT,
  NOT_FROZEN_LABEL,
  NO_TIMESHEET_LABEL,
  OBJECTIVE_COLUMN_LABEL,
  SELECTED_STICKY_CELL_CLASSES,
  STATUS_COLUMN_LABEL,
  TIMESHEET_CAPTION,
  TOTAL_COLUMN_LABEL,
  WEEK_NUMBER_PREFIX,
} from "@/constants/timesheet";
import { formatWeekLabel, type DateKey } from "@/lib/calendar";
import { employeeWeekPath } from "@/lib/paths";
import { formatDecimalHours } from "@/lib/time";
import {
  isoWeekNumber,
  type TimesheetRow,
  type TimesheetWeek,
} from "@/lib/timesheet";
import { cn } from "@/lib/utils";

type TimesheetTableProps = {
  weekStarts: DateKey[];
  rows: TimesheetRow[];
};

const COLUMNS_PER_WEEK = WEEKDAY_LABELS.length + 5;
const HEADER_CELL_CLASS =
  "bg-primary text-primary-foreground px-2 py-1 text-center text-xs font-bold whitespace-nowrap";
const CELL_CLASS = "px-2 py-1 text-center text-xs whitespace-nowrap";

function weekClass(weekIndex: number) {
  return weekIndex > 0 ? "border-l-2" : "";
}

function formatDifference(difference: number) {
  return `${difference >= 0 ? "+" : "-"}${formatDecimalHours(Math.abs(difference))}`;
}

function hoursCell(hours: number, key: string | number, className = "") {
  return (
    <td
      key={key}
      className={cn(
        CELL_CLASS,
        hours === 0 && "text-muted-foreground",
        className,
      )}
    >
      {formatDecimalHours(hours)}
    </td>
  );
}

function WeekCells({
  week,
  weekIndex,
}: {
  week: TimesheetWeek;
  weekIndex: number;
}) {
  return (
    <>
      {week.days.map((hours, day) =>
        hoursCell(hours, day, day === 0 ? weekClass(weekIndex) : ""),
      )}
      <td className={cn(CELL_CLASS, "font-bold")}>
        {formatDecimalHours(week.total)}
      </td>
      <td className={CELL_CLASS}>{formatDecimalHours(week.objective)}</td>
      <td
        className={cn(
          CELL_CLASS,
          "font-bold",
          week.difference >= 0 ? "text-punch-pos-diff" : "text-punch-neg-diff",
        )}
      >
        {formatDifference(week.difference)}
      </td>
      <td className={CELL_CLASS}>
        {week.kilometrage} {KILOMETRAGE_UNIT}
      </td>
      <td className={CELL_CLASS}>
        {week.frozen ? `✅ ${FROZEN_LABEL}` : `⚠️ ${NOT_FROZEN_LABEL}`}
      </td>
    </>
  );
}

export function TimesheetTable({ weekStarts, rows }: TimesheetTableProps) {
  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">{NO_TIMESHEET_LABEL}</p>
    );
  }
  const lastWeekStart = weekStarts[weekStarts.length - 1];

  return (
    <div className="bg-card overflow-x-auto rounded-lg border-2">
      <table className="w-full border-collapse">
        <caption className="sr-only">{TIMESHEET_CAPTION}</caption>
        <thead>
          <tr>
            <th rowSpan={2} scope="col" className={HEADER_CELL_CLASS}>
              {EMPLOYEE_COLUMN_LABEL}
            </th>
            {weekStarts.map((weekStart, weekIndex) => (
              <th
                key={weekStart}
                colSpan={COLUMNS_PER_WEEK}
                scope="colgroup"
                className={cn(HEADER_CELL_CLASS, weekClass(weekIndex))}
              >
                {WEEK_NUMBER_PREFIX} {isoWeekNumber(weekStart)} (
                {formatWeekLabel(weekStart)})
              </th>
            ))}
          </tr>
          <tr>
            {weekStarts.map((weekStart, weekIndex) => (
              <WeekHeaders key={weekStart} weekIndex={weekIndex} />
            ))}
          </tr>
        </thead>
        <SelectableBody rowIds={rows.map(({ id }) => id)}>
          {rows.map(({ id, name, weeks }) => (
            <SelectableRow key={id} id={id} className="border-t">
              <th
                scope="row"
                className={cn(
                  "bg-card sticky left-0 px-2 py-1 text-left text-xs font-medium whitespace-nowrap",
                  SELECTED_STICKY_CELL_CLASSES,
                )}
              >
                <Link
                  href={employeeWeekPath(id, lastWeekStart)}
                  className="hover:underline"
                >
                  {name}
                </Link>
              </th>
              {weeks.map((week, weekIndex) => (
                <WeekCells
                  key={weekStarts[weekIndex]}
                  week={week}
                  weekIndex={weekIndex}
                />
              ))}
            </SelectableRow>
          ))}
        </SelectableBody>
      </table>
    </div>
  );
}

function WeekHeaders({ weekIndex }: { weekIndex: number }) {
  const labels = [
    ...WEEKDAY_LABELS,
    TOTAL_COLUMN_LABEL,
    OBJECTIVE_COLUMN_LABEL,
    DIFFERENCE_COLUMN_LABEL,
    KILOMETRAGE_COLUMN_LABEL,
    STATUS_COLUMN_LABEL,
  ];
  return (
    <>
      {labels.map((label, index) => (
        <th
          key={label}
          scope="col"
          className={cn(HEADER_CELL_CLASS, index === 0 && weekClass(weekIndex))}
        >
          {label}
        </th>
      ))}
    </>
  );
}
