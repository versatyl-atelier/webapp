export const GANTT_DEFAULT_DAY_WIDTH = 38;
export const GANTT_INITIAL_MONTHS_BEFORE = 12;
export const GANTT_INITIAL_MONTHS_AFTER = 24;
export const GANTT_EXTEND_MONTHS = 6;
export const GANTT_TARGET_MARGIN_MONTHS = 3;
export const GANTT_EXTEND_EDGE_PX = 1500;
export const GANTT_WORKDAYS_PER_MONTH = 21.7;
export const GANTT_SCROLL_MARGIN_PX = 250;
export const GANTT_EDGE_SCROLL_ZONE_PX = 60;
export const GANTT_EDGE_SCROLL_STEP_PX = 8;
export const GANTT_NO_INDEX = -1;
export const GANTT_WEEKDAY_SEARCH_DAYS = 4;

export const GANTT_ZOOM_OPTIONS = [
  { value: "25", label: "Mini (25px)" },
  { value: "32", label: "Compact (32px)" },
  { value: "38", label: "Normal (38px)" },
  { value: "50", label: "Large (50px)" },
  { value: "70", label: "XL (70px)" },
] as const;

export const GANTT_DAY_ABBREVIATIONS = [
  "Di",
  "Lu",
  "Ma",
  "Me",
  "Je",
  "Ve",
  "Sa",
] as const;

import type { LanceurDateKind } from "@/constants/lanceurCalendar";

export const GANTT_MARK_CLASSES: Record<LanceurDateKind, string> = {
  pdm: "border-info bg-info/15 text-info",
  approval:
    "border-warning-foreground bg-warning-foreground/15 text-warning-foreground",
  delivery: "border-punch-pos-diff bg-punch-pos-diff/15 text-punch-pos-diff",
};

export const GANTT_MARK_LABELS: Record<LanceurDateKind, string> = {
  pdm: "PDM",
  approval: "Approbation",
  delivery: "Livraison",
};

export const GANTT_BAND_TYPES = {
  planning: "planif",
  production: "prod",
} as const;

export const GANTT_DRAG_MODES = {
  move: "move",
  left: "left",
  right: "right",
} as const;

export type GanttDragMode =
  (typeof GANTT_DRAG_MODES)[keyof typeof GANTT_DRAG_MODES];

export const GANTT_PROJECTS_HEADER = "Projets";
export const GANTT_PROJECT_COLUMN = "Projet";
export const GANTT_CAPACITY_TITLE = "Capacité hebdomadaire (points /10)";
export const GANTT_PREVIOUS_LABEL = "Mois précédent";
export const GANTT_NEXT_LABEL = "Mois suivant";
export const GANTT_JUMP_LABEL = "Aller à";
export const GANTT_ZOOM_LABEL = "Zoom";
export const GANTT_BAND_HELP =
  "glisser pour déplacer, bords pour redimensionner";
export const GANTT_EDIT_HINT = "Éditer pour modifier";
export const GANTT_MONTH_OPTIONS: Intl.DateTimeFormatOptions = {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
};

export const GANTT_SIDES = { past: "past", future: "future" } as const;

export type GanttSide = (typeof GANTT_SIDES)[keyof typeof GANTT_SIDES];
