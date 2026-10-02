import { NOTES_TAB, PROJECT_TAB_PARAM } from "@/constants/projects";

export type Tool = {
  href: string;
  icon: string;
  title: string;
  description: string;
  tags?: string[];
  disabled?: boolean;
};

export const HOME_PATH = "/";
export const PROJECTS_PATH = "/projets";
export const NOTES_TOOL_PATH = `${PROJECTS_PATH}?${PROJECT_TAB_PARAM}=${NOTES_TAB}`;
export const LANCEUR_PATH = "/lanceur-de-dates";
export const HOME_LABEL = "Accueil";
export const APP_NAME = "Versatyl";
export const HEADER_SEARCH_LABEL = "Rechercher";
export const SEARCH_PATH = "/recherche";
export const SEARCH_SHORTCUT_KEY = "k";
export const SEARCH_SHORTCUT_HINT_DEFAULT = "Ctrl K";
export const SEARCH_SHORTCUT_HINT_APPLE = "⌘ K";
export const APPLE_PLATFORM_PATTERN = /mac|iphone|ipad|ipod/i;
export const SEARCH_COMING_SOON = "Fonction à venir";

export const TOOLS: Tool[] = [
  {
    href: "/calendrier",
    icon: "🗓",
    title: "Calendrier",
    description: "Échéances et événements",
  },
  {
    href: "/punch",
    icon: "⏱",
    title: "Punch",
    description: "Timesheet atelier",
  },

  {
    href: PROJECTS_PATH,
    icon: "📁",
    title: "Projets",
    description: "Phases, pièces et listes",
  },

  {
    href: LANCEUR_PATH,
    icon: "📅",
    title: "Lanceur",
    description: "Planification production",
  },

  {
    href: NOTES_TOOL_PATH,
    icon: "📝",
    title: "Notes",
    description: "Notes des projets",
  },
];
