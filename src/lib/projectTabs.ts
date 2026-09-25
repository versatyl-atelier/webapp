import { DEFAULT_PROJECT_TAB, PROJECT_TABS } from "@/constants/projects";

export type ProjectTab = (typeof PROJECT_TABS)[number]["value"];

export function parseProjectTab(
  value: string | string[] | undefined,
): ProjectTab {
  const candidate = Array.isArray(value) ? value[0] : value;
  return (
    PROJECT_TABS.find(({ value: tab }) => tab === candidate)?.value ??
    DEFAULT_PROJECT_TAB
  );
}
