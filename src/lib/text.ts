export function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function matchesQuery(
  query: string,
  ...values: readonly string[]
): boolean {
  const needle = normalize(query);
  return values.some((value) => normalize(value).includes(needle));
}
