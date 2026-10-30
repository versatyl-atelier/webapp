import { DAYS_PER_WEEK } from "@/constants/calendar";
import {
  DEFAULT_TIMESHEET_PERIOD,
  PAY_END_PARAM,
  PAY_PERIOD_COUNT,
  PAY_PERIOD_WEEKS,
  PERIOD_PARAM,
  TIMESHEET_PERIODS,
  WEEK_NUMBER_THURSDAY_OFFSET,
  type TimesheetPeriod,
} from "@/constants/timesheet";
import {
  addDays,
  mondayOf,
  parseDateParam,
  toDateKey,
  type DateKey,
} from "@/lib/calendar";

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const MONTH_INDEX_OFFSET = 1;
const DATE_KEY_PAD = 2;

export type TimesheetEntry = {
  employeeId: number | null;
  start: Date;
  end: Date | null;
};

export type TimesheetEmployee = { id: number; name: string };

export type TimesheetObjective = {
  employeeId: number;
  weekStart: Date;
  objective: number;
};

export type TimesheetKilometrage = {
  employeeId: number;
  weekStart: Date;
  kilometrage: number;
};

export type TimesheetFrozenWeek = { employeeId: number; weekStart: Date };

export type TimesheetSource = {
  weekStarts: readonly DateKey[];
  employees: readonly TimesheetEmployee[];
  entries: readonly TimesheetEntry[];
  objectives: readonly TimesheetObjective[];
  kilometrages: readonly TimesheetKilometrage[];
  frozenWeeks: readonly TimesheetFrozenWeek[];
  defaultObjective: number;
};

export type TimesheetWeek = {
  days: number[];
  total: number;
  objective: number;
  difference: number;
  kilometrage: number;
  frozen: boolean;
};

export type TimesheetRow = {
  id: number;
  name: string;
  weeks: TimesheetWeek[];
};

export function parsePeriod(
  value: string | string[] | undefined,
): TimesheetPeriod {
  const candidate = Array.isArray(value) ? value[0] : value;
  return (
    TIMESHEET_PERIODS.find((period) => period === candidate) ??
    DEFAULT_TIMESHEET_PERIOD
  );
}

export function resolveTimesheetParams(
  params: { [key: string]: string | string[] | undefined },
  today: DateKey,
) {
  const period = parsePeriod(params[PERIOD_PARAM]);
  const payEnds = payPeriodEnds(today);
  const payEnd = parseDateParam(params[PAY_END_PARAM], payEnds[0]);
  return { period, payEnds, payEnd };
}

export function payPeriodEnds(today: DateKey): DateKey[] {
  const currentSunday = addDays(mondayOf(today), DAYS_PER_WEEK - 1);
  return Array.from({ length: PAY_PERIOD_COUNT }, (_, index) =>
    addDays(currentSunday, -index * PAY_PERIOD_WEEKS * DAYS_PER_WEEK),
  );
}

export function periodWeekStarts(
  period: TimesheetPeriod,
  today: DateKey,
  payEnd: DateKey,
): DateKey[] {
  const thisMonday = mondayOf(today);
  switch (period) {
    case "current":
      return [thisMonday];
    case "last":
      return [addDays(thisMonday, -DAYS_PER_WEEK)];
    case "last2":
      return [
        addDays(thisMonday, -PAY_PERIOD_WEEKS * DAYS_PER_WEEK),
        addDays(thisMonday, -DAYS_PER_WEEK),
      ];
    case "pay": {
      const lastMonday = mondayOf(payEnd);
      return [addDays(lastMonday, -DAYS_PER_WEEK), lastMonday];
    }
  }
}

export function isoWeekNumber(weekStart: DateKey): number {
  const thursday = new Date(
    `${addDays(weekStart, WEEK_NUMBER_THURSDAY_OFFSET)}T00:00:00Z`,
  );
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  const dayOfYear =
    Math.round((thursday.getTime() - yearStart.getTime()) / MS_PER_DAY) + 1;
  return Math.ceil(dayOfYear / DAYS_PER_WEEK);
}

export function localDateKeyOf(date: Date): DateKey {
  const year = date.getFullYear();
  const month = String(date.getMonth() + MONTH_INDEX_OFFSET).padStart(
    DATE_KEY_PAD,
    "0",
  );
  const day = String(date.getDate()).padStart(DATE_KEY_PAD, "0");
  return `${year}-${month}-${day}`;
}

function entryHours({ start, end }: TimesheetEntry): number {
  return end ? (end.getTime() - start.getTime()) / MS_PER_HOUR : 0;
}

function weekDays(weekStart: DateKey): DateKey[] {
  return Array.from({ length: DAYS_PER_WEEK }, (_, index) =>
    addDays(weekStart, index),
  );
}

function buildWeek(
  employeeId: number,
  weekStart: DateKey,
  {
    entries,
    objectives,
    kilometrages,
    frozenWeeks,
    defaultObjective,
  }: TimesheetSource,
): TimesheetWeek {
  const hoursByDay = new Map<DateKey, number>();
  entries
    .filter((entry) => entry.employeeId === employeeId)
    .forEach((entry) => {
      const day = localDateKeyOf(entry.start);
      hoursByDay.set(day, (hoursByDay.get(day) ?? 0) + entryHours(entry));
    });

  const days = weekDays(weekStart).map((day) => hoursByDay.get(day) ?? 0);
  const total = days.reduce((sum, hours) => sum + hours, 0);
  const isThisWeek = (row: { employeeId: number; weekStart: Date }) =>
    row.employeeId === employeeId && toDateKey(row.weekStart) === weekStart;
  const objective = objectives.find(isThisWeek)?.objective ?? defaultObjective;

  return {
    days,
    total,
    objective,
    difference: total - objective,
    kilometrage: kilometrages.find(isThisWeek)?.kilometrage ?? 0,
    frozen: frozenWeeks.some(isThisWeek),
  };
}

export function buildTimesheet(source: TimesheetSource): TimesheetRow[] {
  return source.employees.map(({ id, name }) => ({
    id,
    name,
    weeks: source.weekStarts.map((weekStart) =>
      buildWeek(id, weekStart, source),
    ),
  }));
}
