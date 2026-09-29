"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { startMultiPunch, endMultiPunch } from "@/actions/multiPunch";
import { Button } from "@/components/ui/button";
import ProjectSelect from "@/components/ProjectSelect";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { Field, FieldError } from "./ui/field";
import { formatTimeDisplay } from "@/lib/time";

const CUTOFF_HOUR = 16;
const MAX_SELECTIONS = 3;
const PUNCH_START_MESSAGE = "Punch démarré";
const PUNCH_END_MESSAGE = "Punch terminé";
const PUNCH_CANCEL_MESSAGE = "Punch annulé";
const CONFIRM_CANCEL_MESSAGE = "Annuler le punch en cours sans enregistrer?";

type DisplayTime = {
  hours: number;
  minutes: number;
};

type ActivePunchData = {
  startTime: Date;
  activePunchProjects: any[];
} | null;

type MultiPunchFormProps = {
  employeeId: number;
  activePunch: ActivePunchData;
  disabled?: string;
};

function calculateElapsedTime(startTime: Date): DisplayTime {
  const now = new Date();
  const elapsed = Math.floor(
    (now.getTime() - new Date(startTime).getTime()) / 1000,
  );

  return {
    hours: Math.floor(elapsed / 3600),
    minutes: Math.floor((elapsed % 3600) / 60),
  };
}

export default function MultiPunchForm({
  employeeId,
  activePunch: serverActivePunch,
  disabled,
}: MultiPunchFormProps) {
  const router = useRouter();
  const punchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [activePunch, setActivePunch] =
    useState<ActivePunchData>(serverActivePunch);
  const [displayTime, setDisplayTime] = useState<DisplayTime>({
    hours: 0,
    minutes: 0,
  });

  const [startState, startAction, startPending] = useActionState(
    startMultiPunch,
    undefined,
  );

  const [endState, endAction, endPending] = useActionState(
    endMultiPunch,
    undefined,
  );

  useEffect(() => {
    setActivePunch(serverActivePunch);
    if (serverActivePunch) {
      startPunchTimer(serverActivePunch.startTime);
    } else {
      clearAllIntervals();
    }
  }, [serverActivePunch]);

  useEffect(() => {
    if (!startState) return;

    if (startState.message === PUNCH_START_MESSAGE) {
      router.refresh();
      toast.success(`Pointé sur: ${projectNames}`, {
        position: "top-left",
        icon: "✅",
        duration: 5000,
      });
    } else if (startState.errors?.projectIds) {
      toast.error(startState.errors.projectIds[0], { position: "top-left" }); // TODO: Does this belong as `projectIds`?
    }
  }, [startState, router]);

  useEffect(() => {
    if (!endState) return;

    if (
      endState.message === PUNCH_END_MESSAGE ||
      endState.message === PUNCH_CANCEL_MESSAGE
    ) {
      clearAllIntervals();
      setActivePunch(null);
      router.refresh();
      toast.success(endState.message, { position: "top-left" });
    } else if (endState.errors?.command) {
      toast.error(endState.errors.command[0], { position: "top-left" });
    }
  }, [endState, router]);

  useEffect(() => {
    return () => clearAllIntervals();
  }, []);

  function startPunchTimer(startTime: Date) {
    if (punchIntervalRef.current) {
      clearInterval(punchIntervalRef.current);
    }

    const updateElapsed = () => {
      setDisplayTime(calculateElapsedTime(startTime));
    };

    updateElapsed();
    punchIntervalRef.current = setInterval(updateElapsed, 1000);
  }

  function clearAllIntervals() {
    if (punchIntervalRef.current) clearInterval(punchIntervalRef.current);
  }

  function handleCancelClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (!confirm(CONFIRM_CANCEL_MESSAGE)) {
      e.preventDefault();
    }
  }

  const projectNames = activePunch
    ? activePunch.activePunchProjects
        .map(
          (activePunchProject: (typeof activePunch.activePunchProjects)[0]) => {
            return (
              activePunchProject.project?.name ||
              activePunchProject.task?.name ||
              "Unknown"
            );
          },
        )
        .join(", ")
    : "";

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="border-accent-foreground text-accent-foreground mb-2 rounded-none border-b-3 font-bold">
        Pointage Multiple
      </SidebarGroupLabel>
      <SidebarGroupContent>
        {!activePunch ? (
          <form action={startAction}>
            <Field>
              <input type="hidden" name="employeeId" value={employeeId} />
            </Field>
            <ProjectSelect
              multiple
              maxSelections={MAX_SELECTIONS}
              className="bg-muted p-1.5"
            />
            {startState?.errors?.projectIds?.map((error: string) => (
              <FieldError key={error}>- {error}</FieldError>
            ))}
            <Button
              type="submit"
              disabled={startPending || !!disabled}
              className="mt-2 w-full rounded-sm py-2 text-xs font-semibold uppercase"
            >
              {startPending ? "..." : "Punch In"}
            </Button>
            <p className="text-2xs text-muted-foreground mt-1 text-center font-bold italic">
              Tous les punchs s'arrêtent automatiquement à {CUTOFF_HOUR}h00
            </p>
          </form>
        ) : (
          <>
            <dl className="bg-muted rounded border-2 p-2">
              <dt className="text-2xs mr-2 inline-block font-bold">
                En cours:
              </dt>
              <dd className="text-2xs inline-block">{projectNames}</dd>
              <br />
              <dt className="text-2xs mr-2 inline-block font-bold">Durée:</dt>
              <dd className="text-2xs inline-block">
                {formatTimeDisplay(
                  displayTime.hours + displayTime.minutes / 60,
                )}
              </dd>
            </dl>

            <form action={endAction} className="mt-2.5 space-y-2.5">
              <input type="hidden" name="employeeId" value={employeeId} />
              <div className="flex gap-2.5">
                <Button
                  type="submit"
                  name="command"
                  value="end"
                  disabled={endPending || !!disabled}
                  className="flex-1 rounded-sm py-2 font-semibold"
                >
                  {endPending ? "..." : "Punch Out"}
                </Button>
                <Button
                  type="submit"
                  name="command"
                  value="cancel"
                  onClick={handleCancelClick}
                  disabled={endPending || !!disabled}
                  variant="outline"
                  className="flex-1 rounded-sm py-2 font-semibold"
                >
                  {endPending ? "..." : "Annuler"}
                </Button>
              </div>

              <div className="text-2xs text-muted-foreground text-center font-bold italic">
                Punch s'arrête automatiquement à {CUTOFF_HOUR}h00
              </div>
            </form>
          </>
        )}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
