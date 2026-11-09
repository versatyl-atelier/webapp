import {
  ProjectStage,
  TrelloCardRole,
  TrelloCardState,
  TrelloCardVariant,
  TrelloDestinationKey,
} from "@/generated/prisma/enums";

export const TRELLO_API_URL = "https://api.trello.com/1";
export const TRELLO_AUTH_SCHEME = "OAuth";
export const TRELLO_CONSUMER_KEY_PARAM = "oauth_consumer_key";
export const TRELLO_TOKEN_PARAM = "oauth_token";
export const TRELLO_NOT_FOUND_STATUS = 404;
export const TRELLO_SIGNATURE_HEADER = "x-trello-webhook";
export const TRELLO_SIGNATURE_ALGORITHM = "sha1";
export const TRELLO_SIGNATURE_ENCODING = "base64";
export const TRELLO_WEBHOOK_PATH = "/api/trello/webhook";
export const TRELLO_WEBHOOK_DESCRIPTION = "Versatyl";
export const TRELLO_WEBHOOK_EXISTS_PATTERN = /already exists/i;
export const TRELLO_ID_PATTERN = /^[0-9a-f]{24}$/i;
export const TRELLO_COVER_FILE_NAME = "couverture";
export const TRELLO_PROJECT_LINK_NAME = "Projet dans Versatyl";
export const TRELLO_SYNC_FAILED_MESSAGE = "Trello sync failed";
export const TRELLO_PHASE_SPLIT_MINIMUM = 2;
export const TRELLO_NAME_SEPARATOR = " — ";
export const TRELLO_WORD_SEPARATOR = " ";
export const TRELLO_DESCRIPTION_SEPARATOR = "\n\n";
export const TRELLO_FIELD_SEPARATOR = " : ";
export const TRELLO_LINE_SEPARATOR = "\n";

export const TRELLO_METHODS = {
  get: "GET",
  post: "POST",
  put: "PUT",
  delete: "DELETE",
} as const;

export const TRELLO_PATHS = {
  boards: "/members/me/boards",
  organizations: "/members/me/organizations",
  organizationBoards: (id: string) => `/organizations/${id}/boards`,
  cards: "/cards",
  webhooks: "/webhooks",
  webhook: (id: string) => `/webhooks/${id}`,
  board: (id: string) => `/boards/${id}`,
  boardLists: (id: string) => `/boards/${id}/lists`,
  list: (id: string) => `/lists/${id}`,
  card: (id: string) => `/cards/${id}`,
  cardAttachments: (id: string) => `/cards/${id}/attachments`,
  cardAttachment: (cardId: string, id: string) =>
    `/cards/${cardId}/attachments/${id}`,
  tokenWebhooks: (token: string) => `/tokens/${token}/webhooks`,
} as const;

export const TRELLO_FILTER_OPEN = "open";
export const TRELLO_FIELDS_NAME = "name";
export const TRELLO_FIELDS_ID = "id";
export const TRELLO_COLLATION_LOCALE = "fr";
export const TRELLO_FIELDS_LIST = "name,idBoard";
export const TRELLO_POSITION_BOTTOM = "bottom";
export const TRELLO_QUERY_STRING_PREFIX = "?";

export const TRELLO_ACTION_TYPES = {
  updateCard: "updateCard",
  deleteCard: "deleteCard",
  moveCardToBoard: "moveCardToBoard",
  moveCardFromBoard: "moveCardFromBoard",
} as const;

export const TRELLO_EVENT_KINDS = {
  move: "move",
  archive: "archive",
  unarchive: "unarchive",
  delete: "delete",
} as const;

export type TrelloEventKind =
  (typeof TRELLO_EVENT_KINDS)[keyof typeof TRELLO_EVENT_KINDS];

export const TRELLO_WEBHOOK_STATUS = {
  ok: 200,
  badRequest: 400,
  unauthorized: 401,
  error: 500,
} as const;

export const TRELLO_DESTINATION_KEYS = Object.values(TrelloDestinationKey);

export const TRELLO_DESTINATION_BY_CARD = {
  [TrelloCardRole.design]: {
    [TrelloCardVariant.simple]: TrelloDestinationKey.design,
    [TrelloCardVariant.caisson]: TrelloDestinationKey.design,
    [TrelloCardVariant.finition]: TrelloDestinationKey.design,
  },
  [TrelloCardRole.planification]: {
    [TrelloCardVariant.simple]: TrelloDestinationKey.planification,
    [TrelloCardVariant.caisson]: TrelloDestinationKey.planification,
    [TrelloCardVariant.finition]: TrelloDestinationKey.planification,
  },
  [TrelloCardRole.atelier]: {
    [TrelloCardVariant.simple]: TrelloDestinationKey.atelierSimple,
    [TrelloCardVariant.caisson]: TrelloDestinationKey.atelierCaisson,
    [TrelloCardVariant.finition]: TrelloDestinationKey.atelierFinition,
  },
} as const satisfies Record<
  TrelloCardRole,
  Record<TrelloCardVariant, TrelloDestinationKey>
>;

export const TRELLO_DESTINATION_LABELS: Record<TrelloDestinationKey, string> = {
  design: "Design (Projets client)",
  planification: "Planification — une carte par pièce",
  atelierSimple: "Atelier — pièce simple",
  atelierCaisson: "Atelier — caisson",
  atelierFinition: "Atelier — finition",
};

export const TRELLO_VARIANT_LABELS: Record<TrelloCardVariant, string> = {
  simple: "",
  caisson: "Caisson",
  finition: "Finition",
};

export const TRELLO_VARIANT_NAME_SUFFIXES: Record<TrelloCardVariant, string> = {
  simple: "",
  caisson: "(Caisson)",
  finition: "(Finition)",
};

export const TRELLO_ROLE_LABELS: Record<TrelloCardRole, string> = {
  design: "Design",
  planification: "Planification",
  atelier: "Atelier",
};

export const TRELLO_STATE_LABELS: Record<TrelloCardState, string> = {
  active: "Active",
  hidden: "Masquée",
  archived: "Archivée",
  lost: "Perdue",
};

export const TRELLO_STAGE_LINES = Object.values(ProjectStage);

export const TRELLO_PAGE_PATH = "/gestionnaire/trello";
export const TRELLO_PAGE_TITLE = "Trello";
export const TRELLO_PAGE_DESCRIPTION =
  "Destinations des cartes créées par l’application et listes qui font changer l’étape d’un projet.";
export const TRELLO_DESTINATIONS_HEADING = "Destinations des cartes";
export const TRELLO_DESTINATIONS_DESCRIPTION =
  "Où l’application place les nouvelles cartes.";
export const TRELLO_STAGES_HEADING = "Retour : liste vers étape";
export const TRELLO_STAGES_DESCRIPTION =
  "Quand une carte d’un projet arrive dans cette liste, l’étape du projet est mise à jour.";
export const TRELLO_WEBHOOKS_HEADING = "Webhooks";
export const TRELLO_WEBHOOKS_DESCRIPTION =
  "Un webhook par tableau utilisé permet à Trello d’informer l’application.";
export const TRELLO_REGISTER_WEBHOOKS_LABEL = "Enregistrer les webhooks";
export const TRELLO_WEBHOOKS_NONE_LABEL = "Aucun tableau configuré";
export const TRELLO_REREGISTER_WEBHOOKS_LABEL = "Réenregistrer les webhooks";
export const TRELLO_WEBHOOKS_DEV_NOTE =
  "Réservé au développement local : le tunnel change d’adresse à chaque lancement. Après avoir mis à jour TRELLO_PUBLIC_URL et redémarré le serveur, réenregistrez les webhooks. En production, l’adresse est stable et l’enregistrement se fait une seule fois.";
export const TRELLO_WEBHOOK_STALE_LABEL = "Adresse périmée";
export const TRELLO_WEBHOOK_FAILURES_LABEL = "échecs de livraison";
export const TRELLO_WEBHOOK_ACTIVE_LABEL = "Webhook actif";
export const TRELLO_WEBHOOK_MISSING_LABEL = "Webhook manquant";
export const TRELLO_BOARD_LABEL = "Tableau";
export const TRELLO_LIST_LABEL = "Liste";
export const TRELLO_NO_SELECTION_LABEL = "Aucune liste";
export const TRELLO_BOARD_PLACEHOLDER = "Choisir un tableau";
export const TRELLO_LIST_PLACEHOLDER = "Choisir une liste";
export const TRELLO_LISTS_LOADING_LABEL = "Chargement…";
export const TRELLO_CLEAR_LABEL = "Retirer";
export const TRELLO_SAVE_LABEL = "Enregistrer";
export const TRELLO_SAVED_MESSAGE = "Configuration Trello enregistrée";
export const TRELLO_CLEARED_MESSAGE = "Configuration Trello retirée";
export const TRELLO_WEBHOOKS_REREGISTERED_MESSAGE = "Webhooks réenregistrés";
export const TRELLO_WEBHOOKS_REGISTERED_MESSAGE = "Webhooks enregistrés";
export const TRELLO_LIST_TAKEN_MESSAGE =
  "Cette liste est déjà associée à une autre étape";
export const TRELLO_BOARDS_UNAVAILABLE_MESSAGE = "Trello boards unavailable";
export const TRELLO_UNAVAILABLE_MESSAGE =
  "Trello est inaccessible. Vérifiez TRELLO_KEY et TRELLO_TOKEN.";

export const TRELLO_PROJECT_HEADING = "Trello";
export const TRELLO_CREATE_DESIGN_LABEL = "Envoyer vers Design";
export const TRELLO_SEND_PLANIFICATION_LABEL = "Envoyer vers Planification";
export const TRELLO_SEND_ATELIER_LABEL = "Envoyer vers Atelier";
export const TRELLO_REGENERATE_LABEL = "Régénérer la carte";
export const TRELLO_LOST_LABEL = "Carte supprimée dans Trello";
export const TRELLO_REASON_NOT_CONFIGURED =
  "Aucune destination configurée : un gestionnaire doit la définir dans Interface gestionnaire → Trello";
export const TRELLO_REASON_NO_PIECES = "Ajoutez d’abord une pièce au projet";
export const TRELLO_SENT_MESSAGE = "Cartes Trello synchronisées";
export const TRELLO_REGENERATED_MESSAGE = "Carte régénérée";
export const TRELLO_PROJECT_CARD_LABEL = "Projet";
export const TRELLO_LABEL_SEPARATOR = " · ";

export const PIECE_CAISSON_LABEL = "Caisson";
export const PIECE_FINITION_LABEL = "Finition";
export const PIECE_ATELIER_HEADING = "Trello";
export const PIECE_ATELIER_DESCRIPTION =
  "Cartes de l’atelier pour cette pièce. Aucune option = panneaux de mélamine seulement. Les cartes sont créées avec « Envoyer vers Atelier » sur la page du projet.";
export const PIECE_TOGGLE_TRUE = "true";
export const PIECE_TOGGLE_FALSE = "false";
