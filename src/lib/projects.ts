import { COLOR_SWATCHES } from "@/constants/color";
import {
  CABINET_COUNT_READ_LABEL,
  CLADDING_SEPARATOR,
  CONTACT_DETAIL_SEPARATOR,
  DEFAULT_SUGGESTIONS,
  PHASE_NAME_PREFIX,
  PIECE_CLADDING_READ_LABEL,
  PIECE_COPY_SUFFIX,
  PIECE_TEXT_FIELDS,
  PROJECT_COLOR_VAR,
  UNNAMED_CONTACT_LABEL,
} from "@/constants/projects";
import type {
  Project,
  ProjectContact,
  ProjectPhase,
  ProjectPiece,
} from "@/generated/prisma/client";
import type { ProjectStage } from "@/generated/prisma/enums";
import type { CSSProperties } from "react";
import type { CalendarOccurrence } from "@/lib/calendar";
import { parseItemKey } from "@/lib/itemKey";
import { projectLinkIds } from "@/lib/projectLinks";
import type { FileSectionRecord } from "@/lib/projectFiles";

export function projectIdsToProjectData(projectIds: string[]) {
  return projectIds.map((projectId) => projectLinkIds(parseItemKey(projectId)));
}

export type SuggestionField = keyof typeof DEFAULT_SUGGESTIONS;

export type FicheSuggestions = Record<SuggestionField, string[]>;

export type ContactFields = Pick<
  ProjectContact,
  "role" | "name" | "company" | "phone" | "email" | "address"
>;

export type ContactRecord = ContactFields & { id: number };

export type PhaseRecord = Pick<ProjectPhase, "id" | "name">;

export type PieceRecord = Pick<
  ProjectPiece,
  | "id"
  | "phaseId"
  | "type"
  | "hasCaisson"
  | "hasFinition"
  | "description"
  | "caissonMaterial"
  | "cladding"
  | "countertop"
  | "drawers"
  | "finish"
  | "cabinetCount"
  | "coverUpdatedAt"
  | "coverX"
  | "coverY"
  | "coverZoom"
> & { dropboxLinked: boolean };

export type ProjectFiche = {
  id: string;
  name: string;
  stage: ProjectStage | null;
  color: string;
  address: string;
  isManual: boolean;
  dropboxLinked: boolean;
  fileSections: FileSectionRecord[];
  contacts: ContactRecord[];
  phases: PhaseRecord[];
  pieces: PieceRecord[];
};

export const EMPTY_CONTACT: ContactFields = {
  role: "",
  name: "",
  company: "",
  phone: "",
  email: "",
  address: "",
};

export function mergeSuggestions(
  recent: readonly string[],
  defaults: readonly string[],
): string[] {
  const seen = new Set<string>();
  return [...recent, ...defaults].flatMap((value) => {
    const trimmed = value.trim();
    const key = trimmed.toLocaleLowerCase();
    if (!trimmed || seen.has(key)) {
      return [];
    }
    seen.add(key);
    return [trimmed];
  });
}

export function contactHeadline(contact: ContactFields): string {
  return contact.name || contact.company || UNNAMED_CONTACT_LABEL;
}

export function contactDetails(contact: ContactFields): string {
  return [contact.name ? contact.company : "", contact.phone, contact.email]
    .filter(Boolean)
    .join(CONTACT_DETAIL_SEPARATOR);
}

export function isEmptyContact(contact: ContactFields): boolean {
  return Object.values(contact).every((value) => !value.trim());
}

export type PieceReadSource = Pick<
  PieceRecord,
  "cladding" | "cabinetCount" | (typeof PIECE_TEXT_FIELDS)[number]["key"]
>;

export function pieceReadFields(
  piece: PieceReadSource,
): { label: string; value: string }[] {
  const cladding = {
    label: PIECE_CLADDING_READ_LABEL,
    value: piece.cladding.join(CLADDING_SEPARATOR),
  };
  const fields = PIECE_TEXT_FIELDS.map(({ key, label }) => ({
    label,
    value: piece[key],
  }));
  const count =
    piece.cabinetCount === null
      ? []
      : [
          {
            label: CABINET_COUNT_READ_LABEL,
            value: String(piece.cabinetCount),
          },
        ];
  return [cladding, ...fields, ...count].filter(({ value }) => value);
}

export function pieceCopyName(name: string): string {
  return name ? `${name}${PIECE_COPY_SUFFIX}` : name;
}

export function piecesByPhase(
  phases: readonly PhaseRecord[],
  pieces: readonly PieceRecord[],
): { phase: PhaseRecord | null; pieces: PieceRecord[] }[] {
  if (phases.length === 0) {
    return [{ phase: null, pieces: [...pieces] }];
  }
  return phases.map((phase) => ({
    phase,
    pieces: pieces.filter(({ phaseId }) => phaseId === phase.id),
  }));
}

export function phaseName(position: number): string {
  return `${PHASE_NAME_PREFIX} ${position}`;
}

export function nextSortOrder(items: readonly { sortOrder: number }[]): number {
  return items.reduce((max, { sortOrder }) => Math.max(max, sortOrder + 1), 0);
}

export function buildSuggestions(
  pieces: readonly Pick<
    PieceRecord,
    | "type"
    | "caissonMaterial"
    | "cladding"
    | "countertop"
    | "drawers"
    | "finish"
  >[],
  contacts: readonly Pick<ContactFields, "role" | "company">[],
): FicheSuggestions {
  const from = <K extends SuggestionField>(
    rows: readonly Partial<Record<K, string>>[],
    key: K,
  ) =>
    mergeSuggestions(
      rows.map((row) => row[key] ?? ""),
      DEFAULT_SUGGESTIONS[key],
    );
  return {
    type: from(pieces, "type"),
    caissonMaterial: from(pieces, "caissonMaterial"),
    cladding: mergeSuggestions(
      pieces.flatMap(({ cladding }) => cladding),
      DEFAULT_SUGGESTIONS.cladding,
    ),
    countertop: from(pieces, "countertop"),
    drawers: from(pieces, "drawers"),
    finish: from(pieces, "finish"),
    role: from(contacts, "role"),
    company: from(contacts, "company"),
  };
}

function sameColor(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

export function projectColorLabel(color: string): string {
  return (
    COLOR_SWATCHES.find(({ value }) => sameColor(value, color))?.label ??
    color.toUpperCase()
  );
}

export function projectColorStyle(color: string): CSSProperties {
  return { [PROJECT_COLOR_VAR]: color } as CSSProperties;
}

export function occurrenceColorStyle(
  occurrence: Pick<CalendarOccurrence, "color">,
): CSSProperties {
  return projectColorStyle(occurrence.color);
}

export type DeliveryDates = Pick<
  Project,
  "manualDeliveryDate" | "calculatedDeliveryDate"
>;

export function deliveryDate({
  manualDeliveryDate,
  calculatedDeliveryDate,
}: DeliveryDates): Date | null {
  return manualDeliveryDate ?? calculatedDeliveryDate;
}

