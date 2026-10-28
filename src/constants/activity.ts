export const ACTIVITY_KINDS = [
  "punchStarted",
  "punchEnded",
  "punchCancelled",
  "manualAdded",
  "entryCopied",
  "entryEdited",
  "weekFrozen",
  "weekUnfrozen",
  "objectivesSaved",
] as const;

export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export const ACTIVITY_GROUPABLE_KINDS: readonly ActivityKind[] = [
  "punchStarted",
  "punchEnded",
  "punchCancelled",
];

export const PUNCH_ENTRY_METHOD = "punch";

export const ACTIVITY_EDIT_GRACE_MS = 60 * 1000;
export const ACTIVITY_GROUP_WINDOW_MS = 2 * 1000;

export const ACTIVITY_TITLE = "Journal de la semaine";
export const ACTIVITY_EMPTY_LABEL = "Aucune activité cette semaine.";
export const ACTIVITY_UNKNOWN_SUBJECT_LABEL = "Projet inconnu";
export const ACTIVITY_NAME_SEPARATOR = ", ";
export const ACTIVITY_DETAIL_SEPARATOR = " · ";
export const ACTIVITY_OUT_OF_LABEL = "sur";
export const ACTIVITY_HOURS_UNIT = "h";
export const ACTIVITY_KILOMETRAGE_UNIT = "km";

export const ACTIVITY_LABELS: Record<ActivityKind, string> = {
  punchStarted: "Punch démarré",
  punchEnded: "Punch terminé",
  punchCancelled: "Punch annulé",
  manualAdded: "Ajout manuel",
  entryCopied: "Entrée copiée",
  entryEdited: "Entrée modifiée",
  weekFrozen: "Semaine gelée",
  weekUnfrozen: "Semaine dégelée",
  objectivesSaved: "Objectifs sauvegardés",
};

export const ACTIVITY_DOT_CLASSES: Record<ActivityKind, string> = {
  punchStarted: "bg-punch-pos-diff",
  punchEnded: "bg-primary",
  punchCancelled: "bg-punch-neg-diff",
  manualAdded: "bg-muted-foreground",
  entryCopied: "bg-muted-foreground",
  entryEdited: "bg-warning-border",
  weekFrozen: "bg-primary",
  weekUnfrozen: "bg-warning-border",
  objectivesSaved: "bg-muted-foreground",
};
