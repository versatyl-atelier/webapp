import { CALENDAR_PATH } from "@/constants/calendar";
import { LANCEUR_PATH, PROJECTS_PATH } from "@/constants/tools";
import { Role } from "@/generated/prisma/enums";

export const APPLICATIONS_HEADING = "Applications";

export const TODAY_HEADING = "Aujourd'hui";
export const TOMORROW_LABEL = "Demain";
export const EMPTY_TODAY_LABEL = "Aucun événement aujourd'hui ni demain";

export const WEEK_HEADING = "Cette semaine";

export const HOME_PROJECTS_HEADING = "Projets épinglés et récents";
export const HOME_PROJECTS_EMPTY_LABEL =
  "Épinglez ou consultez un projet pour le retrouver ici.";
export const HOME_PROJECTS_LIMIT = 12;
export const HOME_PINNED_PROJECT_LABEL = "Épinglé";

export const LANCEUR_LINK_LABEL = "Lanceur";
export const CALENDAR_LINK_LABEL = "Calendrier";
export const PROJECTS_LINK_LABEL = "Projets";

export const SKELETON_ROWS = 4;
export const HOME_TITLE_SEPARATOR = " — ";
export const HOME_SIDE_WIDGET_HEIGHT_CLASS = "h-60";
export const HOME_WEEK_HEIGHT_CLASS = "h-44";
export const HOME_PROJECT_CARD_WIDTH_CLASS = "w-40";

export const HOME_WIDGETS = {
  today: "today",
  lanceur: "lanceur",
  week: "week",
  projects: "projects",
} as const;

export type HomeWidgetId = (typeof HOME_WIDGETS)[keyof typeof HOME_WIDGETS];

export const HOME_WIDGET_WIDTHS = { half: "half", full: "full" } as const;

export type HomeWidgetWidth =
  (typeof HOME_WIDGET_WIDTHS)[keyof typeof HOME_WIDGET_WIDTHS];

export const HOME_WIDGET_WIDTH_CLASSES: Record<HomeWidgetWidth, string> = {
  half: "col-span-full md:col-span-6",
  full: "col-span-full",
};

export type HomeWidgetSlot = { widget: HomeWidgetId; width: HomeWidgetWidth };

export const DEFAULT_HOME_LAYOUT: readonly HomeWidgetSlot[] = [
  { widget: HOME_WIDGETS.today, width: HOME_WIDGET_WIDTHS.half },
  { widget: HOME_WIDGETS.lanceur, width: HOME_WIDGET_WIDTHS.half },
  { widget: HOME_WIDGETS.week, width: HOME_WIDGET_WIDTHS.full },
  { widget: HOME_WIDGETS.projects, width: HOME_WIDGET_WIDTHS.full },
];

export const HOME_WIDGET_MIN_ROLES: Record<HomeWidgetId, Role> = {
  today: Role.atelier,
  lanceur: Role.atelier,
  week: Role.atelier,
  projects: Role.employee,
};

export const HOME_LINKS_MIN_ROLE = Role.employee;

export type HomeWidgetLink = { href: string; label: string };

export const HOME_WIDGET_LINKS: Record<HomeWidgetId, HomeWidgetLink> = {
  today: { href: CALENDAR_PATH, label: CALENDAR_LINK_LABEL },
  lanceur: { href: LANCEUR_PATH, label: LANCEUR_LINK_LABEL },
  week: { href: CALENDAR_PATH, label: CALENDAR_LINK_LABEL },
  projects: { href: PROJECTS_PATH, label: PROJECTS_LINK_LABEL },
};
