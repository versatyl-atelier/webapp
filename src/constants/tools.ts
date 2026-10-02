export type Tool = {
  href: string;
  icon: string;
  title: string;
  description: string;
  tags?: string[];
  disabled?: boolean;
};

export const HOME_PATH = "/";
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
    href: "/projets",
    icon: "📁",
    title: "Projets",
    description: "Phases, pièces et listes",
    tags: ["Nouveau"],
  },
  {
    href: "/punch",
    icon: "⏱",
    title: "Punch",
    description: "Timesheet atelier",
  },
  {
    href: LANCEUR_PATH,
    icon: "📅",
    title: "Lanceur",
    description: "Planification production",
  },
  {
    href: "/calendrier",
    icon: "🗓",
    title: "Calendrier",
    description: "Échéances et événements",
  },
];
