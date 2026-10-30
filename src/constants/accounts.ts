export const TEMPORARY_PASSWORD_LENGTH = 12;
export const TEMPORARY_PASSWORD_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
export const BYTE_VALUE_COUNT = 256;

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PERSON_NAME_MAX_LENGTH = 100;
export const MAX_DISPLAY_ORDER = 9999;
export const ARCHIVED_BAN_REASON = "Employé archivé";
export const NO_STATUT_ID = "none";

export const ACCOUNTS_SECTION_TITLE = "Employés et comptes";
export const NO_PEOPLE_LABEL = "Aucun employé";
export const NAME_COLUMN_LABEL = "Nom";
export const EMAIL_COLUMN_LABEL = "Courriel";
export const ROLE_COLUMN_LABEL = "Rôle";
export const STATUT_COLUMN_LABEL = "Statut";
export const ACCESS_COLUMN_LABEL = "Accès";
export const ACTIONS_COLUMN_LABEL = "Actions";
export const NO_VALUE_LABEL = "—";

export const ACCESS_NONE_LABEL = "Sans compte";
export const ACCESS_PENDING_LABEL = "Mot de passe à changer";
export const ACCESS_ACTIVE_LABEL = "Actif";

export const CREATE_ACCOUNT_LABEL = "Créer un compte";
export const ADD_ACCOUNT_LABEL = "Ajouter un compte à";
export const CREATE_ACCOUNT_TITLE = "Créer un compte";
export const CREATE_ACCOUNT_SUBMIT_LABEL = "Créer le compte";
export const EMAIL_LABEL = "Courriel";
export const ROLE_LABEL = "Rôle";
export const EMPLOYEE_LABEL = "Employé";
export const NAME_LABEL = "Nom";
export const NAME_WITHOUT_EMPLOYEE_LABEL = "Nom (si aucun employé)";
export const STATUT_LABEL = "Statut";
export const DISPLAY_ORDER_LABEL = "Ordre d'affichage";
export const NO_STATUT_LABEL = "Aucun statut";

export const EDIT_PERSON_TITLE = "Modifier";
export const EDIT_PERSON_LABEL = "Modifier";
export const EMAIL_LOCKED_HINT =
  "Le courriel ne peut plus être modifié: le compte a déjà servi.";
export const EMAIL_EDITABLE_HINT =
  "Modifiable tant que l'employé n'a pas changé son mot de passe temporaire.";

export const ARCHIVE_LABEL = "Archiver";
export const ARCHIVE_DESCRIPTION =
  "L'employé disparaît des listes et son compte est bloqué. Ses entrées de temps sont conservées.";

export const ARCHIVE_SELF_REASON =
  "Vous ne pouvez pas archiver votre propre compte";
export const ARCHIVE_NO_EMPLOYEE_REASON =
  "Aucun employé n'est associé à ce compte";
export const RESET_PASSWORD_SELF_REASON =
  "Changez votre propre mot de passe depuis « Changer le mot de passe »";

export const REMOVE_ACCOUNT_LABEL = "Retirer le compte";
export const REMOVE_ACCOUNT_DESCRIPTION =
  "Le courriel et le mot de passe sont supprimés et les sessions ouvertes sont fermées. L'employé et ses entrées de temps sont conservés. Un compte retiré ne peut pas être récupéré: il faudra en créer un nouveau.";
export const ACCOUNT_REMOVED_MESSAGE = "Compte retiré";
export const RESET_PASSWORD_LABEL = "Réinitialiser le mot de passe";
export const RESET_PASSWORD_DESCRIPTION =
  "Un nouveau mot de passe temporaire sera généré, les sessions ouvertes seront fermées et l'employé devra le changer à sa prochaine connexion.";
export const RESET_PASSWORD_SUBMIT_LABEL = "Générer un mot de passe";

export const TEMPORARY_PASSWORD_TITLE = "Mot de passe temporaire";
export const TEMPORARY_PASSWORD_NOTICE =
  "Notez-le maintenant: il ne sera plus affiché. Transmettez-le à l'employé, qui devra le changer à sa première connexion.";
export const COPY_LABEL = "Copier";
export const COPIED_LABEL = "Copié";
export const DONE_LABEL = "Terminé";

export const PERSON_SAVED_MESSAGE = "Modifications sauvegardées";
export const PERSON_ARCHIVED_MESSAGE = "Employé archivé";
export const PASSWORD_RESET_MESSAGE = "Mot de passe réinitialisé";

export const PERSON_NOT_FOUND_MESSAGE = "Employé ou compte introuvable";
export const STATUT_NOT_FOUND_MESSAGE = "Statut introuvable";
export const NAME_LENGTH_MESSAGE = `Le nom doit contenir de 1 à ${PERSON_NAME_MAX_LENGTH} caractères`;
export const DISPLAY_ORDER_MESSAGE = `L'ordre doit être un entier de 0 à ${MAX_DISPLAY_ORDER}`;
export const EMAIL_LOCKED_MESSAGE =
  "Le courriel ne peut être modifié qu'avant le premier changement de mot de passe";
export const ROLE_NOT_ASSIGNABLE_MESSAGE =
  "Ce rôle n'est pas permis pour ce compte";
export const ROLE_SELF_MESSAGE = "Vous ne pouvez pas changer votre propre rôle";
export const ARCHIVE_SELF_MESSAGE =
  "Vous ne pouvez pas archiver votre propre dossier";
export const REMOVE_SELF_MESSAGE =
  "Vous ne pouvez pas retirer votre propre compte";
export const ACCOUNT_OWNS_EVENTS_MESSAGE =
  "Ce compte possède des événements du calendrier et ne peut pas être retiré";
export const PASSWORD_RESET_FAILED_MESSAGE =
  "Impossible de réinitialiser le mot de passe";
export const RESET_SELF_MESSAGE =
  "Utilisez la page de changement de mot de passe pour votre propre compte";
