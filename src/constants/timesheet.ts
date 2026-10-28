export const PERIOD_PARAM = "periode";
export const PAY_END_PARAM = "fin";

export const TIMESHEET_PERIODS = ["current", "last", "last2", "pay"] as const;

export type TimesheetPeriod = (typeof TIMESHEET_PERIODS)[number];

export const DEFAULT_TIMESHEET_PERIOD: TimesheetPeriod = "current";

export const PERIOD_LABELS: Record<TimesheetPeriod, string> = {
  current: "Cette semaine",
  last: "Semaine dernière",
  last2: "2 dernières semaines",
  pay: "Période de paie…",
};

export const PAY_PERIOD_COUNT = 26;
export const PAY_PERIOD_WEEKS = 2;
export const WEEK_NUMBER_THURSDAY_OFFSET = 3;

export const PERIOD_LABEL = "Période";
export const PAY_END_LABEL = "Période de paie se terminant le";
export const GENERATE_LABEL = "Générer";
export const EMPLOYEE_COLUMN_LABEL = "Employé";
export const TOTAL_COLUMN_LABEL = "Total";
export const OBJECTIVE_COLUMN_LABEL = "Obj.";
export const DIFFERENCE_COLUMN_LABEL = "Écart";
export const KILOMETRAGE_COLUMN_LABEL = "Km";
export const STATUS_COLUMN_LABEL = "Statut";
export const FROZEN_LABEL = "Gelée";
export const NOT_FROZEN_LABEL = "Non gelée";
export const WEEK_NUMBER_PREFIX = "Sem.";
export const NO_TIMESHEET_LABEL = "Aucun employé à afficher";
export const TIMESHEET_CAPTION = "Feuille de temps des employés";
export const KILOMETRAGE_UNIT = "km";

export const SELECTED_ROW_CLASSES =
  "group cursor-pointer outline-none data-selected:bg-primary/25";
export const SELECTED_STICKY_CELL_CLASSES =
  "group-data-selected:bg-[color-mix(in_oklab,var(--color-primary)_25%,var(--color-card))] group-data-selected:shadow-[inset_4px_0_0_var(--color-primary)]";
