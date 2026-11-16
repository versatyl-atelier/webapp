import { createHmac, timingSafeEqual } from "node:crypto";

import {
  TRELLO_ACTION_TYPES,
  TRELLO_DESCRIPTION_SEPARATOR,
  TRELLO_DESTINATION_BY_CARD,
  TRELLO_EVENT_KINDS,
  TRELLO_FIELD_SEPARATOR,
  TRELLO_LINE_SEPARATOR,
  TRELLO_NAME_SEPARATOR,
  TRELLO_PHASE_SPLIT_MINIMUM,
  TRELLO_SIGNATURE_ALGORITHM,
  TRELLO_SIGNATURE_ENCODING,
  TRELLO_VARIANT_NAME_SUFFIXES,
  TRELLO_WEBHOOK_PATH,
  TRELLO_WORD_SEPARATOR,
  type TrelloEventKind,
} from "@/constants/trello";
import {
  TrelloCardState,
  TrelloCardVariant,
  type ProjectStage,
  type TrelloCardRole,
  type TrelloDestinationKey,
} from "@/generated/prisma/enums";
import {
  pieceReadFields,
  type PieceReadSource,
  type PieceRecord,
} from "@/lib/projects";
import type { TrelloAction } from "@/schemas/trello.schemas";

export type DesignCard = {
  id: number;
  phaseId: number | null;
  state: TrelloCardState;
};

export type VariantCard = {
  id: number;
  variant: TrelloCardVariant;
  state: TrelloCardState;
};

export type DesignPlan = {
  rebind: { id: number; phaseId: number | null }[];
  show: number[];
  hide: number[];
  create: (number | null)[];
};

export type PlanOptions = { reopen?: boolean };

export type VariantPlan = {
  show: number[];
  hide: number[];
  create: TrelloCardVariant[];
};

const shouldShow = (state: TrelloCardState, options: PlanOptions) =>
  state === TrelloCardState.hidden ||
  (options.reopen === true &&
    (state === TrelloCardState.archived || state === TrelloCardState.active));

const isReusable = ({ state }: { state: TrelloCardState }) =>
  state === TrelloCardState.active || state === TrelloCardState.hidden;

export function destinationKey(
  role: TrelloCardRole,
  variant: TrelloCardVariant,
): TrelloDestinationKey {
  return TRELLO_DESTINATION_BY_CARD[role][variant];
}

export function designSubjects(phaseIds: readonly number[]): (number | null)[] {
  return phaseIds.length >= TRELLO_PHASE_SPLIT_MINIMUM ? [...phaseIds] : [null];
}

export function planDesignCards(
  existing: readonly DesignCard[],
  phaseIds: readonly number[],
  options: PlanOptions = {},
): DesignPlan {
  const plan: DesignPlan = { rebind: [], show: [], hide: [], create: [] };
  const matched = new Set<number>();
  const unmatched: (number | null)[] = [];
  for (const subject of designSubjects(phaseIds)) {
    const card = existing.find(
      ({ id, phaseId }) => phaseId === subject && !matched.has(id),
    );
    if (card) {
      matched.add(card.id);
      if (shouldShow(card.state, options)) {
        plan.show.push(card.id);
      }
    } else {
      unmatched.push(subject);
    }
  }
  const rank = (phaseId: number | null) => {
    if (phaseId === null) {
      return -1;
    }
    const index = phaseIds.indexOf(phaseId);
    return index < 0 ? phaseIds.length : index;
  };
  const leftovers = existing
    .filter(({ id }) => !matched.has(id))
    .toSorted((a, b) => rank(a.phaseId) - rank(b.phaseId) || a.id - b.id);
  const reusable = leftovers.filter(isReusable);
  const anchor = reusable[0];
  const target = unmatched[0];
  const reused = anchor !== undefined && target !== undefined ? anchor : null;
  if (reused !== null) {
    plan.rebind.push({ id: reused.id, phaseId: target });
    if (reused.state === TrelloCardState.hidden) {
      plan.show.push(reused.id);
    }
    unmatched.shift();
  }
  plan.create.push(...unmatched);
  for (const card of leftovers) {
    if (card.id !== reused?.id && card.state === TrelloCardState.active) {
      plan.hide.push(card.id);
    }
  }
  return plan;
}

export function planVariantCards(
  existing: readonly VariantCard[],
  desired: readonly TrelloCardVariant[],
  options: PlanOptions = {},
): VariantPlan {
  const plan: VariantPlan = { show: [], hide: [], create: [] };
  for (const variant of desired) {
    const card = existing.find((candidate) => candidate.variant === variant);
    if (!card) {
      plan.create.push(variant);
    } else if (shouldShow(card.state, options)) {
      plan.show.push(card.id);
    }
  }
  for (const card of existing) {
    if (
      card.state === TrelloCardState.active &&
      !desired.includes(card.variant)
    ) {
      plan.hide.push(card.id);
    }
  }
  return plan;
}

export function atelierVariants(options: {
  hasCaisson: boolean;
  hasFinition: boolean;
}): TrelloCardVariant[] {
  const variants: TrelloCardVariant[] = [];
  if (options.hasCaisson) {
    variants.push(TrelloCardVariant.caisson);
  }
  if (options.hasFinition) {
    variants.push(TrelloCardVariant.finition);
  }
  return variants.length === 0 ? [TrelloCardVariant.simple] : variants;
}

export function designCardName(
  projectName: string,
  phaseName: string | null,
): string {
  return [projectName, phaseName].filter(Boolean).join(TRELLO_NAME_SEPARATOR);
}

export function pieceCardName(
  projectName: string,
  pieceType: string,
  variant: TrelloCardVariant,
): string {
  const base = [projectName, pieceType]
    .filter(Boolean)
    .join(TRELLO_NAME_SEPARATOR);
  return [base, TRELLO_VARIANT_NAME_SUFFIXES[variant]]
    .filter(Boolean)
    .join(TRELLO_WORD_SEPARATOR);
}

export function pieceCardDescription(
  piece: Pick<PieceRecord, "description"> & PieceReadSource,
): string {
  const fields = pieceReadFields(piece)
    .map(({ label, value }) => `${label}${TRELLO_FIELD_SEPARATOR}${value}`)
    .join(TRELLO_LINE_SEPARATOR);
  return [piece.description, fields]
    .filter(Boolean)
    .join(TRELLO_DESCRIPTION_SEPARATOR);
}

export function stageForList(
  listId: string | null,
  stageLists: readonly { stage: ProjectStage; listId: string }[],
): ProjectStage | null {
  if (listId === null) {
    return null;
  }
  return stageLists.find((row) => row.listId === listId)?.stage ?? null;
}

export type CardEvent = {
  actionId: string;
  type: string;
  occurredAt: Date;
  trelloCardId: string;
  kind: TrelloEventKind;
  fromBoardId: string | null;
  fromListId: string | null;
  toBoardId: string | null;
  toListId: string | null;
  actorName: string | null;
};

export function cardEventFromAction(action: TrelloAction): CardEvent | null {
  const { data } = action;
  const cardId = data.card?.id;
  if (cardId === undefined) {
    return null;
  }
  const base = {
    actionId: action.id,
    type: action.type,
    occurredAt: new Date(action.date),
    trelloCardId: cardId,
    actorName: action.memberCreator?.fullName ?? null,
  };
  const none = {
    fromBoardId: null,
    fromListId: null,
    toBoardId: null,
    toListId: null,
  };
  switch (action.type) {
    case TRELLO_ACTION_TYPES.deleteCard:
      return {
        ...base,
        ...none,
        kind: TRELLO_EVENT_KINDS.delete,
        fromBoardId: data.board?.id ?? null,
        fromListId: data.list?.id ?? null,
      };
    case TRELLO_ACTION_TYPES.moveCardToBoard:
      return {
        ...base,
        ...none,
        kind: TRELLO_EVENT_KINDS.move,
        fromBoardId: data.boardSource?.id ?? null,
        toBoardId: data.board?.id ?? null,
        toListId: data.list?.id ?? null,
      };
    case TRELLO_ACTION_TYPES.moveCardFromBoard:
      return {
        ...base,
        ...none,
        kind: TRELLO_EVENT_KINDS.move,
        fromBoardId: data.board?.id ?? null,
        toBoardId: data.boardTarget?.id ?? null,
      };
    case TRELLO_ACTION_TYPES.updateCard:
      return updateCardEvent(base, none, data);
    default:
      return null;
  }
}

function updateCardEvent(
  base: Pick<
    CardEvent,
    "actionId" | "type" | "occurredAt" | "trelloCardId" | "actorName"
  >,
  none: Pick<
    CardEvent,
    "fromBoardId" | "fromListId" | "toBoardId" | "toListId"
  >,
  data: TrelloAction["data"],
): CardEvent | null {
  if (data.listBefore && data.listAfter) {
    const boardId = data.board?.id ?? null;
    return {
      ...base,
      kind: TRELLO_EVENT_KINDS.move,
      fromBoardId: boardId,
      fromListId: data.listBefore.id,
      toBoardId: boardId,
      toListId: data.listAfter.id,
    };
  }
  const closed = data.card?.closed;
  const wasClosed = data.old?.closed;
  if (closed !== undefined && wasClosed !== undefined && closed !== wasClosed) {
    return {
      ...base,
      ...none,
      kind: closed ? TRELLO_EVENT_KINDS.archive : TRELLO_EVENT_KINDS.unarchive,
    };
  }
  return null;
}

export type TrackedCard = {
  state: TrelloCardState;
  boardId: string;
  listId: string;
};

export type CardPatch = Partial<TrackedCard>;

export function planCardEvent(
  card: TrackedCard,
  event: Pick<CardEvent, "kind" | "toBoardId" | "toListId">,
  stageLists: readonly { stage: ProjectStage; listId: string }[],
): { patch: CardPatch; stage: ProjectStage | null } {
  switch (event.kind) {
    case TRELLO_EVENT_KINDS.move: {
      const patch: CardPatch = {};
      if (event.toBoardId !== null && event.toBoardId !== card.boardId) {
        patch.boardId = event.toBoardId;
      }
      if (event.toListId !== null && event.toListId !== card.listId) {
        patch.listId = event.toListId;
      }
      return { patch, stage: stageForList(event.toListId, stageLists) };
    }
    case TRELLO_EVENT_KINDS.archive:
      return {
        patch:
          card.state === TrelloCardState.active
            ? { state: TrelloCardState.archived }
            : {},
        stage: null,
      };
    case TRELLO_EVENT_KINDS.unarchive:
      return {
        patch: isClosed(card.state) ? { state: TrelloCardState.active } : {},
        stage: null,
      };
    case TRELLO_EVENT_KINDS.delete:
      return { patch: { state: TrelloCardState.lost }, stage: null };
  }
}

function isClosed(state: TrelloCardState): boolean {
  return state === TrelloCardState.hidden || state === TrelloCardState.archived;
}

export function webhookSignature(
  body: string,
  callbackUrl: string,
  secret: string,
): string {
  return createHmac(TRELLO_SIGNATURE_ALGORITHM, secret)
    .update(`${body}${callbackUrl}`)
    .digest(TRELLO_SIGNATURE_ENCODING);
}

export function isValidWebhookSignature(
  body: string,
  callbackUrl: string,
  secret: string,
  signature: string | null,
): boolean {
  if (signature === null) {
    return false;
  }
  const expected = Buffer.from(webhookSignature(body, callbackUrl, secret));
  const received = Buffer.from(signature);
  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}

export type WebhookStatus = "missing" | "stale" | "active";

export function webhookStatus(input: {
  saved: boolean;
  remote: { callbackURL: string; consecutiveFailures?: number } | undefined;
  remoteKnown: boolean;
  callbackUrl: string | null;
}): { status: WebhookStatus; failures: number } {
  const present = input.remoteKnown ? input.remote !== undefined : input.saved;
  const failures = input.remote?.consecutiveFailures ?? 0;
  if (!present) {
    return { status: "missing", failures };
  }
  const stale =
    input.remote !== undefined &&
    input.callbackUrl !== null &&
    input.remote.callbackURL !== input.callbackUrl;
  return { status: stale ? "stale" : "active", failures };
}

export type RemoteWebhook = {
  idModel: string;
  callbackURL: string;
  consecutiveFailures?: number;
};

export function boardRemoteWebhook(
  remote: readonly RemoteWebhook[],
  boardId: string,
  callbackUrl: string | null,
): RemoteWebhook | undefined {
  const onBoard = remote.filter(
    ({ idModel, callbackURL }) =>
      idModel === boardId && callbackURL.endsWith(TRELLO_WEBHOOK_PATH),
  );
  return (
    onBoard.find(({ callbackURL }) => callbackURL === callbackUrl) ?? onBoard[0]
  );
}

export function boardWebhookStatus(input: {
  boardId: string;
  saved: ReadonlySet<string>;
  remote: readonly RemoteWebhook[] | null;
  callbackUrl: string | null;
}): { status: WebhookStatus; failures: number } {
  return webhookStatus({
    saved: input.saved.has(input.boardId),
    remote:
      input.remote === null
        ? undefined
        : boardRemoteWebhook(input.remote, input.boardId, input.callbackUrl),
    remoteKnown: input.remote !== null,
    callbackUrl: input.callbackUrl,
  });
}

export function webhookCallbackUrl(baseUrl: string): string {
  return new URL(TRELLO_WEBHOOK_PATH, baseUrl).toString();
}
