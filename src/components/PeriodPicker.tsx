"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PUNCH_TIMESHEET_PATH } from "@/constants/punch";
import {
  GENERATE_LABEL,
  PAY_END_LABEL,
  PAY_END_PARAM,
  PERIOD_LABEL,
  PERIOD_LABELS,
  PERIOD_PARAM,
  TIMESHEET_PERIODS,
  type TimesheetPeriod,
} from "@/constants/timesheet";
import type { DateKey } from "@/lib/calendar";

type PeriodPickerProps = {
  period: TimesheetPeriod;
  payEnd: DateKey;
  payEnds: DateKey[];
};

export function PeriodPicker({ period, payEnd, payEnds }: PeriodPickerProps) {
  const [selected, setSelected] = useState<TimesheetPeriod>(period);
  const payEndItems = payEnds.map((end) => ({ value: end, label: end }));

  return (
    <form
      action={PUNCH_TIMESHEET_PATH}
      method="get"
      className="flex flex-wrap items-end gap-2.5"
    >
      <Field className="w-52">
        <FieldLabel className="mb-1 block text-xs font-semibold uppercase">
          {PERIOD_LABEL}
        </FieldLabel>
        <Select
          name={PERIOD_PARAM}
          items={PERIOD_LABELS}
          value={selected}
          onValueChange={(value) => {
            if (value !== null) setSelected(value);
          }}
        >
          <SelectTrigger className="w-full rounded border-2 px-1.5 py-1 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMESHEET_PERIODS.map((value) => (
              <SelectItem key={value} value={value}>
                {PERIOD_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {selected === "pay" && (
        <Field className="w-52">
          <FieldLabel className="mb-1 block text-xs font-semibold uppercase">
            {PAY_END_LABEL}
          </FieldLabel>
          <Select
            name={PAY_END_PARAM}
            items={payEndItems}
            defaultValue={payEnd}
          >
            <SelectTrigger className="w-full rounded border-2 px-1.5 py-1 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {payEndItems.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}
      <Button
        type="submit"
        size="sm"
        className="rounded-sm text-xs font-semibold uppercase"
      >
        {GENERATE_LABEL}
      </Button>
    </form>
  );
}
