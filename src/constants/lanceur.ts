import { CALENDAR_LOCALE } from "@/constants/calendar";
import { LanceurOptionField } from "@/generated/prisma/enums";

export const LANCEUR_TABLEAU_PATH = "/lanceur-de-dates/tableau";
export const LANCEUR_TABLEAU_LABEL = "Tableau";
export const LANCEUR_LABEL = "Lanceur de dates";
export const LANCEUR_SIGNED_FIELD_LABEL = "Signé";
export const LANCEUR_APPROVED_FIELD_LABEL = "Approuvé";

export const LANCEUR_CHANNEL_NAME = "lanceur-de-dates";
export const LANCEUR_POLL_INTERVAL_MS = 30_000;

export const LANCEUR_LOCALE = CALENDAR_LOCALE;
export const LANCEUR_NO_VALUE_LABEL = "—";
export const LANCEUR_PHASE_SEPARATOR = " · ";
export const LANCEUR_DAY_MONTH_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
};
export const LANCEUR_CURRENCY = "CAD";
export const LANCEUR_MAX_COMMENT_LENGTH = 2000;
export const LANCEUR_MAX_STORED_COMMENT_LENGTH = 20000;
export const LANCEUR_COMMENT_TOO_LONG_MESSAGE = "Commentaire trop long";
export const LANCEUR_MAX_OPTION_LENGTH = 60;
export const LANCEUR_MAX_PRIORITY = 9999;

export const LANCEUR_OPTION_FIELDS = [
  LanceurOptionField.etape,
  LanceurOptionField.installateur,
] as const;

export const LANCEUR_OPTION_TITLES: Record<LanceurOptionField, string> = {
  [LanceurOptionField.etape]: "Étapes",
  [LanceurOptionField.installateur]: "Installateurs",
};

export const LANCEUR_TABLE_TITLE = "Tableau du Lanceur";
export const LANCEUR_TABLE_EMPTY_LABEL = "Aucun projet au Lanceur";
export const LANCEUR_NO_RESPONSIBLE_LABEL = "Aucun responsable";
export const LANCEUR_ADD_PHASE_LABEL = "Ajouter un projet";
export const LANCEUR_ADD_PHASE_EMPTY_LABEL = "Aucun projet disponible";
export const LANCEUR_REMOVE_PHASE_LABEL = "Retirer du Lanceur";
export const LANCEUR_MANAGE_OPTIONS_LABEL = "Gérer les listes";
export const LANCEUR_NEW_OPTION_PLACEHOLDER = "Nouvelle valeur";
export const LANCEUR_ADD_OPTION_LABEL = "Ajouter";
export const LANCEUR_DELETE_OPTION_LABEL = "Retirer";
export const LANCEUR_GENERATED_PREFIX = "Généré le";

export const LANCEUR_COLUMNS = {
  priority: "Prior.",
  etape: "Étape",
  signed: "Signé",
  approved: "Approuvé",
  responsible: "Responsable",
  project: "Projet",
  price: "Soumission avant tx",
  installateur: "Installateurs",
  pdm: "PDM",
  approval: "Appro. plans",
  delivery: "Livraison",
  comment: "Commentaires",
} as const;

export const LANCEUR_COLUMN_ABBREVIATIONS = {
  priority: "Pri.",
  signed: "S",
  approved: "A",
} as const;

export const LANCEUR_PHASE_NOT_FOUND_MESSAGE = "Projet introuvable";
export const LANCEUR_PHASE_ALREADY_ADDED_MESSAGE =
  "Ce projet est déjà au Lanceur";
export const LANCEUR_OPTION_EXISTS_MESSAGE = "Cette valeur existe déjà";
export const LANCEUR_OPTION_REQUIRED_MESSAGE = "La valeur est requise";
export const LANCEUR_UNKNOWN_OPTION_MESSAGE = "Valeur absente de la liste";
export const LANCEUR_INVALID_DATE_MESSAGE = "Date invalide";
export const LANCEUR_SAVE_ERROR_MESSAGE = "Enregistrement impossible";

export const LANCEUR_NONE_VALUE = "__none__";

export const LANCEUR_NAV_ITEMS = [
  { href: "/lanceur-de-dates", icon: "☄️", title: LANCEUR_LABEL },
  { href: LANCEUR_TABLEAU_PATH, icon: "📋", title: LANCEUR_TABLEAU_LABEL },
] as const;

export const LANCEUR_IMPORT_ID_PREFIX = "lanceur_";
export const LANCEUR_IMPORT_UNASSIGNED_LABELS: readonly string[] = [
  "no name",
  "non attribué",
];

export const LANCEUR_IMPORT_APPLY_FLAG = "--apply";
export const LANCEUR_IMPORT_USAGE =
  "Usage: npm run db:import-lanceur -- <chemin vers lanceur_dates.db> [--apply]";
export const LANCEUR_IMPORT_DRY_RUN_LABEL = "SIMULATION: rien n'est écrit";
export const LANCEUR_IMPORT_WRITE_LABEL = "ÉCRITURE";
export const LANCEUR_IMPORT_DONE_LABEL = "Import terminé";
export const LANCEUR_IMPORT_RERUN_HINT = "Relancer avec --apply pour écrire";

export const LANCEUR_PRINT_COLUMN_WIDTH_CLASSES = [
  "print:w-[3%]",
  "print:w-[8%]",
  "print:w-[3%]",
  "print:w-[3%]",
  "print:w-[9%]",
  "print:w-[17%]",
  "print:w-[7%]",
  "print:w-[7%]",
  "print:w-[7%]",
  "print:w-[7%]",
  "print:w-[7%]",
  "print:w-[22%]",
] as const;
export const LANCEUR_PRINT_CHECK = "✓";
export const LANCEUR_PRINT_SUBTITLE = "Atelier Versatyl";
export const LANCEUR_PRINT_FOOTER = "Lanceur de dates — Atelier Versatyl";
export const LANCEUR_ACTIVE_PROJECTS_SINGULAR = "projet actif";
export const LANCEUR_ACTIVE_PROJECTS_PLURAL = "projets actifs";

export const LANCEUR_FALLBACK_COLOR = "#71717a";
