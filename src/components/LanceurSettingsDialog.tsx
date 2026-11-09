"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useId, useRef, useTransition } from "react";

import {
  addClosure,
  removeClosure,
  savePlanSettings,
} from "@/actions/lanceurSettings";
import { FieldErrors } from "@/components/FieldErrors";
import { FormValidationAlerts } from "@/components/FormValidationAlerts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  CAPACITY_RATIO_HINT,
  CAPACITY_RATIO_LABEL,
  CAPACITY_RATIO_STEP,
  CAPACITY_RATIO_SUFFIX,
  CLOSURES_HINT,
  CLOSURES_TITLE,
  CLOSURE_ADD_LABEL,
  CLOSURE_DATE_LABEL,
  CLOSURE_REASON_LABEL,
  CLOSURE_REASON_MAX_LENGTH,
  CLOSURE_REASON_PLACEHOLDER,
  CLOSURE_REMOVE_LABEL,
  MAX_WEEK_SHARE_HINT,
  MAX_WEEK_SHARE_LABEL,
  MAX_WEEK_SHARE_MAX,
  MAX_WEEK_SHARE_MIN,
  MAX_WEEK_SHARE_STEP,
  MAX_WEEK_SHARE_SUFFIX,
  MIN_PROD_DAYS_HINT,
  MIN_PROD_DAYS_LABEL,
  MIN_PROD_DAYS_MAX,
  MIN_PROD_DAYS_SUFFIX,
  NO_CLOSURES_LABEL,
  SETTINGS_BUTTON_LABEL,
  SETTINGS_DIALOG_DESCRIPTION,
  SETTINGS_DIALOG_TITLE,
} from "@/constants/lanceurSettings";
import { SAVE_LABEL } from "@/constants/projects";
import { useFormToast } from "@/hooks/use-form-toast";
import { notifyLanceurChange } from "@/hooks/use-lanceur-sync";
import { formatPlanDate, type PlanSettings } from "@/lib/lanceurPlan";

const LABEL_CLASS = "text-xs font-semibold uppercase";
const NUMBER_INPUT_CLASS = "h-8 w-32 text-right text-sm";

export type ClosureRecord = { id: number; date: string; reason: string };

type LanceurSettingsDialogProps = {
  settings: PlanSettings;
  closures: ClosureRecord[];
};

type NumberFieldProps = {
  name: string;
  label: string;
  hint: string;
  suffix: string;
  defaultValue: number;
  min: number;
  max?: number;
  step: number;
  errors?: string[];
  disabled: boolean;
};

function NumberField({
  name,
  label,
  hint,
  suffix,
  defaultValue,
  min,
  max,
  step,
  errors,
  disabled,
}: NumberFieldProps) {
  const id = useId();
  return (
    <Field>
      <FieldLabel htmlFor={id} className={LABEL_CLASS}>
        {label}
      </FieldLabel>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          name={name}
          type="number"
          required
          min={min}
          max={max}
          step={step}
          defaultValue={defaultValue}
          disabled={disabled}
          className={NUMBER_INPUT_CLASS}
        />
        <span className="text-muted-foreground text-xs">{suffix}</span>
      </div>
      <FieldDescription>{hint}</FieldDescription>
      <FieldErrors errors={errors} />
    </Field>
  );
}

function SettingsForm({ settings }: { settings: PlanSettings }) {
  const [state, action, pending] = useActionState(savePlanSettings, undefined);
  useFormToast(state, { toastErrors: false, onSuccess: notifyLanceurChange });

  return (
    <form action={action} className="space-y-4">
      <FormValidationAlerts errors={state?.errors} />
      <FieldGroup>
        <NumberField
          name="capacityRatio"
          label={CAPACITY_RATIO_LABEL}
          hint={CAPACITY_RATIO_HINT}
          suffix={CAPACITY_RATIO_SUFFIX}
          defaultValue={settings.capacityRatio}
          min={1}
          step={CAPACITY_RATIO_STEP}
          errors={state?.errors?.capacityRatio}
          disabled={pending}
        />
        <NumberField
          name="minProdDays"
          label={MIN_PROD_DAYS_LABEL}
          hint={MIN_PROD_DAYS_HINT}
          suffix={MIN_PROD_DAYS_SUFFIX}
          defaultValue={settings.minProdDays}
          min={1}
          max={MIN_PROD_DAYS_MAX}
          step={1}
          errors={state?.errors?.minProdDays}
          disabled={pending}
        />
        <NumberField
          name="maxWeekShare"
          label={MAX_WEEK_SHARE_LABEL}
          hint={MAX_WEEK_SHARE_HINT}
          suffix={MAX_WEEK_SHARE_SUFFIX}
          defaultValue={settings.maxWeekShare}
          min={MAX_WEEK_SHARE_MIN}
          max={MAX_WEEK_SHARE_MAX}
          step={MAX_WEEK_SHARE_STEP}
          errors={state?.errors?.maxWeekShare}
          disabled={pending}
        />
      </FieldGroup>
      <Button type="submit" size="sm" disabled={pending}>
        {SAVE_LABEL}
      </Button>
    </form>
  );
}

function ClosuresSection({ closures }: { closures: ClosureRecord[] }) {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(addClosure, undefined);
  const [removing, startTransition] = useTransition();
  useFormToast(state, {
    toastErrors: false,
    onSuccess: () => {
      formRef.current?.reset();
      notifyLanceurChange();
    },
  });

  function remove(id: number) {
    startTransition(async () => {
      await removeClosure(id);
      notifyLanceurChange();
    });
  }

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{CLOSURES_TITLE}</h3>
        <p className="text-muted-foreground text-xs">{CLOSURES_HINT}</p>
      </div>
      <form
        ref={formRef}
        action={action}
        className="flex flex-wrap items-end gap-2"
      >
        <Field className="w-40">
          <FieldLabel htmlFor={`${formId}-date`} className={LABEL_CLASS}>
            {CLOSURE_DATE_LABEL}
          </FieldLabel>
          <Input
            id={`${formId}-date`}
            name="date"
            type="date"
            required
            disabled={pending}
            className="h-8 text-sm"
          />
        </Field>
        <Field className="min-w-48 flex-1">
          <FieldLabel htmlFor={`${formId}-reason`} className={LABEL_CLASS}>
            {CLOSURE_REASON_LABEL}
          </FieldLabel>
          <Input
            id={`${formId}-reason`}
            name="reason"
            type="text"
            maxLength={CLOSURE_REASON_MAX_LENGTH}
            placeholder={CLOSURE_REASON_PLACEHOLDER}
            disabled={pending}
            className="h-8 text-sm"
          />
        </Field>
        <Button type="submit" size="sm" disabled={pending}>
          {CLOSURE_ADD_LABEL}
        </Button>
      </form>
      <FormValidationAlerts errors={state?.errors} />
      <FieldErrors errors={state?.errors?.date} />
      <ul className="max-h-56 divide-y overflow-y-auto rounded-md border">
        {closures.length === 0 && (
          <li className="text-muted-foreground p-3 text-center text-xs">
            {NO_CLOSURES_LABEL}
          </li>
        )}
        {closures.map((closure) => (
          <li
            key={closure.id}
            className="flex items-center justify-between gap-2 px-3 py-1 text-sm"
          >
            <span>
              {formatPlanDate(closure.date)}
              {closure.reason !== "" && (
                <span className="text-muted-foreground">
                  {" "}
                  · {closure.reason}
                </span>
              )}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={removing}
              aria-label={`${CLOSURE_REMOVE_LABEL}: ${formatPlanDate(closure.date)}`}
              onClick={() => remove(closure.id)}
            >
              <Trash2 />
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function LanceurSettingsDialog({
  settings,
  closures,
}: LanceurSettingsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button type="button" size="sm" variant="outline">
            {SETTINGS_BUTTON_LABEL}
          </Button>
        }
      />
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{SETTINGS_DIALOG_TITLE}</DialogTitle>
          <DialogDescription>{SETTINGS_DIALOG_DESCRIPTION}</DialogDescription>
        </DialogHeader>
        <SettingsForm settings={settings} />
        <ClosuresSection closures={closures} />
      </DialogContent>
    </Dialog>
  );
}
