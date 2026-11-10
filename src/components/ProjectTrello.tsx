"use client";

import { RefreshCw, Send } from "lucide-react";
import { useId, useTransition } from "react";
import { toast } from "sonner";

import {
  createDesignCard,
  regenerateCard,
  sendPieceCards,
} from "@/actions/projects";
import { ActionTooltip } from "@/components/ActionTooltip";
import { RowTitle } from "@/components/RowTitle";
import { Button } from "@/components/ui/button";
import { SAVED_TOAST_OPTIONS } from "@/constants/projects";
import {
  TRELLO_CREATE_DESIGN_LABEL,
  TRELLO_LOST_LABEL,
  TRELLO_PROJECT_HEADING,
  TRELLO_REASON_NOT_CONFIGURED,
  TRELLO_REASON_NO_PIECES,
  TRELLO_REGENERATE_LABEL,
  TRELLO_REGENERATED_MESSAGE,
  TRELLO_SEND_ATELIER_LABEL,
  TRELLO_SEND_PLANIFICATION_LABEL,
  TRELLO_SENT_MESSAGE,
  TRELLO_UNAVAILABLE_MESSAGE,
} from "@/constants/trello";
import { TrelloCardRole, TrelloDestinationKey } from "@/generated/prisma/enums";

type ProjectTrelloProps = {
  projectId: string;
  keys: TrelloDestinationKey[];
  pieceCount: number;
  lost: { id: number; label: string }[];
};

const ATELIER_KEYS: readonly TrelloDestinationKey[] = [
  TrelloDestinationKey.atelierSimple,
  TrelloDestinationKey.atelierCaisson,
  TrelloDestinationKey.atelierFinition,
];

type TrelloActionProps = {
  label: string;
  reason: string | null;
  pending: boolean;
  onClick: () => void;
};

function TrelloAction({ label, reason, pending, onClick }: TrelloActionProps) {
  if (reason === null) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={onClick}
      >
        <Send />
        {label}
      </Button>
    );
  }
  return (
    <ActionTooltip
      label={reason}
      render={
        <span
          tabIndex={0}
          aria-label={`${label} : ${reason}`}
          className="rounded-md"
        />
      }
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled
        aria-hidden
        tabIndex={-1}
      >
        <Send />
        {label}
      </Button>
    </ActionTooltip>
  );
}

export function ProjectTrello({
  projectId,
  keys,
  pieceCount,
  lost,
}: ProjectTrelloProps) {
  const headingId = useId();
  const [pending, startTransition] = useTransition();

  const designReason = keys.includes(TrelloDestinationKey.design)
    ? null
    : TRELLO_REASON_NOT_CONFIGURED;
  const planificationReason = !keys.includes(TrelloDestinationKey.planification)
    ? TRELLO_REASON_NOT_CONFIGURED
    : pieceCount === 0
      ? TRELLO_REASON_NO_PIECES
      : null;
  const atelierReason = !ATELIER_KEYS.some((key) => keys.includes(key))
    ? TRELLO_REASON_NOT_CONFIGURED
    : pieceCount === 0
      ? TRELLO_REASON_NO_PIECES
      : null;

  const run = (task: () => Promise<boolean>, message: string) =>
    startTransition(async () => {
      if (await task()) {
        toast.success(message, SAVED_TOAST_OPTIONS);
      } else {
        toast.error(TRELLO_UNAVAILABLE_MESSAGE);
      }
    });

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2.5">
      <RowTitle id={headingId} className="min-h-7 content-center">
        {TRELLO_PROJECT_HEADING}
      </RowTitle>
      <div className="flex flex-wrap gap-2">
        <TrelloAction
          label={TRELLO_CREATE_DESIGN_LABEL}
          reason={designReason}
          pending={pending}
          onClick={() =>
            run(() => createDesignCard(projectId), TRELLO_SENT_MESSAGE)
          }
        />
        <TrelloAction
          label={TRELLO_SEND_PLANIFICATION_LABEL}
          reason={planificationReason}
          pending={pending}
          onClick={() =>
            run(
              () => sendPieceCards(projectId, TrelloCardRole.planification),
              TRELLO_SENT_MESSAGE,
            )
          }
        />
        <TrelloAction
          label={TRELLO_SEND_ATELIER_LABEL}
          reason={atelierReason}
          pending={pending}
          onClick={() =>
            run(
              () => sendPieceCards(projectId, TrelloCardRole.atelier),
              TRELLO_SENT_MESSAGE,
            )
          }
        />
      </div>
      {lost.length > 0 && (
        <ul className="flex flex-col gap-1.5" aria-label={TRELLO_LOST_LABEL}>
          {lost.map(({ id, label }) => (
            <li
              key={id}
              className="bg-destructive/10 text-destructive flex flex-wrap items-center gap-3 rounded-md px-3 py-2 text-sm"
            >
              <span className="font-medium">{label}</span>
              <span>{TRELLO_LOST_LABEL}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ml-auto"
                disabled={pending}
                onClick={() =>
                  run(() => regenerateCard(id), TRELLO_REGENERATED_MESSAGE)
                }
              >
                <RefreshCw />
                {TRELLO_REGENERATE_LABEL}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
