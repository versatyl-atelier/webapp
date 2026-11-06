import type { CSSProperties } from "react";

import { DROPBOX_FOLDER_TAG } from "@/constants/dropbox";
import {
  COVER_CENTER,
  COVER_ZOOM_MAX,
  FILE_SIZE_DECIMALS,
  FILE_SIZE_STEP,
  FILE_SIZE_UNITS,
  FILE_THUMBNAIL_PARAM,
  FILE_THUMBNAIL_SIZE_PARAM,
  FILE_THUMBNAIL_VERSION_PARAM,
  COVER_ZOOM_MIN,
  IMAGE_MIME_PREFIX,
  MIME_SUBTYPE_SEPARATOR,
  PASTED_DEFAULT_EXTENSION,
  PASTED_DEFAULT_NAME,
  PASTED_IMAGE_PREFIX,
  PASTED_TIMESTAMP_LENGTH,
  PASTED_TIMESTAMP_REPLACEMENT,
  PASTED_TIMESTAMP_SEPARATORS,
  COVER_VERSION_PARAM,
  PERCENT,
} from "@/constants/projectFiles";
import { compareFileNames, hasThumbnail, isImageName } from "@/lib/dropbox";
import type { DropboxEntry } from "@/schemas/dropbox.schemas";

export type SectionFile = {
  id: string;
  name: string;
  isFolder: boolean;
  size: number | null;
  modified: string | null;
  isImage: boolean;
  hasThumbnail: boolean;
};

export type FileSectionRecord = {
  id: number;
  pieceId: number | null;
  name: string;
  isCustom: boolean;
};

export function toSectionFile(entry: DropboxEntry): SectionFile {
  const isFolder = entry[".tag"] === DROPBOX_FOLDER_TAG;
  return {
    id: entry.id,
    name: entry.name,
    isFolder,
    size: entry.size ?? null,
    modified: entry.client_modified ?? null,
    isImage: !isFolder && isImageName(entry.name),
    hasThumbnail: !isFolder && hasThumbnail(entry.name),
  };
}

export function sortSectionFiles(files: readonly SectionFile[]): SectionFile[] {
  return [...files].sort(
    (a, b) =>
      Number(b.isFolder) - Number(a.isFolder) ||
      compareFileNames(a.name, b.name),
  );
}

export function fileThumbnailUrl(
  projectId: string,
  file: Pick<SectionFile, "id" | "modified">,
  size: string,
): string {
  const params = new URLSearchParams({
    [FILE_THUMBNAIL_PARAM]: file.id,
    [FILE_THUMBNAIL_SIZE_PARAM]: size,
  });
  if (file.modified) {
    params.set(FILE_THUMBNAIL_VERSION_PARAM, file.modified);
  }
  return `/projets/${projectId}/fichiers?${params.toString()}`;
}

export function formatFileSize(bytes: number | null): string {
  if (bytes === null) {
    return "";
  }
  let value = bytes;
  let unit = 0;
  while (value >= FILE_SIZE_STEP && unit < FILE_SIZE_UNITS.length - 1) {
    value /= FILE_SIZE_STEP;
    unit += 1;
  }
  return `${unit === 0 ? value : value.toFixed(FILE_SIZE_DECIMALS)} ${FILE_SIZE_UNITS[unit]}`;
}

export type CoverFraming = { x: number; y: number; zoom: number };

export const DEFAULT_COVER_FRAMING: CoverFraming = {
  x: COVER_CENTER,
  y: COVER_CENTER,
  zoom: COVER_ZOOM_MIN,
};

export function coverFramingStyle({ x, y, zoom }: CoverFraming): CSSProperties {
  return {
    "--cover-position": `${x}% ${y}%`,
    "--cover-zoom": zoom,
  } as CSSProperties;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function clampFraming({ x, y, zoom }: CoverFraming): CoverFraming {
  return {
    x: clamp(x, 0, PERCENT),
    y: clamp(y, 0, PERCENT),
    zoom: clamp(zoom, COVER_ZOOM_MIN, COVER_ZOOM_MAX),
  };
}

export function panFraming(
  origin: CoverFraming,
  delta: { x: number; y: number },
  frame: { width: number; height: number },
): CoverFraming {
  const scale = PERCENT / origin.zoom;
  return clampFraming({
    ...origin,
    x: origin.x - (delta.x / frame.width) * scale,
    y: origin.y - (delta.y / frame.height) * scale,
  });
}

export function nudgeFraming(
  framing: CoverFraming,
  step: { x: number; y: number },
): CoverFraming {
  return clampFraming({
    ...framing,
    x: framing.x + step.x,
    y: framing.y + step.y,
  });
}

export function isCoverFile(file: { type: string }): boolean {
  return file.type.startsWith(IMAGE_MIME_PREFIX);
}

export function fitWithin(
  size: { width: number; height: number },
  maxSide: number,
): { width: number; height: number } {
  const longest = Math.max(size.width, size.height);
  if (longest <= maxSide) {
    return { width: size.width, height: size.height };
  }
  const ratio = maxSide / longest;
  return {
    width: Math.max(1, Math.round(size.width * ratio)),
    height: Math.max(1, Math.round(size.height * ratio)),
  };
}

export function coverImageUrl(
  projectId: string,
  pieceId: number,
  version: Date,
): string {
  const params = new URLSearchParams({
    [COVER_VERSION_PARAM]: version.toISOString(),
  });
  return `/projets/${projectId}/pieces/${pieceId}/couverture?${params.toString()}`;
}

export function pastedFileName(
  file: { name: string; type: string },
  index: number,
  now: Date,
): string {
  if (file.name && file.name !== PASTED_DEFAULT_NAME) {
    return file.name;
  }
  const timestamp = now
    .toISOString()
    .slice(0, PASTED_TIMESTAMP_LENGTH)
    .replace(PASTED_TIMESTAMP_SEPARATORS, PASTED_TIMESTAMP_REPLACEMENT);
  const extension =
    file.type.split(MIME_SUBTYPE_SEPARATOR)[1] ?? PASTED_DEFAULT_EXTENSION;
  return `${PASTED_IMAGE_PREFIX} ${timestamp}-${index + 1}.${extension}`;
}
