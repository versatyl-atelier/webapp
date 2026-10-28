export const REPORT_GROUPINGS = [
  "project",
  "employee",
  "statut",
  "subtask",
] as const;

export type ReportGrouping = (typeof REPORT_GROUPINGS)[number];

export const DEFAULT_REPORT_GROUPINGS: ReportGrouping[] = ["project"];

export const GROUPING_LABELS: Record<ReportGrouping, string> = {
  project: "Par projet",
  employee: "Par employé",
  statut: "Par statut",
  subtask: "Par projet / sous-tâche / statut",
};

export const PROJECT_TYPE_FILTERS = ["all", "trello", "task"] as const;

export type ProjectTypeFilter = (typeof PROJECT_TYPE_FILTERS)[number];

export const PROJECT_TYPE_FILTER_LABELS: Record<ProjectTypeFilter, string> = {
  all: "Projets et tâches",
  trello: "Projets",
  task: "Tâches",
};

export const NO_STATUT_LABEL = "Sans statut";
export const NO_SUBTASK_LABEL = "Sans sous-tâche";
export const UNKNOWN_EMPLOYEE_LABEL = "Employé inconnu";

export const REPORT_FORM_ID_PERIOD_START = "report-start";
export const REPORT_FORM_ID_PERIOD_END = "report-end";

export const REPORT_PROJECT_PARAM = "projet";
export const REPORT_GROUPING_PARAM = "groupement";
export const REPORT_START_PARAM = "du";
export const REPORT_END_PARAM = "au";

export const PERIOD_SECTION_TITLE = "Période";
export const PERIOD_START_LABEL = "Du";
export const PERIOD_END_LABEL = "Au";
export const PERIOD_HINT = "Laissez vide pour inclure toutes les dates";
export const PROJECTS_SECTION_TITLE = "Projets pointés";
export const GROUPINGS_SECTION_TITLE = "Regroupements";
export const AVAILABLE_LIST_TITLE = "Disponibles";
export const SELECTED_LIST_TITLE = "Sélectionnés";
export const LIST_SEARCH_PLACEHOLDER = "Rechercher…";
export const TYPE_FILTER_LABEL = "Afficher";
export const NO_PROJECTS_USED_LABEL = "Aucune entrée de temps pour l'instant";
export const NO_MATCH_LABEL = "Aucun résultat";
export const ARCHIVED_LABEL = "archivé";
export const ENTRIES_LABEL = "entrées";
export const ENTRY_LABEL = "entrée";
export const LAST_USED_LABEL = "dernière";
export const ADD_SELECTED_LABEL = "Ajouter les cochés";
export const ADD_ALL_LABEL = "Tout ajouter (visibles)";
export const REMOVE_SELECTED_LABEL = "Retirer les cochés";
export const REMOVE_ALL_LABEL = "Tout retirer";
export const GENERATE_REPORT_LABEL = "Ouvrir le rapport dans un nouvel onglet";
export const PRINT_LABEL = "Imprimer";
export const GENERATED_ON_LABEL = "Généré le";
export const REPORT_INVALID_TITLE = "Rapport impossible à générer";
export const REPORT_TITLE = "Rapport";
export const TOTAL_LABEL = "Total";
export const NO_DATA_LABEL = "Aucune entrée de temps pour cette sélection";

export const PROJECT_REQUIRED_REPORT_MESSAGE =
  "Sélectionnez au moins un projet ou une tâche";
export const GROUPING_REQUIRED_MESSAGE = "Choisissez au moins un regroupement";

export const REPORT_INDENT_CLASSES = ["pl-2", "pl-6", "pl-10"];
