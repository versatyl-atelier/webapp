export const ACTION_TONE_CLASSES = {
  edit: "text-info hover:bg-info/10 hover:text-info",
  create:
    "text-punch-pos-diff hover:bg-punch-pos-diff/10 hover:text-punch-pos-diff",
  reset:
    "text-warning-foreground hover:bg-warning hover:text-warning-foreground",
  destructive:
    "text-destructive hover:bg-destructive/10 hover:text-destructive",
} as const;

export type ActionTone = keyof typeof ACTION_TONE_CLASSES;
