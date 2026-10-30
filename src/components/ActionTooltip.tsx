"use client";

import type { ReactElement, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ACTION_TONE_CLASSES, type ActionTone } from "@/constants/actions";

type ActionTooltipProps = {
  label: string;
  render: ReactElement;
  children: ReactNode;
};

type DisabledActionProps = {
  label: string;
  reason: string;
  icon: ReactNode;
  tone: ActionTone;
};

export function ActionTooltip({ label, render, children }: ActionTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger render={render}>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function DisabledAction({
  label,
  reason,
  icon,
  tone,
}: DisabledActionProps) {
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
        variant="ghost"
        size="icon-sm"
        disabled
        aria-hidden
        className={ACTION_TONE_CLASSES[tone]}
      >
        {icon}
      </Button>
    </ActionTooltip>
  );
}
