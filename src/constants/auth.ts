import { Role } from "@/generated/prisma/enums";

export const ROLE_RANK: Record<Role, number> = {
  [Role.employee]: 1,
  [Role.manager]: 2,
};

export const SESSION_EXPIRES_IN_SECONDS = 365 * 24 * 60 * 60;
export const SESSION_UPDATE_AGE_SECONDS = 24 * 60 * 60;
export const MIN_PASSWORD_LENGTH = 8;

export const LOGIN_PATH = "/login";
export const CHANGE_PASSWORD_PATH = "/change-password";
export const REDIRECT_TO_PARAM = "redirectTo";
export const PROTECTED_PATH_PREFIXES = ["/punch", CHANGE_PASSWORD_PATH];

export const SESSION_NOT_FOUND_ERROR = "SessionNotFound";
export const PASSWORD_CHANGE_REQUIRED_ERROR = "PasswordChangeRequired";

export const FIBER_FAILURE_NAME_PREFIX = "(FiberFailure) ";

export const LOGIN_SUCCESS_MESSAGE = "loginSuccess";
export const LOGOUT_SUCCESS_MESSAGE = "logoutSuccess";
export const CHANGE_PASSWORD_SUCCESS_MESSAGE = "changePasswordSuccess";
export const CREATE_USER_SUCCESS_MESSAGE = "Compte créé";

export const INVALID_CREDENTIALS_MESSAGE = "Courriel ou mot de passe invalide";
export const FORBIDDEN_MESSAGE = "Accès refusé";
export const PASSWORDS_DO_NOT_MATCH_MESSAGE =
  "Les mots de passe ne correspondent pas";
export const INVALID_CURRENT_PASSWORD_MESSAGE = "Mot de passe actuel invalide";
export const EMAIL_ALREADY_USED_MESSAGE =
  "Un compte existe déjà pour ce courriel";
export const INVALID_EMAIL_MESSAGE = "Courriel invalide";
export const EMPLOYEE_REQUIRED_MESSAGE =
  "Un compte employé doit être lié à un employé";
export const EMPLOYEE_UNAVAILABLE_MESSAGE =
  "Employé introuvable ou déjà lié à un compte";
export const NAME_REQUIRED_MESSAGE = "Le nom est requis sans employé";
export const CREATE_USER_FAILED_MESSAGE = "Impossible de créer le compte";
export const NO_EMPLOYEE_LINKED_MESSAGE =
  "Aucun dossier employé n'est associé à ce compte. Demandez à un gestionnaire de le lier.";

export const NO_EMPLOYEE_ID = "none";
