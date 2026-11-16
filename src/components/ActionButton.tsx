"use client";

import type { ReactNode } from "react";

import { ActionTooltip } from "@/components/ActionTooltip";
import { Button } from "@/components/ui/button";
import { ACTION_TONE_CLASSES, type ActionTone } from "@/constants/actions";
import { useFieldsAction, type FieldsAction } from "@/hooks/use-fields-action";

type ActionButtonProps = {
  action: FieldsAction;
  fields: Record<string, string>;
  label: string;
  icon: ReactNode;
  tone: ActionTone;
};

export function ActionButton({
  action,
  fields,
  label,
  icon,
  tone,
}: ActionButtonProps) {
  const { pending, run } = useFieldsAction(action, fields);

  return (
    <ActionTooltip
      label={label}
      render={
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          disabled={pending}
          className={ACTION_TONE_CLASSES[tone]}
          onClick={run}
        />
      }
    >
      {icon}
    </ActionTooltip>
  );
}
