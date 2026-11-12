import { NAMED_COLORS } from "@/constants/color";

export const JOBINE_ICON = "🛠";
export const JOBINES_TITLE = "Jobines";
export const JOBINES_DESCRIPTION = "Petits projets à pointer";
export const DEFAULT_JOBINE_COLOR = NAMED_COLORS.amber;

export const JOBINE_NAME_MIN_LENGTH = 2;
export const JOBINE_NAME_MAX_LENGTH = 60;
export const JOBINE_DESCRIPTION_MAX_LENGTH = 500;
export const JOBINE_DESCRIPTION_ROWS = 3;

export const ACTIVE_JOBINES_TITLE = "Actives";
export const ARCHIVED_JOBINES_TITLE = "Archivées";
export const NO_ACTIVE_JOBINES_LABEL = "Aucune jobine active";
export const NO_ARCHIVED_JOBINES_LABEL = "Aucune jobine archivée";
export const NO_JOBINE_MATCH_LABEL = "Aucun résultat";
export const JOBINES_FILTER_LABEL = "Filtrer les jobines";
export const JOBINES_FILTER_PLACEHOLDER = "Filtrer les jobines…";
export const JOBINES_FOUND_LABEL = "jobines trouvées";

export const JOBINE_NAME_LABEL = "Titre";
export const JOBINE_NAME_PLACEHOLDER = "Ex: Réparation tiroir client";
export const JOBINE_DESCRIPTION_LABEL = "Description";
export const JOBINE_DESCRIPTION_PLACEHOLDER = "Détails, client, adresse…";
export const JOBINE_COLOR_LABEL = "Couleur";
export const EDIT_JOBINE_TITLE = "Modifier la jobine";
export const RESTORE_LABEL = "Restaurer";
export const ARCHIVE_JOBINE_DESCRIPTION =
  "Elle n'apparaîtra plus dans le punch. Les heures déjà pointées sont conservées.";

export const JOBINE_ADDED_MESSAGE = "Jobine ajoutée";
export const JOBINE_SAVED_MESSAGE = "Jobine sauvegardée";
export const JOBINE_ARCHIVED_MESSAGE = "Jobine archivée";
export const JOBINE_RESTORED_MESSAGE = "Jobine restaurée";
export const JOBINE_NOT_FOUND_MESSAGE = "Jobine introuvable";
export const JOBINE_NAME_LENGTH_MESSAGE = `Le titre doit contenir de ${JOBINE_NAME_MIN_LENGTH} à ${JOBINE_NAME_MAX_LENGTH} caractères`;
export const JOBINE_DESCRIPTION_LENGTH_MESSAGE = `La description doit contenir au plus ${JOBINE_DESCRIPTION_MAX_LENGTH} caractères`;
