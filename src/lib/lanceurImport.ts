import {
  LANCEUR_IMPORT_ID_PREFIX,
  LANCEUR_IMPORT_UNASSIGNED_LABELS,
  LANCEUR_MAX_COMMENT_LENGTH,
} from "@/constants/lanceur";
import type { DateKey } from "@/lib/calendar";

export type LegacyGroup = {
  id: string;
  name: string;
  color: string;
  etape: string | null;
  installateur: string | null;
  sortOrder: number;
  livraisonComment: string | null;
  price: number | null;
  signatureDate: DateKey | null;
  approvalDate: DateKey | null;
  deliveryDate: DateKey | null;
};

export type ImportRow = {
  projectId: string;
  projectName: string;
  legacyColor: string;
  etape: string;
  installateur: string;
  deliveryComment: string;
  price: number | null;
  isSigned: boolean;
  pdmDate: DateKey | null;
  approvalDate: DateKey | null;
  deliveryDate: DateKey | null;
  priority: number;
};

export type EmployeeRef = { id: number; name: string };

const HTML_ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};
const LINE_BREAK_PATTERN = /<br\s*\/?>|<\/(p|div)>/gi;
const TAG_PATTERN = /<[^>]*>/g;
const ENTITY_PATTERN = /&(nbsp|amp|lt|gt|quot|#39);/g;
const BLANK_LINES_PATTERN = /\n{3,}/g;
const HORIZONTAL_SPACE_PATTERN = /[ \t]+/g;

export function htmlToText(html: string | null): string {
  if (!html) {
    return "";
  }
  return html
    .replace(LINE_BREAK_PATTERN, "\n")
    .replace(TAG_PATTERN, "")
    .replace(ENTITY_PATTERN, (entity) => HTML_ENTITIES[entity] ?? entity)
    .replace(HORIZONTAL_SPACE_PATTERN, " ")
    .replace(BLANK_LINES_PATTERN, "\n\n")
    .trim()
    .slice(0, LANCEUR_MAX_COMMENT_LENGTH);
}

export function toImportRows(groups: readonly LegacyGroup[]): ImportRow[] {
  return [...groups]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((group, index) => ({
      projectId: `${LANCEUR_IMPORT_ID_PREFIX}${group.id}`,
      projectName: group.name.trim(),
      legacyColor: group.color.toLowerCase(),
      etape: (group.etape ?? "").trim(),
      installateur: (group.installateur ?? "").trim(),
      deliveryComment: htmlToText(group.livraisonComment),
      price: group.price,
      isSigned: group.signatureDate !== null,
      pdmDate: group.signatureDate,
      approvalDate: group.approvalDate,
      deliveryDate: group.deliveryDate,
      priority: index + 1,
    }));
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
}

export function matchEmployee(
  label: string,
  employees: readonly EmployeeRef[],
): EmployeeRef | null {
  const wanted = label.trim().toLowerCase();
  if (wanted === "" || LANCEUR_IMPORT_UNASSIGNED_LABELS.includes(wanted)) {
    return null;
  }
  const matches = employees.filter((employee) => {
    const first = firstName(employee.name);
    return first.startsWith(wanted) || wanted.startsWith(first);
  });
  return matches.length === 1 ? matches[0] : null;
}
