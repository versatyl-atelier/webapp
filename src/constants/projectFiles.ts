export const DROPBOX_SYNC_STATUS = {
  unlinked: "unlinked",
  missing: "missing",
  ok: "ok",
} as const;
export const ROOT_SECTION_LABEL = "Racine";
export const FOLDER_MISSING_MESSAGE = "Dossier Dropbox introuvable";
export const FOLDER_RECREATE_LABEL = "Recréer";
export const FOLDER_UNLINK_LABEL = "Délier";
export const FOLDER_CREATE_LABEL = "Créer le dossier Dropbox";
export const PIECE_FILES_HEADING = "Fichiers";
export const LOADING_SECTION_LABEL = "Chargement…";
export const ADD_FILES_LABEL = "Ajouter des fichiers";
export const DROP_FILES_LABEL = "Déposez les fichiers ici";
export const UPLOADING_LABEL = "Téléversement en cours…";
export const UPLOAD_FAILED_MESSAGE = "Échec du téléversement";
export const LIST_FAILED_MESSAGE = "Impossible de lire cette section";
export const OPEN_FAILED_MESSAGE = "Impossible d’ouvrir ce fichier";
export const BACK_LABEL = "Dossier parent";
export const FILE_OPTIONS_LABEL = "Options du fichier";
export const OPEN_FILE_LABEL = "Ouvrir";
export const COVER_SET_MESSAGE = "Couverture définie";
export const REMOVE_FILE_LABEL = "Supprimer";
export const FILE_REMOVED_SUFFIX = "envoyé à la corbeille Dropbox";

export const LISTS_LINK_LABEL = "Vérification · Montage";
export const COMING_SOON_LABEL = "Bientôt";
export const ADD_FILE_SECTION_LABEL = "Section";
export const NEW_SECTION_PLACEHOLDER = "Nom de la section";
export const NEW_SECTION_LABEL = "Nom de la nouvelle section";
export const SECTION_NAME_LABEL = "Nom de la section";
export const REMOVE_SECTION_LABEL = "Supprimer la section";
export const SECTION_REMOVED_SUFFIX = "supprimée";
export const CONFIRM_LABEL = "Ajouter";

export const COVER_LABEL = "Couverture";
export const COVER_ADD_LABEL = "Ajouter une image";
export const COVER_REPLACE_LABEL = "Remplacer";
export const COVER_REMOVE_LABEL = "Retirer";
export const COVER_ZOOM_LABEL = "Zoom";
export const COVER_HINT_DEFAULT =
  "Glissez pour cadrer · Ctrl+V pour coller une image";
export const COVER_HINT_APPLE =
  "Glissez pour cadrer · ⌘V pour coller une image";
export const COVER_NEEDS_SAVE_MESSAGE =
  "Enregistrez la pièce avant d’ajouter une image";
export const COVER_FRAMING_LABEL = "Cadrage de la couverture";
export const COVER_ZOOM_MIN = 1;
export const COVER_ZOOM_MAX = 4;
export const COVER_ZOOM_STEP = 0.05;
export const COVER_CENTER = 50;
export const PERCENT = 100;

export const LIGHTBOX_LABEL = "Aperçu de l’image";
export const LIGHTBOX_PREVIOUS_LABEL = "Image précédente";
export const LIGHTBOX_NEXT_LABEL = "Image suivante";
export const LIGHTBOX_OPEN_ORIGINAL_LABEL = "Ouvrir l’original";

export const PASTE_EVENT = "paste";
export const TEXT_MIME_TYPE = "text/plain";
export const FILES_DRAG_TYPE = "Files";
export const UPLOAD_CONTENT_TYPE = "application/octet-stream";
export const NEW_TAB_TARGET = "_blank";
export const SECTION_PATH_SEPARATOR = "/";
export const PASTED_IMAGE_PREFIX = "Image collée";
export const PASTED_DEFAULT_NAME = "image.png";
export const PASTED_DEFAULT_EXTENSION = "png";
export const PASTED_TIMESTAMP_LENGTH = 19;
export const PASTED_TIMESTAMP_SEPARATORS = /[T:]/g;
export const PASTED_TIMESTAMP_REPLACEMENT = "-";
export const MIME_SUBTYPE_SEPARATOR = "/";
export const IMAGE_MIME_PREFIX = "image/";
export const COVER_PAN_STEP = 5;
export const FILE_THUMBNAIL_PARAM = "f";
export const FILE_THUMBNAIL_SIZE_PARAM = "s";
export const FILE_THUMBNAIL_VERSION_PARAM = "v";
export const FILE_SIZE_UNITS = ["o", "Ko", "Mo", "Go"] as const;
export const FILE_SIZE_STEP = 1024;
export const FILE_SIZE_DECIMALS = 1;
export const MESSAGE_SEPARATOR = " : ";
export const COUNT_SEPARATOR = " · ";
export const INDEX_SEPARATOR = " / ";
export const REORDER_PIN_SHORTCUTS = "Alt+ArrowLeft Alt+ArrowRight";
export const COVER_ACCEPT = "image/*";
export const COVER_MIME_TYPE = "image/jpeg";
export const COVER_MAX_SIDE = 1280;
export const COVER_MAX_BYTES = 900 * 1024;
export const COVER_JPEG_QUALITY = 0.85;
export const COVER_JPEG_MIN_QUALITY = 0.5;
export const COVER_JPEG_QUALITY_STEP = 0.1;
export const COVER_BACKGROUND = "#ffffff";
export const COVER_CANVAS_CONTEXT = "2d";
export const COVER_PIECE_FIELD = "pieceId";
export const COVER_IMAGE_FIELD = "image";
export const COVER_IMMUTABLE_CACHE_CONTROL =
  "private, max-age=31536000, immutable";
export const COVER_VERSION_PARAM = "v";
export const COVER_UNREADABLE_MESSAGE = "Impossible de lire cette image";
export const COVER_TOO_LARGE_MESSAGE = "Image trop volumineuse";
export const COVER_INVALID_TYPE_MESSAGE = "L’image doit être au format JPEG";
