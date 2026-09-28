import {
  CalendarEventColor,
  CalendarEventType,
  RecurrenceEnd,
  RecurrenceFrequency,
} from "@/generated/prisma/enums";

export const CALENDAR_PATH = "/calendrier";
export const CALENDAR_EVENTS_PATH = `${CALENDAR_PATH}/evenements`;
export const NEW_CALENDAR_EVENT_PATH = `${CALENDAR_EVENTS_PATH}/nouveau`;
export const CALENDAR_WEEK_PARAM = "semaine";
export const CALENDAR_DATE_PARAM = "date";

export const CALENDAR_TIME_ZONE = "America/Toronto";
export const CALENDAR_LOCALE = "fr-CA";

export const DAYS_PER_WEEK = 7;
export const WORK_DAYS_PER_WEEK = 5;
export const MAX_VISIBLE_WEEKS = 12;
export const DEFAULT_VISIBLE_WEEKS = 5;
export const MIN_WEEK_ROW_HEIGHT_PX = 128;

export const CALENDAR_COLUMNS_CLASS =
  "grid-cols-[repeat(5,minmax(0,1fr))_repeat(2,minmax(0,0.25fr))]";

export const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const HOURS_PER_DAY = 24;
export const MIDNIGHT_HOUR = 0;
export const NOON_HOUR = 12;
export const DEFAULT_EVENT_HOUR = 9;
export const DEFAULT_EVENT_COLOR = CalendarEventColor.blue;
export const DEFAULT_EVENT_TYPE = CalendarEventType.manuel;
export const DEFAULT_FREQUENCY = RecurrenceFrequency.weekly;
export const DEFAULT_INTERVAL = 1;
export const DEFAULT_END_COUNT = 10;
export const WEEKDAYS_SEPARATOR = ",";
export const REPEATS_VALUE = "on";

export const RECURRENT_CATEGORY = "recurrent";

export type EventCategory = CalendarEventType | typeof RECURRENT_CATEGORY;

export const EVENT_CATEGORIES: readonly EventCategory[] = [
  CalendarEventType.livraison,
  CalendarEventType.installation,
  RECURRENT_CATEGORY,
  CalendarEventType.manuel,
];

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  livraison: "Livraison",
  installation: "Installation",
  recurrent: "Récurrent",
  manuel: "Manuel",
};

export const EVENT_TYPE_EMOJIS: Partial<Record<EventCategory, string>> = {
  livraison: "🚚",
  installation: "🔨",
};

export const LANCEUR_EVENT_TYPES: readonly CalendarEventType[] = [
  CalendarEventType.livraison,
  CalendarEventType.installation,
];

export const EVENT_COLOR_BG_CLASSES: Record<CalendarEventColor, string> = {
  blue: "bg-blue-700",
  teal: "bg-teal-700",
  purple: "bg-violet-700",
  orange: "bg-orange-700",
  pink: "bg-pink-700",
  indigo: "bg-indigo-700",
  lime: "bg-lime-700",
  amber: "bg-amber-700",
};

export const EVENT_COLOR_LABELS: Record<CalendarEventColor, string> = {
  blue: "Bleu",
  teal: "Sarcelle",
  purple: "Violet",
  orange: "Orange",
  pink: "Rose",
  indigo: "Indigo",
  lime: "Lime",
  amber: "Ambre",
};

export const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  daily: "Quotidien",
  weekly: "Hebdomadaire",
  monthly: "Mensuel",
  yearly: "Annuel",
};

export const FREQUENCY_UNIT_LABELS: Record<RecurrenceFrequency, string> = {
  daily: "jour(s)",
  weekly: "semaine(s)",
  monthly: "mois",
  yearly: "année(s)",
};

export const RECURRENCE_END_LABELS: Record<RecurrenceEnd, string> = {
  never: "Jamais",
  date: "Le",
  count: "Après",
};

export const HOUR_MODES = ["24h", "ampm"] as const;
export type HourMode = (typeof HOUR_MODES)[number];
export const HOUR_MODE_LABELS: Record<HourMode, string> = {
  "24h": "24 h",
  ampm: "AM · PM",
};
export const AM_LABEL = "AM";
export const PM_LABEL = "PM";

export const WEEKDAY_LABELS = [
  "Lun",
  "Mar",
  "Mer",
  "Jeu",
  "Ven",
  "Sam",
  "Dim",
] as const;

export const WEEKDAY_NUMBERS_FROM_MONDAY = [1, 2, 3, 4, 5, 6, 0] as const;

export const CALENDAR_TITLE = "Calendrier";
export const WEEK_NAV_LABEL = "Navigation par semaine";
export const EVENT_SINGULAR_LABEL = "événement";
export const EVENT_PLURAL_LABEL = "événements";
export const TODAY_LABEL = "Aujourd'hui";
export const PREVIOUS_WEEK_LABEL = "Semaine précédente";
export const NEXT_WEEK_LABEL = "Semaine suivante";
export const SEARCH_PLACEHOLDER = "Rechercher un événement, un client…";
export const SEARCH_LABEL = "Rechercher dans le calendrier";
export const CATEGORY_FILTER_LABEL = "Filtrer par type d'événement";
export const NEW_EVENT_LABEL = "Nouvel événement";
export const EDIT_EVENT_LABEL = "Modifier l'événement";
export const ADD_EVENT_LABEL = "Ajouter";
export const EMPTY_DAY_LABEL = "Aucun événement ce jour.";
export const MIDNIGHT_LABEL = "Minuit";
export const NOON_LABEL = "Midi";
export const HOUR_SUFFIX = "h";

export const PROJECT_SEARCH_LABEL = "Rechercher un projet existant";
export const PROJECT_SEARCH_PLACEHOLDER =
  "Tape un nom de client pour réutiliser un projet…";
export const PROJECT_SEARCH_HINT =
  "Reprend le titre et la couleur d'un événement existant. Sinon, remplis les champs ci-dessous.";
export const PROJECT_SEARCH_EMPTY = "Aucun projet trouvé";
export const TYPE_LABEL = "Type";
export const LANCEUR_NOTE =
  "Normalement généré automatiquement par le Lanceur — à utiliser seulement pour un cas particulier.";
export const TITLE_LABEL = "Titre";
export const TITLE_PLACEHOLDER = "Ex. Gagné Paradis";
export const DETAIL_LABEL = "Détail (2e ligne, optionnel)";
export const DETAIL_PLACEHOLDER = "Ex. Camion 5T — quai 2";
export const DATE_LABEL = "Date";
export const START_DATE_LABEL = "Date de départ";
export const HOUR_LABEL = "Heure";
export const HOUR_HINT = "Détermine l'ordre de l'événement dans la journée.";
export const COLOR_LABEL = "Couleur";
export const COLOR_HINT =
  "Un jour, la couleur viendra automatiquement du projet. En attendant : choix manuel.";
export const REPEATS_LABEL = "Cet événement se répète";
export const FREQUENCY_LABEL = "Fréquence";
export const INTERVAL_LABEL_PREFIX = "Tous les";
export const WEEKDAYS_LABEL = "Jours de la semaine";
export const END_LABEL = "Fin";
export const OCCURRENCES_LABEL = "occurrence(s)";
export const CANCEL_LABEL = "Annuler";
export const CREATE_EVENT_LABEL = "Créer l'événement";
export const SAVE_EVENT_LABEL = "Enregistrer";
export const DELETE_EVENT_LABEL = "Supprimer";
export const SERIES_EDIT_NOTE =
  "Les modifications s'appliquent à toutes les occurrences de la série.";
export const BACK_TO_CALENDAR_LABEL = "Retour au calendrier";

export const PREVIEW_EYEBROW = "Ordre dans la journée";
export const PREVIEW_NEW_BADGE = "Nouveau";
export const PREVIEW_POSITION_PREFIX = "Ce sera le";
export const PREVIEW_POSITION_SUFFIX = "événement de la journée";
export const PREVIEW_POSITION_OUT_OF = "sur";

export const EVENT_SAVED_MESSAGE = "Événement enregistré";
export const EVENT_DELETED_MESSAGE = "Événement supprimé";
export const EVENT_NOT_FOUND_MESSAGE = "Événement introuvable";
export const TITLE_REQUIRED_MESSAGE = "Le titre est requis";
export const INVALID_DATE_MESSAGE = "Date invalide";
export const INVALID_HOUR_MESSAGE = "Heure invalide";
export const INVALID_INTERVAL_MESSAGE = "L'intervalle doit être d'au moins 1";
export const END_DATE_BEFORE_START_MESSAGE =
  "La date de fin doit suivre la date de départ";
export const INVALID_END_COUNT_MESSAGE =
  "Le nombre d'occurrences doit être d'au moins 1";

export const TRELLO_API_URL = "https://api.trello.com/1";
export const TRELLO_CARD_FILTER = "visible";
export const TRELLO_CARD_FIELDS = "name,due,labels";
export const TRELLO_COLOR_SHADE_SEPARATOR = "_";
export const TRELLO_IMPORT_CONFIG_PATH = "trello-import.json";
