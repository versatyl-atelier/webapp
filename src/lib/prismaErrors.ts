import "server-only";

import type { PrismaError } from "@/generated/effect-prisma";

const GENERIC_ERROR_MESSAGE = "Une erreur est survenue, veuillez réessayer";

const PRISMA_ERROR_MESSAGES: Record<PrismaError["_tag"], string | null> = {
  PrismaUniqueConstraintError: "Cette valeur existe déjà",
  PrismaRecordNotFoundError: "Élément introuvable",
  PrismaRelatedRecordNotFoundError: "Élément lié introuvable",
  PrismaForeignKeyConstraintError: "Référence invalide",
  PrismaValueTooLongError: "Valeur trop longue",
  PrismaValueOutOfRangeError: "Valeur hors limites",
  PrismaMissingRequiredValueError: "Valeur requise manquante",
  PrismaInputValidationError: null,
  PrismaDbConstraintError: null,
  PrismaRelationViolationError: null,
  PrismaConnectionError: null,
  PrismaTransactionConflictError: null,
};

export function isPrismaError(error: unknown): error is PrismaError {
  return (
    typeof error === "object" &&
    error !== null &&
    "_tag" in error &&
    typeof error._tag === "string" &&
    error._tag in PRISMA_ERROR_MESSAGES
  );
}

export function toErrorMessage(error: unknown): string {
  if (isPrismaError(error)) {
    const message = PRISMA_ERROR_MESSAGES[error._tag];
    if (message) {
      return message;
    }
  }
  return GENERIC_ERROR_MESSAGE;
}
