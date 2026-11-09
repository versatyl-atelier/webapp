"use client";

import { Pin } from "lucide-react";
import { useOptimistic, useTransition } from "react";

import { pinProject, unpinProject } from "@/actions/projects";
import { Button } from "@/components/ui/button";
import {
  PIN_PROJECT_LABEL,
  UNPIN_PROJECT_LABEL,
} from "@/constants/projectHome";
import { cn } from "@/lib/utils";

type PinButtonProps = {
  projectId: string;
  pinned: boolean;
  className?: string;
  variant?: "ghost" | "outline";
};

export function PinButton({
  projectId,
  pinned,
  className,
  variant = "ghost",
}: PinButtonProps) {
  const [optimisticPinned, setOptimisticPinned] = useOptimistic(pinned);
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={variant}
      size="icon-sm"
      aria-pressed={optimisticPinned}
      aria-label={optimisticPinned ? UNPIN_PROJECT_LABEL : PIN_PROJECT_LABEL}
      title={optimisticPinned ? UNPIN_PROJECT_LABEL : PIN_PROJECT_LABEL}
      disabled={pending}
      className={className}
      onClick={() =>
        startTransition(async () => {
          setOptimisticPinned(!optimisticPinned);
          await (optimisticPinned ? unpinProject : pinProject)(projectId);
        })
      }
    >
      <Pin className={cn(optimisticPinned && "fill-current")} />
    </Button>
  );
}
