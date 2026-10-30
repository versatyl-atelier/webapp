export const DROPBOX_TOKEN_URL = "https://api.dropbox.com/oauth2/token";
export const DROPBOX_API_URL = "https://api.dropboxapi.com/2";
export const DROPBOX_THUMBNAIL_URL =
  "https://content.dropboxapi.com/2/files/get_thumbnail_v2";
export const DROPBOX_API_ARG_HEADER = "Dropbox-API-Arg";
export const DROPBOX_PATH_RESOURCE_TAG = "path";
export const DROPBOX_REFRESH_GRANT = "refresh_token";
export const DROPBOX_TOKEN_TTL_HOURS = 3;
export const DROPBOX_PATH_SEPARATOR = "/";
export const DROPBOX_FOLDER_TAG = "folder";
export const DROPBOX_FILE_TAG = "file";
export const DROPBOX_FOLDER_CONFLICT_PREFIX = "path/conflict/folder";
export const DROPBOX_LIST_LIMIT = 2000;

export const DROPBOX_ENDPOINTS = {
  createFolder: "files/create_folder_v2",
  listFolder: "files/list_folder",
  listFolderContinue: "files/list_folder/continue",
  move: "files/move_v2",
  temporaryLink: "files/get_temporary_link",
} as const;

export const DROPBOX_FORBIDDEN_NAME_CHARS = /[<>:"/\\|?*]/g;
export const DROPBOX_TRAILING_NAME_CHARS = /[\s.]+$/;
export const DROPBOX_NAME_REPLACEMENT = "-";
export const DROPBOX_WHITESPACE_PATTERN = /\s+/g;
export const DROPBOX_NAME_SPACE = " ";
export const DROPBOX_UNNAMED_FOLDER = "Sans nom";
export const DROPBOX_FOLDER_NUMBER_PATTERN = /^(\d+)\.\s/;
export const DROPBOX_FOLDER_NUMBER_SEPARATOR = ". ";
export const DROPBOX_DUPLICATE_SUFFIX_START = 2;

export const PIECE_SECTION_NAMES = [
  "Existant ou plans",
  "Images d'inspiration",
  "3D",
  "Matériaux",
  "Specs",
  "Soumissions fournisseurs",
  "Dessins production",
  "Listes de débit",
] as const;

export const PROJECT_SECTIONS = [
  { name: "Prise de mesure", folder: "PDM" },
  { name: "Photos résultat", folder: "Photos résultat" },
  { name: "Comptoirs", folder: "Comptoirs" },
  { name: "Finition", folder: "Finition" },
  { name: "Commande de portes", folder: "Commande de portes" },
] as const;

export const DROPBOX_SYNC_FAILED_MESSAGE = "Dropbox sync failed";
export const FILE_SECTION_NOT_FOUND_MESSAGE = "Section introuvable";
export const FILE_SECTION_FIXED_MESSAGE =
  "Cette section ne peut pas être modifiée";
