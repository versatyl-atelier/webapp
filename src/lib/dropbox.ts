import {
  DROPBOX_COLLATION_LOCALE,
  DROPBOX_DUPLICATE_SUFFIX_START,
  DROPBOX_EXTENSION_SEPARATOR,
  DROPBOX_FOLDER_NUMBER_PATTERN,
  DROPBOX_FOLDER_NUMBER_SEPARATOR,
  DROPBOX_FORBIDDEN_NAME_CHARS,
  DROPBOX_NAME_REPLACEMENT,
  DROPBOX_NAME_SPACE,
  DROPBOX_PATH_SEPARATOR,
  DROPBOX_SUBPATH_FORBIDDEN_SEGMENTS,
  DROPBOX_TRAILING_NAME_CHARS,
  DROPBOX_UNNAMED_FOLDER,
  DROPBOX_WHITESPACE_PATTERN,
  IMAGE_EXTENSIONS,
  PIECE_SECTION_NAMES,
  PROJECT_SECTIONS,
  THUMBNAIL_EXTENSIONS,
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

export function newProjectFolder(
  name: string,
  existing: readonly string[],
): string {
  return uniqueFolderName(name, existing);
}

export function newPieceFolder(
  name: string,
  existing: readonly string[],
): string {
  return uniqueFolderName(
    numberedFolder(nextFolderNumber(existing), name),
    existing,
  );
}

export type FolderChild = { id: string; name: string };

export type AdoptedSection = {
  id: string;
  folder: string;
  name: string;
  isCustom: boolean;
};

export type AdoptionPlan = {
  pieces: FolderChild[];
  sections: AdoptedSection[];
  refresh: FolderChild[];
};

export type AdoptionLevel = "project" | "piece";

export function planFolderAdoption(
  children: readonly FolderChild[],
  known: ReadonlyMap<string, string>,
  level: AdoptionLevel,
): AdoptionPlan {
  const defaults =
    level === "project"
      ? PROJECT_SECTIONS.map(({ name, folder }) => ({ name, folder }))
      : pieceSectionFolders();
  const plan: AdoptionPlan = { pieces: [], sections: [], refresh: [] };
  const ordered = [...children].sort((a, b) =>
    compareFileNames(a.name, b.name),
  );
  for (const child of ordered) {
    const cached = known.get(child.id);
    if (cached !== undefined) {
      if (cached !== child.name) {
        plan.refresh.push(child);
      }
    } else if (level === "project" && folderNumber(child.name) !== null) {
      plan.pieces.push(child);
    } else {
      const match = defaults.find((candidate) =>
        sameFolder(candidate.folder, child.name),
      );
      plan.sections.push({
        id: child.id,
        folder: child.name,
        name: match?.name ?? folderLabel(child.name),
        isCustom: !match,
      });
    }
  }
  return plan;
}

export function isWithinDropboxPath(path: string, parent: string): boolean {
  const normalizedParent = joinDropboxPath(parent).toLowerCase();
  const normalizedPath = joinDropboxPath(path).toLowerCase();
  return (
    normalizedParent !== "" &&
    normalizedPath.startsWith(`${normalizedParent}${DROPBOX_PATH_SEPARATOR}`)
  );
}

export function parseSubpath(
  subpath: string | null | undefined,
): string[] | null {
  const segments = (subpath ?? "")
    .split(DROPBOX_PATH_SEPARATOR)
    .filter((segment) => segment !== "");
  const unsafe = segments.some(
    (segment) =>
      segment.includes("\\") ||
      DROPBOX_SUBPATH_FORBIDDEN_SEGMENTS.some(
        (forbidden) => forbidden === segment,
      ),
  );
  return unsafe ? null : segments;
}

export function fileExtension(name: string): string {
  const index = name.lastIndexOf(DROPBOX_EXTENSION_SEPARATOR);
  return index < 0 ? "" : name.slice(index + 1).toLowerCase();
}

export function isImageName(name: string): boolean {
  return IMAGE_EXTENSIONS.some(
    (extension) => extension === fileExtension(name),
  );
}

export function hasThumbnail(name: string): boolean {
  return THUMBNAIL_EXTENSIONS.some(
    (extension) => extension === fileExtension(name),
  );
}

export function uniqueFileName(name: string, taken: readonly string[]): string {
  const safe = dropboxSafeName(name);
  const index = safe.lastIndexOf(DROPBOX_EXTENSION_SEPARATOR);
  const hasExtension = index > 0;
  const stem = hasExtension ? safe.slice(0, index) : safe;
  const extension = hasExtension ? safe.slice(index) : "";
  const lowered = new Set(taken.map((existing) => existing.toLowerCase()));
  let candidate = safe;
  let suffix = DROPBOX_DUPLICATE_SUFFIX_START;
  while (lowered.has(candidate.toLowerCase())) {
    candidate = `${stem} (${suffix++})${extension}`;
  }
  return candidate;
}

export function compareFileNames(a: string, b: string): number {
  return a.localeCompare(b, DROPBOX_COLLATION_LOCALE, {
    numeric: true,
    sensitivity: "base",
  });
}
