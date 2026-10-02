import type { ExternalToast } from "sonner";

import { EVENT_COLOR_LABELS } from "@/constants/calendar";
import { ProjectStage } from "@/generated/prisma/enums";

export const PROJECT_TABS = [
  { value: "structure", label: "Structure" },
  { value: "dropbox", label: "Dropbox" },
  { value: "notes", label: "Notes" },
] as const;

export const DEFAULT_PROJECT_TAB = PROJECT_TABS[0].value;
export const STRUCTURE_TAB = PROJECT_TABS[0].value;

export const PROJECT_TAB_PARAM = "tab";

export const PROJECT_TITLE_PLACEHOLDER = "Nom du projet (nom du client)";
export const PROJECT_TITLE_LABEL = "Nom du projet";
export const PROJECT_COLOR_LABEL = "Couleur du projet";
export const CURRENT_COLOR_LABEL = "Couleur actuelle";
export const PROJECT_COLOR_VAR = "--project-color";
export const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
export const PROJECT_COLOR_SWATCHES = [
  { value: "#3B7DD8", label: EVENT_COLOR_LABELS.blue },
  { value: "#0F9E7B", label: EVENT_COLOR_LABELS.teal },
  { value: "#8B5CF6", label: EVENT_COLOR_LABELS.purple },
  { value: "#E07C3A", label: EVENT_COLOR_LABELS.orange },
  { value: "#C2507A", label: EVENT_COLOR_LABELS.pink },
  { value: "#4F63D2", label: EVENT_COLOR_LABELS.indigo },
  { value: "#5F9E3A", label: EVENT_COLOR_LABELS.lime },
  { value: "#C9850C", label: EVENT_COLOR_LABELS.amber },
] as const;
export const PROJECT_STAGES = Object.values(ProjectStage);
export const DONE_PROJECT_STAGE = ProjectStage.termine;
export const PROJECT_STAGE_LABELS: Record<ProjectStage, string> = {
  venteDesign: "Vente / Design",
  planification: "Planification",
  programmation: "Programmation",
  production: "Production",
  finition: "Finition",
  livraison: "Livraison",
  installation: "Installation",
  termine: "Terminé",
};
export const PROJECT_STAGE_LABEL = "Étape";
export const ACTIVE_PROJECT_SINGULAR_LABEL = "projet actif";
export const ACTIVE_PROJECT_PLURAL_LABEL = "projets actifs";
export const NO_PROJECT_STAGE_VALUE = "none";
export const NO_PROJECT_STAGE_LABEL = "Aucune étape";
export const PROJECT_ADDRESS_LABEL = "Adresse du projet";
export const PROJECT_ADDRESS_PLACEHOLDER =
  "Ex. 300 Chemin d'Iron Hill, Lac-Brome";
export const EDIT_LABEL = "Éditer";
export const SAVE_LABEL = "Enregistrer";
export const CANCEL_LABEL = "Annuler";

export const CONTACTS_HEADING = "Contacts";
export const ADD_CONTACT_LABEL = "Ajouter un contact";
export const REMOVE_CONTACT_LABEL = "Retirer ce contact";
export const NO_CONTACTS_LABEL = "Aucun contact.";
export const UNNAMED_CONTACT_LABEL = "Contact sans nom";
export const CONTACT_DETAIL_SEPARATOR = " · ";
export const CONTACT_FIELDS = [
  { key: "role", label: "Rôle", placeholder: "Ex. Client, Entrepreneur…" },
  { key: "name", label: "Nom", placeholder: "Nom" },
  { key: "company", label: "Compagnie", placeholder: "Compagnie (optionnel)" },
  { key: "phone", label: "Téléphone", placeholder: "Téléphone" },
  { key: "email", label: "Courriel", placeholder: "Courriel" },
] as const;

export const PIECES_HEADING = "Pièces";
export const PIECES_HINT =
  "Par défaut, les pièces sont listées directement — pas besoin de phase pour un projet simple. « Ajouter une phase » ne devient utile que si le projet se divise en plusieurs livraisons, ou si le client revient plus tard pour un nouveau projet.";
export const ADD_PHASE_LABEL = "Ajouter une phase";
export const REMOVE_PHASE_LABEL = "Supprimer cette phase";
export const PHASE_NAME_LABEL = "Nom de la phase";
export const PHASE_NAME_PREFIX = "Phase";
export const ADD_PIECE_LABEL = "Ajouter une pièce";
export const REMOVE_PIECE_LABEL = "Retirer cette pièce";
export const UNNAMED_PIECE_LABEL = "Pièce sans nom";
export const NO_PIECE_DETAILS_LABEL = "Aucun détail renseigné.";
export const PIECE_DRAG_TYPE = "application/x-versatyl-piece";
export const DRAG_PIECE_LABEL = "Glisser vers une autre phase";
export const PIECE_TYPE_LABEL = "Type de pièce";
export const PIECE_TYPE_PLACEHOLDER = "Ex. Cuisine, Salle de bain…";
export const PIECE_PHASE_LABEL = "Phase";
export const CABINET_COUNT_LABEL = "Nombre de caissons";
export const CABINET_COUNT_READ_LABEL = "Caissons";
export const PIECE_TEXT_FIELDS = [
  { key: "caissonMaterial", label: "Matériel caisson" },
  { key: "cladding", label: "Habillage / façade" },
  { key: "doors", label: "Portes et façades" },
  { key: "drawers", label: "Type de tiroirs" },
  { key: "hardware", label: "Quincaillerie" },
  { key: "finish", label: "Finition" },
] as const;

export const SUGGESTIONS_LIMIT = 6;
export const DEFAULT_SUGGESTIONS = {
  type: [
    "Cuisine",
    "Salle de bain",
    "Salle de lavage",
    "Walk-in",
    "Vestibule",
    "Meuble TV",
    "Habillage foyer",
  ],
  caissonMaterial: ["Mélamine blanche", "Contreplaqué préfini", "MDF peint"],
  cladding: ["Mélamine", "Thermoplastique", "Bois massif", "Laminate"],
  doors: ["Shaker", "Plate (slab)", "Thermoplastique moulé", "Bois massif"],
  drawers: ["Standard", "Queue d'aronde", "Fermeture amortie"],
  hardware: [
    "Charnières amorties + coulisses amorties",
    "Charnières standard",
    "Coulisses standard",
  ],
  finish: ["Peinture blanche mate", "Teinture noyer", "Laqué haute brillance"],
  role: [
    "Client",
    "Entrepreneur",
    "Chargé de projet",
    "Designer",
    "Architecte",
    "Responsable chantier",
    "Représentant",
    "Électricien",
    "Autre",
  ],
  company: [],
} as const satisfies Record<string, readonly string[]>;

export const SAVED_TOAST_OPTIONS = {
  position: "top-left",
  icon: "✅",
} as const satisfies ExternalToast;

export const PROJECT_SAVED_MESSAGE = "Projet enregistré";
export const CONTACTS_SAVED_MESSAGE = "Contacts enregistrés";
export const PIECE_SAVED_MESSAGE = "Pièce enregistrée";
export const PROJECT_NOT_FOUND_MESSAGE = "Projet introuvable";
export const PIECE_NOT_FOUND_MESSAGE = "Pièce introuvable";
export const PHASE_NOT_FOUND_MESSAGE = "Phase introuvable";
export const PROJECT_NAME_REQUIRED_MESSAGE = "Le nom du projet est requis";
export const INVALID_COLOR_MESSAGE = "Couleur invalide";
export const INVALID_EMAIL_MESSAGE = "Courriel invalide";
export const INVALID_CABINET_COUNT_MESSAGE =
  "Le nombre de caissons doit être un entier positif";
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const RECENT_SUGGESTION_ROWS = 200;
