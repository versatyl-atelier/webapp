import { UPCOMING_OFFSET_VAR } from "@/constants/home";
import {
  ACTIVE_PROJECT_PLURAL_LABEL,
  ACTIVE_PROJECT_SINGULAR_LABEL,
  CABINET_COUNT_READ_LABEL,
  CONTACT_DETAIL_SEPARATOR,
  CURRENT_COLOR_LABEL,
  DEFAULT_SUGGESTIONS,
  DONE_PROJECT_STAGE,
  PHASE_NAME_PREFIX,
  PIECE_TEXT_FIELDS,
  PROJECT_COLOR_SWATCHES,
  PROJECT_COLOR_VAR,
  PROJECT_STAGES,
  UNNAMED_CONTACT_LABEL,
} from "@/constants/projects";
import type {
  Project,
  ProjectContact,
  ProjectPhase,
  ProjectPiece,
} from "@/generated/prisma/client";
import { ProjectType, type ProjectStage } from "@/generated/prisma/enums";
import type { CSSProperties } from "react";
import { daysBetween, toDateKey, type DateKey } from "@/lib/calendar";
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
  stage: ProjectStage | null;
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

export type PipelineProject = Pick<Project, "id" | "name" | "stage" | "color">;

export type PipelineStage = {
  stage: ProjectStage;
  projects: PipelineProject[];
};

export function projectsByStage(
  projects: readonly PipelineProject[],
): PipelineStage[] {
  return PROJECT_STAGES.map((stage) => ({
    stage,
    projects: projects.filter((project) => project.stage === stage),
  }));
}

export function activeProjectCount(stages: readonly PipelineStage[]): number {
  return stages.reduce(
    (count, { stage, projects }) =>
      stage === DONE_PROJECT_STAGE ? count : count + projects.length,
    0,
  );
}

export function activeProjectsLabel(count: number): string {
  return `${count} ${count > 1 ? ACTIVE_PROJECT_PLURAL_LABEL : ACTIVE_PROJECT_SINGULAR_LABEL}`;
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

export type DeliveryProject = Pick<Project, "id" | "name" | "color"> &
  DeliveryDates;

export type UpcomingDelivery = Pick<Project, "id" | "name" | "color"> & {
  date: DateKey;
  offsetPercent: number;
};

export function upcomingDeliveries(
  projects: readonly DeliveryProject[],
  today: DateKey,
  horizonDays: number,
  maxOffsetPercent: number,
): UpcomingDelivery[] {
  return projects
    .flatMap(({ id, name, color, ...dates }) => {
      const delivery = deliveryDate(dates);
      if (!delivery) {
        return [];
      }
      const date = toDateKey(delivery);
      const days = daysBetween(today, date);
      if (days < 0 || days > horizonDays) {
        return [];
      }
      const offsetPercent = (days / horizonDays) * maxOffsetPercent;
      return [{ id, name, color, date, offsetPercent }];
    })
    .toSorted((a, b) => a.date.localeCompare(b.date));
}

export function upcomingDeliveryStyle({
  color,
  offsetPercent,
}: Pick<UpcomingDelivery, "color" | "offsetPercent">): CSSProperties {
  return {
    ...projectColorStyle(color),
    [UPCOMING_OFFSET_VAR]: `${offsetPercent}%`,
  } as CSSProperties;
}
