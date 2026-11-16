"use client";

import { Webhook } from "lucide-react";
import { useId, useTransition } from "react";
import { toast } from "sonner";

import {
  clearTrelloDestination,
  clearTrelloStageList,
  registerTrelloWebhooks,
  saveTrelloDestination,
  saveTrelloStageList,
} from "@/actions/trello";
import {
  TrelloListPicker,
  type TrelloListChoice,
} from "@/components/TrelloListPicker";
import { Button } from "@/components/ui/button";
import {
  PROJECT_STAGE_LABELS,
  SAVED_TOAST_OPTIONS,
} from "@/constants/projects";
import {
  TRELLO_DESTINATIONS_DESCRIPTION,
  TRELLO_DESTINATIONS_HEADING,
  TRELLO_DESTINATION_KEYS,
  TRELLO_DESTINATION_LABELS,
  TRELLO_REGISTER_WEBHOOKS_LABEL,
  TRELLO_WEBHOOK_FAILURES_LABEL,
  TRELLO_WEBHOOK_STALE_LABEL,
  TRELLO_STAGES_DESCRIPTION,
  TRELLO_STAGES_HEADING,
  TRELLO_STAGE_LINES,
  TRELLO_UNAVAILABLE_MESSAGE,
  TRELLO_WEBHOOKS_DESCRIPTION,
  TRELLO_WEBHOOKS_HEADING,
  TRELLO_WEBHOOKS_NONE_LABEL,
  TRELLO_WEBHOOKS_REGISTERED_MESSAGE,
  TRELLO_WEBHOOK_ACTIVE_LABEL,
  TRELLO_WEBHOOK_MISSING_LABEL,
} from "@/constants/trello";
import type { WebhookStatus } from "@/lib/trello";
import type {
  ProjectStage,
  TrelloDestinationKey,
} from "@/generated/prisma/enums";

const WEBHOOK_STATUS_LABELS: Record<WebhookStatus, string> = {
  missing: TRELLO_WEBHOOK_MISSING_LABEL,
  stale: TRELLO_WEBHOOK_STALE_LABEL,
  active: TRELLO_WEBHOOK_ACTIVE_LABEL,
};

type TrelloConfigFormProps = {
  boards: readonly { id: string; name: string }[];
  unavailable: boolean;
  destinations: readonly (TrelloListChoice & { key: TrelloDestinationKey })[];
  stageLists: readonly (TrelloListChoice & { stage: ProjectStage })[];
  webhooks: readonly {
    boardId: string;
    boardName: string;
    saved: boolean;
    status: WebhookStatus;
    failures: number;
  }[];
};

export function TrelloConfigForm({
  boards,
  unavailable,
  destinations,
  stageLists,
  webhooks,
}: TrelloConfigFormProps) {
  const headingId = useId();
  const [pending, startTransition] = useTransition();
  const needsRegistration = webhooks.some(({ status }) => status !== "active");

  const register = () =>
    startTransition(async () => {
      try {
        await registerTrelloWebhooks();
        toast.success(TRELLO_WEBHOOKS_REGISTERED_MESSAGE, SAVED_TOAST_OPTIONS);
      } catch {
        toast.error(TRELLO_UNAVAILABLE_MESSAGE);
      }
    });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
      {unavailable && (
        <p
          role="alert"
          className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm"
        >
          {TRELLO_UNAVAILABLE_MESSAGE}
        </p>
      )}
      <section
        aria-labelledby={`${headingId}-destinations`}
        className="flex flex-col gap-4"
      >
        <div>
          <h2
            id={`${headingId}-destinations`}
            className="text-lg font-semibold tracking-tight"
          >
            {TRELLO_DESTINATIONS_HEADING}
          </h2>
          <p className="text-muted-foreground text-sm">
            {TRELLO_DESTINATIONS_DESCRIPTION}
          </p>
        </div>
        {TRELLO_DESTINATION_KEYS.map((key) => {
          const current = destinations.find((row) => row.key === key) ?? null;
          return (
            <TrelloListPicker
              key={`${key}-${current?.listId ?? ""}`}
              label={TRELLO_DESTINATION_LABELS[key]}
              boards={boards}
              current={current}
              onSave={async (listId) => {
                await saveTrelloDestination(key, listId);
                return null;
              }}
              onClear={() => clearTrelloDestination(key)}
            />
          );
        })}
      </section>
      <section
        aria-labelledby={`${headingId}-stages`}
        className="flex flex-col gap-4"
      >
        <div>
          <h2
            id={`${headingId}-stages`}
            className="text-lg font-semibold tracking-tight"
          >
            {TRELLO_STAGES_HEADING}
          </h2>
          <p className="text-muted-foreground text-sm">
            {TRELLO_STAGES_DESCRIPTION}
          </p>
        </div>
        {TRELLO_STAGE_LINES.map((stage) => {
          const current = stageLists.find((row) => row.stage === stage) ?? null;
          return (
            <TrelloListPicker
              key={`${stage}-${current?.listId ?? ""}`}
              label={PROJECT_STAGE_LABELS[stage]}
              boards={boards}
              current={current}
              onSave={(listId) => saveTrelloStageList(stage, listId)}
              onClear={() => clearTrelloStageList(stage)}
            />
          );
        })}
      </section>
      <section
        aria-labelledby={`${headingId}-webhooks`}
        className="flex flex-col gap-4"
      >
        <div>
          <h2
            id={`${headingId}-webhooks`}
            className="text-lg font-semibold tracking-tight"
          >
            {TRELLO_WEBHOOKS_HEADING}
          </h2>
          <p className="text-muted-foreground text-sm">
            {TRELLO_WEBHOOKS_DESCRIPTION}
          </p>
        </div>
        {webhooks.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {TRELLO_WEBHOOKS_NONE_LABEL}
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5 text-sm">
            {webhooks.map(({ boardId, boardName, status, failures }) => (
              <li key={boardId} className="flex flex-wrap gap-x-3">
                <span className="font-medium">{boardName}</span>
                <span
                  className={
                    status === "active"
                      ? "text-muted-foreground"
                      : "text-destructive"
                  }
                >
                  {WEBHOOK_STATUS_LABELS[status]}
                </span>
                {failures > 0 && (
                  <span className="text-destructive">
                    {`${failures} ${TRELLO_WEBHOOK_FAILURES_LABEL}`}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || !needsRegistration}
            onClick={register}
          >
            <Webhook />
            {TRELLO_REGISTER_WEBHOOKS_LABEL}
          </Button>
        </div>
      </section>
    </div>
  );
}
