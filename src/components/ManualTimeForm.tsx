"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addManualTime } from "@/actions/timeEntries";
import { Button } from "@/components/ui/button";
import { FormValidationAlerts } from "@/components/FormValidationAlerts";
import TimeEntryFields, { type DateOption } from "@/components/TimeEntryFields";

const DEFAULT_MANUAL_HOURS = "1";
const LUNCH_HOURS_LABEL = "🍽️ Ajouter Dîner (0.5h)";

type ManualTimeFormProps = {
  employeeId: number;
  dateOptions: DateOption[];
  defaultDate?: string;
  disabled?: string;
};

export default function ManualTimeForm({
  employeeId,
  dateOptions,
  defaultDate,
  disabled,
}: ManualTimeFormProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState(addManualTime, undefined);

  useEffect(() => {
    if (!state?.message) return;

    router.refresh();
    toast.success(state.message, { position: "top-left", icon: "✅" });
  }, [state, router]);

  return (
    <div className="bg-card rounded-lg border-2 p-2">
      <div className="border-primary mb-2 border-b-2 pb-1 text-center text-xs font-bold">
        Ajout Manuel
      </div>
      <form action={action} className="space-y-1.5">
        <input type="hidden" name="employeeId" value={employeeId} />
        <FormValidationAlerts errors={state?.errors} />
        <TimeEntryFields
          errors={state?.errors}
          dateOptions={dateOptions}
          defaultDate={defaultDate}
          defaultHours={DEFAULT_MANUAL_HOURS}
          disabled={pending || !!disabled}
        />
        <Button
          size="sm"
          type="submit"
          name="command"
          value="add"
          disabled={pending || !!disabled}
          className="w-full rounded-sm text-xs font-semibold uppercase"
        >
          Ajouter
        </Button>
        <Button
          size="sm"
          type="submit"
          name="command"
          value="lunch"
          variant="secondary"
          disabled={pending || !!disabled}
          className="w-full rounded-sm text-xs font-semibold uppercase"
        >
          {LUNCH_HOURS_LABEL}
        </Button>
      </form>
    </div>
  );
}
