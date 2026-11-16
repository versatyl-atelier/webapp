export const MOVE_COMMAND = "move";
export const COPY_COMMAND = "copy";
export const UNDO_MOVE_COMMAND = "undo-move";
export const UNDO_COPY_COMMAND = "undo-copy";
export const DELETE_COMMAND = "delete";

export const COPY_ENTRY_METHOD = "copy";

export const TIME_ENTRY_DRAG_TYPE = "application/x-versatyl-time-entry";
export const TIME_ENTRY_SOURCE_DATE_DRAG_TYPE =
  "application/x-versatyl-time-entry-source-date";

export const DROP_MOVE_CLASSES =
  "bg-primary/15 outline-primary outline-2 -outline-offset-2 outline-dashed";
export const DROP_COPY_CLASSES =
  "bg-punch-pos-diff/15 outline-punch-pos-diff outline-2 -outline-offset-2 outline-dashed";
export const DROP_MOVE_LABEL_CLASSES = "text-primary";
export const DROP_COPY_LABEL_CLASSES = "text-punch-pos-diff";

export const DROP_DELETE_CLASSES =
  "bg-destructive/15 outline-destructive text-destructive outline-2 -outline-offset-2 outline-dashed";
export const DROP_DELETE_ACTIVE_CLASSES = "bg-destructive/30";

export const DROP_MOVE_LABEL = "Déplacer ici";
export const DROP_COPY_LABEL = "Copier ici";
export const DROP_DELETE_LABEL = "Déposer ici pour supprimer";
export const DUPLICATE_ENTRY_LABEL = "Dupliquer";
export const UNDO_LABEL = "Annuler";
export const UNDO_TOAST_DURATION_MS = 8000;

export const COPY_DRAG_KEY_DEFAULT = "Ctrl";
export const COPY_DRAG_KEY_APPLE = "⌥ Option";
export const DRAG_TO_MOVE_HINT = "Glisser une entrée pour la déplacer";
export const DRAG_TO_COPY_HINT = "pour copier";
export const TOUCH_ENTRY_HINT =
  "Appuyer longtemps pour déplacer, toucher pour modifier ou dupliquer";
export const FINE_POINTER_QUERY = "(any-pointer: fine)";

export const ENTRY_MOVED_MESSAGE = "Entrée déplacée";
export const ENTRY_COPIED_MESSAGE = "Entrée copiée";
export const MOVE_UNDONE_MESSAGE = "Déplacement annulé";
export const COPY_UNDONE_MESSAGE = "Copie annulée";
export const ENTRY_DELETED_MESSAGE = "Entrée supprimée";
export const ENTRY_NOT_FOUND_MESSAGE = "Entrée introuvable";
export const ACTIVE_PUNCH_NOT_MOVABLE_MESSAGE =
  "Impossible de déplacer un punch en cours";
export const PROJECT_REQUIRED_MESSAGE = "Projet requis";
