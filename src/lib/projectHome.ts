import { HOME_SEARCH_LIMIT } from "@/constants/projectHome";
import type { ProjectStage } from "@/generated/prisma/enums";
import { normalize } from "@/lib/text";

export type HomeProject = {
  id: string;
  name: string;
  color: string;
  stage: ProjectStage | null;
  address: string;
  coverFileId: string | null;
};

export type SearchableProject = {
  id: string;
  name: string;
  color: string;
  isDeleted: boolean;
};

export function searchProjects<T extends { name: string }>(
  projects: readonly T[],
  query: string,
  limit: number = HOME_SEARCH_LIMIT,
): T[] {
  const needle = normalize(query);
  if (!needle) {
    return [];
  }
  const matches = projects
    .map((project) => ({ project, name: normalize(project.name) }))
    .filter(({ name }) => name.includes(needle));
  const startsWith = matches.filter(({ name }) => name.startsWith(needle));
  const others = matches.filter(({ name }) => !name.startsWith(needle));
  return [...startsWith, ...others]
    .slice(0, limit)
    .map(({ project }) => project);
}

export function movePinBefore(
  ids: readonly string[],
  movedId: string,
  beforeId: string | null,
): string[] {
  if (!ids.includes(movedId) || movedId === beforeId) {
    return [...ids];
  }
  const rest = ids.filter((id) => id !== movedId);
  const index = beforeId === null ? rest.length : rest.indexOf(beforeId);
  return index < 0
    ? [...ids]
    : [...rest.slice(0, index), movedId, ...rest.slice(index)];
}

export function movePinBy(
  ids: readonly string[],
  movedId: string,
  offset: number,
): string[] {
  const from = ids.indexOf(movedId);
  const to = from + offset;
  if (from < 0 || to < 0 || to >= ids.length) {
    return [...ids];
  }
  const next = ids.filter((id) => id !== movedId);
  next.splice(to, 0, movedId);
  return next;
}

export function mergePinOrder(
  requested: readonly string[],
  existing: readonly string[],
): string[] {
  const known = new Set(existing);
  const ordered = [...new Set(requested)].filter((id) => known.has(id));
  return [...ordered, ...existing.filter((id) => !ordered.includes(id))];
}

export function coverUrl(projectId: string, coverFileId: string): string {
  return `/projets/${projectId}/couverture?v=${encodeURIComponent(coverFileId)}`;
}
