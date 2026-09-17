"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addManualTime } from "@/actions/timeEntries";
import { Button } from "@/components/ui/button";
import { FormValidationAlerts } from "@/components/FormValidationAlerts";
import ProjectSelect from "@/components/ProjectSelect";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEFAULT_MANUAL_HOURS = "1";
const LUNCH_HOURS_LABEL = "🍽️ Ajouter Dîner (0.5h)";

export type DateOption = {
  value: string;
  label: string;
};

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
    <div className="border-punch-dark rounded-lg border-2 bg-white p-2.5">
      <div className="border-punch-accent mb-2 border-b-2 pb-1 text-center text-xs font-bold">
        Ajout Manuel
      </div>
      <form action={action} className="space-y-2.5">
        <input type="hidden" name="employeeId" value={employeeId} />
        <FormValidationAlerts errors={state?.errors} />
        <ProjectSelect className="p-1.5" disabled={pending || !!disabled} />
        {state?.errors?.projectId?.map((error: string) => (
          <FieldError key={error}>- {error}</FieldError>
        ))}
        <Field>
          <FieldLabel className="mb-1 block text-xs font-semibold text-black uppercase">
            Heures
          </FieldLabel>
          <Input
            name="hours"
            type="text"
            defaultValue={DEFAULT_MANUAL_HOURS}
            placeholder="ex: 1.5, 1h30, 30m"
            className="w-full rounded border-2 border-black px-1.5 py-1 text-xs text-black"
            disabled={pending || !!disabled}
          />
          {state?.errors?.hours?.map((error: string) => (
            <FieldError key={error}>- {error}</FieldError>
          ))}
        </Field>
        <Field>
          <FieldLabel className="mb-1 block text-xs font-semibold text-black uppercase">
            Date
          </FieldLabel>
          <Select
            name="date"
            defaultValue={defaultDate}
            disabled={pending || !!disabled}
          >
            <SelectTrigger className="w-full rounded border-2 border-black px-1.5 py-1 text-xs text-black">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dateOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state?.errors?.date?.map((error: string) => (
            <FieldError key={error}>- {error}</FieldError>
          ))}
        </Field>
        <Button
          type="submit"
          name="command"
          value="add"
          variant="secondary"
          disabled={pending || !!disabled}
          className="hover:bg-punch-accent w-full rounded-sm bg-black py-2 text-xs font-semibold text-white uppercase disabled:opacity-50"
        >
          Ajouter
        </Button>
        <Button
          type="submit"
          name="command"
          value="lunch"
          disabled={pending || !!disabled}
          className="bg-punch-secondary-bg border-punch-secondary-border hover:bg-initial w-full rounded-sm border-2 py-2 text-xs font-semibold text-white uppercase disabled:opacity-50"
        >
          {LUNCH_HOURS_LABEL}
        </Button>
      </form>
    </div>
  );
}
