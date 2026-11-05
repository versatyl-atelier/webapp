"use client";

import { useId } from "react";

import { FieldErrors } from "@/components/FieldErrors";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LANCEUR_COLUMNS,
  LANCEUR_NONE_VALUE,
  LANCEUR_NO_RESPONSIBLE_LABEL,
} from "@/constants/lanceur";
import {
  INTAKE_PRICE_STEP,
  INTAKE_VALUE_LABEL,
  INTAKE_VALUE_PLACEHOLDER,
} from "@/constants/lanceurIntake";
import type { LanceurEmployee } from "@/lib/lanceur";
import type { SlotForm } from "@/lib/lanceurIntake";
import { cn } from "@/lib/utils";

const LABEL_CLASS = "text-2xs font-semibold uppercase";
const INPUT_CLASS = "h-7 px-1.5 text-xs md:text-xs";
const TRIGGER_CLASS = "h-7 w-full px-1.5 text-xs";

type OptionFieldProps = {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  noneLabel: string;
  onChange: (value: string) => void;
};

function OptionField({
  label,
  value,
  options,
  noneLabel,
  onChange,
}: OptionFieldProps) {
  const selected = options.find((option) => option.value === value);
  return (
    <Field>
      <FieldLabel className={LABEL_CLASS}>{label}</FieldLabel>
      <Select
        value={value === "" ? LANCEUR_NONE_VALUE : value}
        onValueChange={(next) =>
          onChange(next === null || next === LANCEUR_NONE_VALUE ? "" : next)
        }
      >
        <SelectTrigger aria-label={label} className={TRIGGER_CLASS}>
          <SelectValue>{selected?.label ?? noneLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={LANCEUR_NONE_VALUE}>{noneLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

type DateFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function DateField({ label, value, onChange }: DateFieldProps) {
  const id = useId();
  return (
    <Field>
      <FieldLabel htmlFor={id} className={LABEL_CLASS}>
        {label}
      </FieldLabel>
      <Input
        id={id}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={INPUT_CLASS}
      />
    </Field>
  );
}

type LanceurIntakeFieldsProps = {
  form: SlotForm;
  error?: string;
  etapes: string[];
  installateurs: string[];
  employees: LanceurEmployee[];
  className?: string;
  onChange: (patch: Partial<SlotForm>) => void;
};

export function LanceurIntakeFields({
  form,
  error,
  etapes,
  installateurs,
  employees,
  className,
  onChange,
}: LanceurIntakeFieldsProps) {
  const priceId = useId();
  const asOptions = (values: string[]) =>
    values.map((value) => ({ value, label: value }));

  return (
    <div className={cn("grid gap-2", className)}>
      <Field>
        <FieldLabel htmlFor={priceId} className={LABEL_CLASS}>
          {INTAKE_VALUE_LABEL}
        </FieldLabel>
        <Input
          id={priceId}
          type="number"
          min={0}
          step={INTAKE_PRICE_STEP}
          required
          value={form.price}
          placeholder={INTAKE_VALUE_PLACEHOLDER}
          aria-invalid={error !== undefined}
          onChange={(event) => onChange({ price: event.target.value })}
          className={INPUT_CLASS}
        />
        {error && <FieldErrors errors={[error]} />}
      </Field>
      <DateField
        label={LANCEUR_COLUMNS.pdm}
        value={form.pdmDate}
        onChange={(pdmDate) => onChange({ pdmDate })}
      />
      <DateField
        label={LANCEUR_COLUMNS.approval}
        value={form.approvalDate}
        onChange={(approvalDate) => onChange({ approvalDate })}
      />
      <DateField
        label={LANCEUR_COLUMNS.delivery}
        value={form.deliveryDate}
        onChange={(deliveryDate) => onChange({ deliveryDate })}
      />
      <OptionField
        label={LANCEUR_COLUMNS.etape}
        value={form.etape}
        options={asOptions(etapes)}
        noneLabel={" "}
        onChange={(etape) => onChange({ etape })}
      />
      <OptionField
        label={LANCEUR_COLUMNS.installateur}
        value={form.installateur}
        options={asOptions(installateurs)}
        noneLabel={" "}
        onChange={(installateur) => onChange({ installateur })}
      />
      <OptionField
        label={LANCEUR_COLUMNS.responsible}
        value={form.responsibleId}
        options={employees.map(({ id, name }) => ({
          value: String(id),
          label: name,
        }))}
        noneLabel={LANCEUR_NO_RESPONSIBLE_LABEL}
        onChange={(responsibleId) => onChange({ responsibleId })}
      />
    </div>
  );
}
