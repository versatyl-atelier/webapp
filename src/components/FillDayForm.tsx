"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { fillDay } from "@/actions/timeEntries";
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
import type { DateOption } from "@/components/ManualTimeForm";
import {
  calculateHoursNeeded,
  formatTimeDisplay,
  parseTimeToSeconds,
  secondsToHours,
} from "@/lib/time";

const DEFAULT_FILL_TARGET = "8";

type FillDayFormProps = {
  employeeId: number;
  dateOptions: DateOption[];
  defaultDate?: string;
  dailyHours: Record<string, number>;
  disabled?: string;
};

export default function FillDayForm({
  employeeId,
  dateOptions,
  defaultDate,
  dailyHours,
  disabled,
}: FillDayFormProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState(fillDay, undefined);
  const [date, setDate] = useState(defaultDate ?? dateOptions[0]?.value);
  const [target, setTarget] = useState(DEFAULT_FILL_TARGET);

  const targetHours = secondsToHours(parseTimeToSeconds(target));
  const existingHours = dailyHours[date ?? ""] ?? 0;
  const hoursToAdd = calculateHoursNeeded(targetHours, existingHours);

  useEffect(() => {
    if (!state?.message) return;

    router.refresh();
    toast.success(state.message, { position: "top-left", icon: "✅" });
  }, [state, router]);

  return (
    <div className="border-punch-dark rounded-lg border-2 bg-white p-2.5">
      <div className="border-punch-accent mb-2 border-b-2 pb-1 text-center text-xs font-bold">
        Combler Journée
      </div>
      <form action={action} className="space-y-2.5">
        <input type="hidden" name="employeeId" value={employeeId} />
        <FormValidationAlerts errors={state?.errors} />
        <Field>
          <FieldLabel className="mb-1 block text-xs font-semibold text-black uppercase">
            Date
          </FieldLabel>
          <Select
            name="date"
            value={date}
            onValueChange={setDate}
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
        <Field>
          <FieldLabel className="mb-1 block text-xs font-semibold text-black uppercase">
            Objectif
          </FieldLabel>
          <Input
            name="target"
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="ex: 8, 8h, 7h30"
            className="w-full rounded border-2 border-black px-1.5 py-1 text-xs text-black"
            disabled={pending || !!disabled}
          />
          {state?.errors?.target?.map((error: string) => (
            <FieldError key={error}>- {error}</FieldError>
          ))}
        </Field>
        <div className="border-punch-accent bg-punch-light rounded border-l-4 p-2">
          <div
            className={`text-sm font-bold ${
              hoursToAdd > 0 ? "text-black" : "text-punch-pos-diff"
            }`}
          >
            {hoursToAdd > 0
              ? `+${formatTimeDisplay(hoursToAdd)}`
              : "Objectif déjà atteint"}
          </div>
          <div className="text-punch-dark text-xs uppercase">À combler</div>
        </div>
        <ProjectSelect
          title="AVEC"
          className="p-1.5"
          disabled={pending || !!disabled}
        />
        {state?.errors?.projectId?.map((error: string) => (
          <FieldError key={error}>- {error}</FieldError>
        ))}
        <Button
          type="submit"
          disabled={pending || !!disabled}
          className="hover:bg-punch-accent-hover w-full rounded-sm bg-black py-2 text-xs font-semibold text-white uppercase disabled:opacity-50"
        >
          Combler
        </Button>
      </form>
    </div>
  );
}
