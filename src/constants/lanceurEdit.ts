export const EDIT_SESSION_STORAGE_KEY = "lanceur-edit-session";

export const EDIT_FIELDS = [
  "price",
  "pdmDate",
  "approvalDate",
  "deliveryDate",
] as const;

export type EditField = (typeof EDIT_FIELDS)[number];

export const EDIT_FIELD_LABELS: Record<EditField, string> = {
  price: "Valeur production",
  pdmDate: "PDM",
  approvalDate: "Approbation",
  deliveryDate: "Livraison",
};

export const EDIT_BUTTON_LABEL = "Éditer";
export const EDIT_CANCEL_LABEL = "Annuler les modifications";
export const EDIT_STARTED_MESSAGE =
  "Mode édition : Enregistrer officialisera les modifications";
export const EDIT_NO_CHANGE_SAVED_MESSAGE =
  "Aucune modification, retour en consultation";
export const EDIT_NO_CHANGE_CANCELLED_MESSAGE = "Aucune modification à annuler";
export const EDIT_CANCELLED_MESSAGE =
  "Modifications annulées, retour à l'enregistrement précédent";
export const EDIT_CANCEL_TITLE = "Annuler les modifications?";
export const EDIT_CANCEL_KEEP_LABEL = "Continuer l'édition";

export function editSavedMessage(count: number): string {
  return `Enregistré : ${count} modification${count > 1 ? "s" : ""}`;
}

export function editCancelDescription(count: number): string {
  return `${count} modification${count > 1 ? "s seront annulées" : " sera annulée"} et les dates reviendront à l'enregistrement précédent.`;
}
