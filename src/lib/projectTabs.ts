import { PROJECT_TABS } from "@/constants/projects";

export type ProjectTab = (typeof PROJECT_TABS)[number]["value"];

export function findProjectTab(
  value: string | string[] | null | undefined,
): ProjectTab | undefined {
  const candidate = Array.isArray(value) ? value[0] : value;
  return PROJECT_TABS.find(({ value: tab }) => tab === candidate)?.value;
}
