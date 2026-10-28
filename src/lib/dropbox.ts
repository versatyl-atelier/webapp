import {
  DROPBOX_DUPLICATE_SUFFIX_START,
  DROPBOX_FOLDER_NUMBER_PATTERN,
  DROPBOX_FOLDER_NUMBER_SEPARATOR,
  DROPBOX_FORBIDDEN_NAME_CHARS,
  DROPBOX_NAME_REPLACEMENT,
  DROPBOX_NAME_SPACE,
  DROPBOX_PATH_SEPARATOR,
  DROPBOX_TRAILING_NAME_CHARS,
  DROPBOX_UNNAMED_FOLDER,
  DROPBOX_WHITESPACE_PATTERN,
  PIECE_SECTION_NAMES,
} from "@/constants/dropbox";

export function dropboxSafeName(name: string): string {
  const safe = name
    .replace(DROPBOX_FORBIDDEN_NAME_CHARS, DROPBOX_NAME_REPLACEMENT)
    .replace(DROPBOX_WHITESPACE_PATTERN, DROPBOX_NAME_SPACE)
    .trim()
    .replace(DROPBOX_TRAILING_NAME_CHARS, "");
  return safe || DROPBOX_UNNAMED_FOLDER;
}

export function joinDropboxPath(...segments: readonly string[]): string {
  return segments
    .flatMap((segment) => segment.split(DROPBOX_PATH_SEPARATOR))
    .filter(Boolean)
    .reduce(
      (path, segment) => `${path}${DROPBOX_PATH_SEPARATOR}${segment}`,
      "",
    );
}

export function numberedFolder(position: number, name: string): string {
  return `${position}${DROPBOX_FOLDER_NUMBER_SEPARATOR}${dropboxSafeName(name)}`;
}

export function folderNumber(folder: string): number | null {
  const match = DROPBOX_FOLDER_NUMBER_PATTERN.exec(folder);
  return match ? Number(match[1]) : null;
}

export function nextFolderNumber(folders: readonly string[]): number {
  return folders.reduce(
    (next, folder) => Math.max(next, (folderNumber(folder) ?? 0) + 1),
    1,
  );
}

export function uniqueFolderName(
  name: string,
  taken: readonly string[],
): string {
  const lowered = new Set(taken.map((folder) => folder.toLowerCase()));
  const base = dropboxSafeName(name);
  let candidate = base;
  let suffix = DROPBOX_DUPLICATE_SUFFIX_START;
  while (lowered.has(candidate.toLowerCase())) {
    candidate = `${base} (${suffix++})`;
  }
  return candidate;
}

export function pieceSectionFolders(): { name: string; folder: string }[] {
  return PIECE_SECTION_NAMES.map((name, index) => ({
    name,
    folder: numberedFolder(index + 1, name),
  }));
}

export function renumberedFolder(folder: string, name: string): string {
  const number = folderNumber(folder);
  return number === null ? dropboxSafeName(name) : numberedFolder(number, name);
}

export function folderLabel(folder: string): string {
  return folder.replace(DROPBOX_FOLDER_NUMBER_PATTERN, "");
}

function sameFolder(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

export function chooseProjectFolder(
  name: string,
  existing: readonly string[],
  claimed: readonly string[],
): string {
  const safe = dropboxSafeName(name);
  const adoptable = existing.find(
    (folder) =>
      sameFolder(folder, safe) &&
      !claimed.some((other) => sameFolder(other, folder)),
  );
  return adoptable ?? uniqueFolderName(name, [...existing, ...claimed]);
}

export function choosePieceFolder(
  name: string,
  existing: readonly string[],
  claimed: readonly string[],
): string {
  const safe = dropboxSafeName(name);
  const adoptable = existing.find(
    (folder) =>
      folderNumber(folder) !== null &&
      sameFolder(folderLabel(folder), safe) &&
      !claimed.some((other) => sameFolder(other, folder)),
  );
  if (adoptable) {
    return adoptable;
  }
  const taken = [...existing, ...claimed];
  return uniqueFolderName(numberedFolder(nextFolderNumber(taken), name), taken);
}
