export type Tool = {
  href: string;
  icon: string;
  title: string;
  description: string;
  tags?: string[];
  disabled?: boolean;
};

export const HOME_PATH = "/";
export const HOME_LABEL = "Accueil";
export const APP_NAME = "Versatyl";

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
    href: "/lanceur-de-dates",
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
