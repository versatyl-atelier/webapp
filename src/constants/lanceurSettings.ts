export const SETTINGS_BUTTON_LABEL = "Réglages";
export const SETTINGS_DIALOG_TITLE = "Réglages du Lanceur";
export const SETTINGS_DIALOG_DESCRIPTION =
  "Ces valeurs servent au calcul de la capacité et des disponibilités.";
export const SETTINGS_SAVED_MESSAGE = "Réglages enregistrés";

export const CAPACITY_RATIO_LABEL = "Capacité de la shop";
export const CAPACITY_RATIO_HINT =
  "Valeur de production que la shop absorbe en une semaine (10 points sur 10).";
export const CAPACITY_RATIO_SUFFIX = "$ / semaine";
export const MIN_PROD_DAYS_LABEL = "Durée plancher d'un projet";
export const MIN_PROD_DAYS_HINT =
  "Un projet ne se produit jamais plus vite que ce nombre de jours ouvrés, même si la shop est vide.";
export const MIN_PROD_DAYS_SUFFIX = "jours de production";
export const MAX_WEEK_SHARE_LABEL = "Part max d'un seul projet";
export const MAX_WEEK_SHARE_HINT =
  "Capacité qu'un projet peut accaparer en une semaine, sur les 10 points de la shop.";
export const MAX_WEEK_SHARE_SUFFIX = "points / semaine (sur 10)";

export const CLOSURES_TITLE = "Fermetures de la shop";
export const CLOSURES_HINT =
  "Jours fériés et vacances: ils sautent dans le calcul des jours de production.";
export const CLOSURE_DATE_LABEL = "Date";
export const CLOSURE_REASON_LABEL = "Raison";
export const CLOSURE_REASON_PLACEHOLDER = "Ex: Vacances de la construction";
export const CLOSURE_ADD_LABEL = "Ajouter";
export const CLOSURE_REMOVE_LABEL = "Retirer la fermeture";
export const CLOSURE_ADDED_MESSAGE = "Fermeture ajoutée";
export const CLOSURE_EXISTS_MESSAGE = "Cette date est déjà une fermeture";
export const NO_CLOSURES_LABEL = "Aucune fermeture";

export const SETTING_TYPE_NUMBER = "number";
export const MIN_PROD_DAYS_MAX = 250;
export const MAX_WEEK_SHARE_MIN = 1;
export const MAX_WEEK_SHARE_MAX = 10;
export const MAX_WEEK_SHARE_STEP = 0.5;
export const CAPACITY_RATIO_STEP = 1000;
export const CLOSURE_REASON_MAX_LENGTH = 80;
export const INVALID_CAPACITY_MESSAGE =
  "La capacité doit être un montant positif";
export const INVALID_MIN_DAYS_MESSAGE = `La durée doit être de 1 à ${MIN_PROD_DAYS_MAX} jours`;
export const INVALID_SHARE_MESSAGE = `La part doit être de ${MAX_WEEK_SHARE_MIN} à ${MAX_WEEK_SHARE_MAX} points`;

export const SETTING_DESCRIPTIONS = {
  shopCapacityRatio: "Capacité hebdomadaire de la shop ($/semaine)",
  availMinProdDays: "Durée plancher d'un projet (jours de production)",
  availMaxWeekShare: "Part max de la shop pour un seul projet (pts/semaine)",
} as const;
