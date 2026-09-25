export const PROJECT_TABS = [
  { value: "structure", label: "Structure" },
  { value: "dropbox", label: "Dropbox" },
  { value: "notes", label: "Notes" },
] as const;

export const DEFAULT_PROJECT_TAB = PROJECT_TABS[0].value;

export const PROJECT_TAB_PARAM = "tab";
