import {
  CABINET_COUNT_READ_LABEL,
  CONTACT_DETAIL_SEPARATOR,
  CURRENT_COLOR_LABEL,
  DEFAULT_SUGGESTIONS,
  PHASE_NAME_PREFIX,
  PIECE_TEXT_FIELDS,
  PROJECT_COLOR_SWATCHES,
  PROJECT_COLOR_VAR,
  UNNAMED_CONTACT_LABEL,
} from "@/constants/projects";
import type {
  ProjectContact,
  ProjectPhase,
  ProjectPiece,
} from "@/generated/prisma/client";
import { ProjectType } from "@/generated/prisma/enums";
import type { CSSProperties } from "react";
import { parseItemKey } from "@/lib/itemKey";

export function projectIdsToProjectData(projectIds: string[]) {
  return projectIds.map((projectId) => {
    const { type, id } = parseItemKey(projectId);
    const strId = id.toString();
    const isProject = type === ProjectType.trello;
    return {
      projectId: isProject ? strId : null,
      taskId: isProject ? null : parseInt(strId, 10),
      projectType: isProject ? ProjectType.trello : ProjectType.task,
    };
  });
}

export type SuggestionField = keyof typeof DEFAULT_SUGGESTIONS;

export type FicheSuggestions = Record<SuggestionField, string[]>;

export type ContactRecord = Pick<
  ProjectContact,
  "role" | "name" | "company" | "phone" | "email"
>;

export type PhaseRecord = Pick<ProjectPhase, "id" | "name">;

export type PieceRecord = Pick<
  ProjectPiece,
  | "id"
  | "phaseId"
  | "type"
  | "caissonMaterial"
  | "cladding"
  | "doors"
  | "drawers"
  | "hardware"
  | "finish"
  | "cabinetCount"
>;

export type ProjectFiche = {
  id: string;
  name: string;
  color: string;
  address: string;
  contacts: ContactRecord[];
  phases: PhaseRecord[];
  pieces: PieceRecord[];
};

export const EMPTY_CONTACT: ContactRecord = {
  role: "",
  name: "",
  company: "",
  phone: "",
  email: "",
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

export function contactHeadline(contact: ContactRecord): string {
  return contact.name || contact.company || UNNAMED_CONTACT_LABEL;
}

export function contactDetails(contact: ContactRecord): string {
  return [contact.name ? contact.company : "", contact.phone, contact.email]
    .filter(Boolean)
    .join(CONTACT_DETAIL_SEPARATOR);
}

export function isEmptyContact(contact: ContactRecord): boolean {
  return Object.values(contact).every((value) => !value.trim());
}

export function pieceReadFields(
  piece: PieceRecord,
): { label: string; value: string }[] {
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
  return [...fields, ...count].filter(({ value }) => value);
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
    | "doors"
    | "drawers"
    | "hardware"
    | "finish"
  >[],
  contacts: readonly Pick<ContactRecord, "role" | "company">[],
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
    cladding: from(pieces, "cladding"),
    doors: from(pieces, "doors"),
    drawers: from(pieces, "drawers"),
    hardware: from(pieces, "hardware"),
    finish: from(pieces, "finish"),
    role: from(contacts, "role"),
    company: from(contacts, "company"),
  };
}

export type ColorOption = { value: string; label: string };

function sameColor(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

export function projectColorLabel(color: string): string {
  return (
    PROJECT_COLOR_SWATCHES.find(({ value }) => sameColor(value, color))
      ?.label ?? `${CURRENT_COLOR_LABEL} (${color})`
  );
}

export function projectColorOptions(current: string): ColorOption[] {
  const isSwatch = PROJECT_COLOR_SWATCHES.some(({ value }) =>
    sameColor(value, current),
  );
  return isSwatch
    ? [...PROJECT_COLOR_SWATCHES]
    : [
        ...PROJECT_COLOR_SWATCHES,
        { value: current, label: projectColorLabel(current) },
      ];
}

export function projectColorStyle(color: string): CSSProperties {
  return { [PROJECT_COLOR_VAR]: color } as CSSProperties;
}
