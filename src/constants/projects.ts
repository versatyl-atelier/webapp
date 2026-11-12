import type { ExternalToast } from "sonner";

import { ProjectStage } from "@/generated/prisma/enums";

export const PROJECT_TITLE_PLACEHOLDER = "Nom du projet (nom du client)";
export const PROJECT_TITLE_LABEL = "Nom du projet";
export const NEW_PROJECT_LABEL = "Nouveau projet";
export const CREATE_PROJECT_LABEL = "Créer le projet";
export const NEW_PROJECT_DIALOG_DESCRIPTION =
  "Le dossier Dropbox du projet est créé en même temps.";
export const PROJECT_COLOR_LABEL = "Couleur du projet";
export const PROJECT_COLOR_EDIT_LABEL = "Changer la couleur du projet";
export const PROJECT_COLOR_DIALOG_DESCRIPTION =
  "Cette couleur identifie le projet dans les listes et le calendrier.";
export const PROJECT_COLOR_VAR = "--project-color";
export const PROJECT_STAGES = Object.values(ProjectStage);
export const NEW_PROJECT_STAGE = ProjectStage.venteDesign;
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

export const CONTACTS_HEADING = "Coordonnées";
export const ADD_CONTACT_LABEL = "Ajouter un contact";
export const REMOVE_CONTACT_LABEL = "Retirer ce contact";
export const UNNAMED_CONTACT_LABEL = "Contact sans nom";
export const CONTACT_DETAIL_SEPARATOR = " · ";
export const CONTACT_FIELDS = [
  { key: "role", label: "Rôle", placeholder: "Ex. Client, Entrepreneur…" },
  { key: "name", label: "Nom", placeholder: "Nom" },
  { key: "company", label: "Compagnie", placeholder: "Compagnie (optionnel)" },
  { key: "phone", label: "Téléphone", placeholder: "Téléphone" },
  { key: "email", label: "Courriel", placeholder: "Courriel" },
  { key: "address", label: "Adresse", placeholder: "Adresse (optionnel)" },
] as const;
export const NEW_CONTACT_LABEL = "Nouveau contact";
export const CONTACT_DIALOG_DESCRIPTION =
  "Coordonnées de la personne ressource";
export const CONTACT_OPTIONS_LABEL = "Options du contact";
export const CONTACT_REMOVED_SUFFIX = "supprimé";
export const PROJECT_CARD_ROLE_LABEL = "Projet";
export const PROJECT_CARD_DIALOG_DESCRIPTION =
  "Adresse du chantier et couleur du projet";
export const PROJECT_CARD_ADDRESS_FALLBACK = "Adresse";

export const PIECES_HEADING = "Pièces";
export const ADD_PHASE_LABEL = "Ajouter une phase";
export const ADD_PHASE_SHORT_LABEL = "Phase";
export const ADD_PIECE_SHORT_LABEL = "Pièce";
export const ADD_CONTACT_SHORT_LABEL = "Contact";
export const PIECE_COUNT_SINGULAR_LABEL = "pièce";
export const PIECE_COUNT_PLURAL_LABEL = "pièces";
export const REMOVE_PHASE_LABEL = "Supprimer cette phase";
export const PHASE_NAME_LABEL = "Nom de la phase";
export const PHASE_NAME_PREFIX = "Phase";
export const ADD_PIECE_LABEL = "Ajouter une pièce";
export const REMOVE_PIECE_LABEL = "Retirer cette pièce";
export const UNNAMED_PIECE_LABEL = "Pièce sans nom";
export const NO_PIECE_DETAILS_LABEL = "Aucun détail renseigné.";
export const PIECE_DRAG_TYPE = "application/x-versatyl-piece";
export const DRAG_PIECE_LABEL = "Glisser vers une autre phase";
export const PIECE_TYPE_LABEL = "Nom de la pièce";
export const PIECE_DESCRIPTION_LABEL = "Description";
export const PIECE_DESCRIPTION_PLACEHOLDER = "Description";
export const PIECE_CLADDING_LABEL = "Matériel(s) habillage";
export const PIECE_CLADDING_READ_LABEL = "Habillage";
export const CLADDING_SEPARATOR = " · ";
export const NEW_PIECE_LABEL = "Nouvelle pièce";
export const PIECE_DIALOG_DESCRIPTION =
  "Informations, matériaux et fichiers de la pièce";
export const PIECE_OPTIONS_LABEL = "Options de la pièce";
export const DUPLICATE_PIECE_LABEL = "Dupliquer";
export const PIECE_DUPLICATED_MESSAGE = "Pièce dupliquée";
export const PIECE_COPY_SUFFIX = " (copie)";
export const PIECE_REMOVED_SUFFIX = "supprimée";
export const UNDO_LABEL = "Annuler";
export const REMOVE_CLADDING_LABEL = "Retirer";
export const CLADDING_PLACEHOLDER = "Ajouter un matériau";
export const CLADDING_FORM_FIELD = "cladding";
export const CLADDING_COMMIT_KEYS = ["Enter", ","] as const;
export const CLADDING_REMOVE_KEY = "Backspace";
export const TOAST_UNDO_DURATION_MS = 5000;
export const PIECE_TYPE_PLACEHOLDER = "Ex. Cuisine, Salle de bain…";
export const PIECE_PHASE_LABEL = "Phase";
export const CABINET_COUNT_LABEL = "Nombre de caissons";
export const CABINET_COUNT_READ_LABEL = "Caissons";
export const PIECE_TEXT_FIELDS = [
  { key: "finish", label: "Finition" },
  { key: "caissonMaterial", label: "Matériel caissons" },
  { key: "countertop", label: "Comptoir" },
  { key: "drawers", label: "Tiroirs" },
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
  cladding: [
    "Placage noyer",
    "Laque blanche",
    "Thermoplastique gris",
    "MDF peint",
    "Mélamine Tafisa Chêne naturel",
    "Bois massif",
  ],
  countertop: [
    "Quartz Calacatta 3 cm",
    "Quartz blanc",
    "Stratifié",
    "Granite noir",
    "Bois massif",
  ],
  drawers: [
    "Blum Legrabox",
    "Blum Tandem",
    "Queue d'aronde",
    "Fermeture amortie",
  ],
  finish: [
    "Vernis mat 10°",
    "Peinture blanche mate",
    "Teinture noyer",
    "Laqué haute brillance",
  ],
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
export const PROJECT_CREATED_MESSAGE = "Projet créé";
export const CONTACT_SAVED_MESSAGE = "Contact enregistré";
export const CONTACT_NOT_FOUND_MESSAGE = "Contact introuvable";
export const CONTACT_EMPTY_MESSAGE = "Renseignez au moins un champ";
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
