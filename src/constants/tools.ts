import { MANAGER_PATH } from "@/constants/auth";
import { TRELLO_PAGE_PATH } from "@/constants/trello";

export type Tool = {
  href: string;
  icon: string;
  title: string;
  description: string;
  tags?: string[];
  disabled?: boolean;
  managerOnly?: boolean;
};

export const HOME_PATH = "/";
export const PROJECTS_PATH = "/projets";
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

export const ATELIER_TOOL_HREFS: readonly string[] = ["/punch"];

export const MANAGER_TOOL: Tool = {
  href: MANAGER_PATH,
  icon: "🔧",
  title: "Interface gestionnaire",
  description: "Comptes, config, etc.",
  managerOnly: true,
};

export const MANAGER_NAV_ITEMS = [
  { href: MANAGER_PATH, icon: "👥", title: "Comptes" },
  { href: TRELLO_PAGE_PATH, icon: "🗂️", title: "Trello" },
] as const;

export const EMPLOYEE_TOOLS: Tool[] = [
  {
    href: "/calendrier",
    icon: "📅",
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
    icon: "☄️",
    title: "Lanceur",
    description: "Planification production",
  },
];
export const KBD_CLASSES = "bg-muted text-2xs rounded-sm border px-1 font-sans";
