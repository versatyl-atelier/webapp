export const LANCEUR_DATE_KINDS = ["pdm", "approval", "delivery"] as const;

export type LanceurDateKind = (typeof LANCEUR_DATE_KINDS)[number];

export const LANCEUR_DATE_KIND_LABELS: Record<LanceurDateKind, string> = {
  pdm: "Prises de mesures",
  approval: "Approbations des plans",
  delivery: "Livraisons",
};

export const LANCEUR_DATE_KIND_TITLES: Record<LanceurDateKind, string> = {
  pdm: "PDM",
  approval: "Approbation des plans",
  delivery: "Livraison",
};

export const LANCEUR_EVENT_TAG = "(lanceur de dates)";
export const LANCEUR_EVENT_HOUR = 0;
export const LANCEUR_EVENT_ID = 0;
export const LANCEUR_FILTER_MENU_LABEL = "Dates du Lanceur de dates à afficher";
export const LANCEUR_EVENT_OPEN_LABEL = "Ouvrir dans le Tableau du Lanceur";

export const LIGHT_EVENT_TEXT_CLASS = "text-neutral-950";
export const DARK_EVENT_TEXT_CLASS = "text-white";
export const CUSTOM_EVENT_BG_CLASS = "bg-(--project-color)";
