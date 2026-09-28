"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { freezeWeek } from "@/actions/frozenWeeks";
import dino from "@/app/punch/employe/[id]/dino.gif";
import { Button } from "@/components/ui/button";
import { FormValidationAlerts } from "@/components/FormValidationAlerts";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { PASSWORD_CHANGE_REQUIRED_ERROR } from "@/constants/auth";
import { useResubmitOnAuth } from "@/hooks/auth";
import { changePasswordPath, loginPath } from "@/lib/paths";

export type FreezeFormProps = {
  employeeId: number;
  weekStart: Date;
  weekTotal: number;
  objective: number;
  weekFrozen: boolean;
};

export function FreezeForm({
  employeeId,
  weekStart,
  weekTotal,
  objective,
  weekFrozen,
}: FreezeFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const setPendingAuth = useResubmitOnAuth(formRef);
  const [state, action, pending] = useActionState(freezeWeek, undefined);
  useEffect(() => {
    if (state?.errors?.auth) {
      setPendingAuth();
      return router.push(
        state.errors.auth === PASSWORD_CHANGE_REQUIRED_ERROR
          ? changePasswordPath()
          : loginPath(),
      );
    }
    if (state?.message === "freezeSuccess") {
      router.refresh();
      toast.success("Semain gelée!", {
        description: "La semaine a été gelée avec succès.",
        duration: 5000,
        position: "top-left",
        icon: "🎉",
        action: (
          <Image
            src={dino}
            alt="Celebration"
            width={60}
            unoptimized
            className="mx-auto mb-3.5"
          />
        ),
      });
    } else if (state?.message === "unfreezeSuccess") {
      router.refresh();
      toast.success("Semaine dégelée!", {
        duration: 5000,
        position: "top-left",
        icon: "✅",
      });
    }
  }, [state]);

  return (
    <form ref={formRef} action={action}>
      <Input type="hidden" name="employeeId" value={employeeId} />
      <Input type="hidden" name="weekStart" value={weekStart.toString()} />
      <Input type="hidden" name="weekTotal" value={weekTotal} />
      <Input type="hidden" name="objective" value={objective} />
      <Input type="hidden" name="frozen" value={weekFrozen ? 1 : 0} />
      <FormValidationAlerts
        errors={state?.errors}
        className="absolute top-16 left-4 w-5/6"
      />

      <Button
        type="submit"
        disabled={pending}
        className="text-2xs rounded-sm font-bold sm:px-2"
      >
        {weekFrozen ? "Dégeler" : "Geler"}
      </Button>
    </form>
  );
}
