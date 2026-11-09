export const PLAN_POINTS_SCALE = 10;
export const PLAN_EPSILON = 1e-9;
export const PLAN_AVAILABILITY_HORIZON_WEEKS = 104;
export const PLAN_WEEKS_PER_YEAR = 52;

export const PLAN_DEFAULT_CAPACITY_RATIO = 80000;
export const PLAN_DEFAULT_MIN_PROD_DAYS = 30;
export const PLAN_DEFAULT_MAX_WEEK_SHARE = 10;
export const PLAN_DEFAULT_AVAILABILITY_AMOUNT = 80000;

export const PLAN_SETTING_KEYS = {
  capacityRatio: "shopCapacityRatio",
  minProdDays: "availMinProdDays",
  maxWeekShare: "availMaxWeekShare",
} as const;

export const PLAN_LOAD_LEVELS = {
  none: "none",
  low: "low",
  medium: "medium",
  high: "high",
  full: "full",
  warning: "warning",
  over: "over",
} as const;

export type PlanLoadLevel =
  (typeof PLAN_LOAD_LEVELS)[keyof typeof PLAN_LOAD_LEVELS];

export const PLAN_LOAD_THRESHOLDS = {
  low: 4,
  medium: 7,
  high: 9,
  full: 10,
  warning: 12,
} as const;

export const PLAN_LOAD_CLASSES: Record<PlanLoadLevel, string> = {
  none: "",
  low: "bg-muted-foreground/25",
  medium: "bg-info/30",
  high: "bg-info/50",
  full: "bg-punch-pos-diff/40",
  warning: "bg-warning-foreground/40",
  over: "bg-destructive/50",
};

export const PLAN_TODAY_LABEL = "Aujourd'hui";
export const PLAN_AMOUNT_LABEL = "Projet de";
export const PLAN_CLOSURE_LABEL = "Fermeture shop";
export const PLAN_NO_AVAILABILITY_PREFIX = "Aucune disponibilité d'ici";
export const PLAN_NO_AVAILABILITY_UNIT = "ans";
export const PLAN_AVAILABLE_FROM_LABEL = "Dispo dès le";
export const PLAN_DELIVERY_LABEL = "livraison ~";
export const PLAN_LEGEND_PLANNING =
  "Planification (couleur du responsable, pâle)";
export const PLAN_LEGEND_PRODUCTION = "Production (couleur du responsable)";
export const PLAN_LEGEND_CAPACITY = "Capacité /10";
export const PLAN_LONG_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
};

export const PLAN_LEGEND_SWATCH_LEVELS = [
  PLAN_LOAD_LEVELS.medium,
  PLAN_LOAD_LEVELS.full,
  PLAN_LOAD_LEVELS.warning,
  PLAN_LOAD_LEVELS.over,
] as const;
