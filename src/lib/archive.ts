export function splitArchived<T extends { isDeleted: boolean }>(
  items: readonly T[],
): { active: T[]; archived: T[] } {
  return {
    active: items.filter(({ isDeleted }) => !isDeleted),
    archived: items.filter(({ isDeleted }) => isDeleted),
  };
}
