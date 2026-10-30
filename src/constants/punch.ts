import type { Tool } from "@/constants/tools";

export const PUNCH_PATH = "/punch";
export const PUNCH_TASKS_PATH = `${PUNCH_PATH}/taches`;
export const PUNCH_TIMESHEET_PATH = `${PUNCH_PATH}/feuille-de-temps`;
export const PUNCH_REPORT_PATH = `${PUNCH_PATH}/rapport`;
export const PUNCH_REPORT_PRINT_PATH = `${PUNCH_REPORT_PATH}/imprimable`;

export const PUNCH_FINISH_LABEL = "Terminer";
export const PUNCH_SELECT_EMPLOYEE_PROMPT = "Sélectionner un employé";
export const EMPLOYEES_LABEL = "Employés";
export const EMPLOYEES_FILTER_LABEL = "Filtrer les employés";
export const EMPLOYEES_FILTER_PLACEHOLDER = "Filtrer les employés…";
export const NO_EMPLOYEE_LABEL = "Aucun employé";

export const PUNCH_TOOLS: Tool[] = [
  {
    href: PUNCH_PATH,
    icon: "⏱",
    title: "Punch",
    description: "Pointer mes heures",
  },
  {
    href: PUNCH_TASKS_PATH,
    icon: "✅",
    title: "Tâches",
    description: "Tâches et sous-tâches",
    managerOnly: true,
  },
  {
    href: PUNCH_TIMESHEET_PATH,
    icon: "🕒",
    title: "Feuilles de temps",
    description: "Le temps de chaque employé",
  },
  {
    href: PUNCH_REPORT_PATH,
    icon: "📈",
    title: "Rapports",
    description: "Heures par projet, statut, employé",
  },
];
