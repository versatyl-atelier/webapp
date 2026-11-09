"use server";

import "server-only";

import { refresh } from "next/cache";

import { Role } from "@/generated/prisma/enums";
import type {
  ProjectStage,
  TrelloDestinationKey,
} from "@/generated/prisma/enums";
import { cachedGetter, protectedEffect } from "@/lib/effect";
import {
  clearTrelloDestinationEffect,
  clearTrelloStageListEffect,
  getTrelloConfigEffect,
  getTrelloListsEffect,
  registerTrelloWebhooksEffect,
  reregisterTrelloWebhooksEffect,
  saveTrelloDestinationEffect,
  saveTrelloStageListEffect,
} from "@/effects/trelloConfig";

export const getTrelloConfig = cachedGetter(getTrelloConfigEffect, [
  Role.manager,
]);

const getTrelloListsRead = protectedEffect(getTrelloListsEffect, [
  Role.manager,
]);
const saveDestinationMutation = protectedEffect(
  saveTrelloDestinationEffect,
  [Role.manager],
  "mutation",
);
const clearDestinationMutation = protectedEffect(
  clearTrelloDestinationEffect,
  [Role.manager],
  "mutation",
);
const saveStageListMutation = protectedEffect(
  saveTrelloStageListEffect,
  [Role.manager],
  "mutation",
);
const clearStageListMutation = protectedEffect(
  clearTrelloStageListEffect,
  [Role.manager],
  "mutation",
);
const registerWebhooksMutation = protectedEffect(
  registerTrelloWebhooksEffect,
  [Role.manager],
  "mutation",
);

const reregisterWebhooksMutation = protectedEffect(
  reregisterTrelloWebhooksEffect,
  [Role.manager],
  "mutation",
);

export async function getTrelloLists(boardId: string) {
  return getTrelloListsRead(boardId);
}

export async function saveTrelloDestination(
  key: TrelloDestinationKey,
  listId: string,
): Promise<void> {
  await saveDestinationMutation(key, listId);
  refresh();
}

export async function clearTrelloDestination(
  key: TrelloDestinationKey,
): Promise<void> {
  await clearDestinationMutation(key);
  refresh();
}

export async function saveTrelloStageList(
  stage: ProjectStage,
  listId: string,
): Promise<string | null> {
  const error = await saveStageListMutation(stage, listId);
  refresh();
  return error;
}

export async function clearTrelloStageList(stage: ProjectStage): Promise<void> {
  await clearStageListMutation(stage);
  refresh();
}

export async function registerTrelloWebhooks(): Promise<number> {
  const registered = await registerWebhooksMutation();
  refresh();
  return registered;
}

export async function reregisterTrelloWebhooks(): Promise<number> {
  const registered = await reregisterWebhooksMutation();
  refresh();
  return registered;
}
