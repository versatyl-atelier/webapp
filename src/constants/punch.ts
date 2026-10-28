import type { Tool } from "@/constants/tools";

export const PUNCH_PATH = "/punch";
export const PUNCH_EMPLOYEES_PATH = `${PUNCH_PATH}/employes`;
export const PUNCH_DATA_PATH = `${PUNCH_PATH}/donnees`;
export const PUNCH_TASKS_PATH = `${PUNCH_DATA_PATH}/taches`;

export const PUNCH_TILE: Omit<Tool, "href"> = {
  icon: "⏱",
  title: "Punch",
  description: "Pointer mes heures",
};

export const PUNCH_DATA_TILE: Tool = {
  href: PUNCH_DATA_PATH,
  icon: "📊",
  title: "Données",
  description: "Tâches, feuilles de temps, rapports",
};

export const PUNCH_DATA_TOOLS: Tool[] = [
  {
    href: PUNCH_TASKS_PATH,
    icon: "✅",
    title: "Tâches",
    description: "Tâches et sous-tâches",
    managerOnly: true,
  },
  {
    href: `${PUNCH_DATA_PATH}/feuille-de-temps`,
    icon: "🕒",
    title: "Feuille de temps",
    description: "Le temps de chaque employé",
    disabled: true,
  },
  {
    href: `${PUNCH_DATA_PATH}/rapport`,
    icon: "📈",
    title: "Rapport",
    description: "Heures par projet, statut, employé",
    disabled: true,
  },
];
