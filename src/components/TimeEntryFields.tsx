"use client";

import { useId, useState } from "react";
import ProjectSelect, { type ProjectOrTask } from "@/components/ProjectSelect";
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
import { SUBTASK_FIELD_LABEL } from "@/constants/tasks";
import { ProjectType } from "@/generated/prisma/enums";

const HOURS_PLACEHOLDER = "ex: 1.5, 1h30, 30m";
const LABEL_CLASS = "mb-1 block text-xs font-semibold uppercase";
const CONTROL_CLASS = "w-full rounded border-2 px-1.5 py-1 text-xs";

export type DateOption = {
  value: string;
  label: string;
};

export type TimeEntryFieldsErrors = {
  projectId?: string[];
  subtaskId?: string[];
  hours?: string[];
  date?: string[];
};

type TimeEntryFieldsProps = {
  errors?: TimeEntryFieldsErrors;
  dateOptions: DateOption[];
  defaultDate?: string;
  defaultHours: string;
  defaultProject?: ProjectOrTask;
  subtasks?: { id: string; name: string }[];
  defaultSubtaskId?: string;
  disabled: boolean;
};

export default function TimeEntryFields({
  errors,
  dateOptions,
  defaultDate,
  defaultHours,
  defaultProject,
  subtasks,
  defaultSubtaskId,
  disabled,
}: TimeEntryFieldsProps) {
  const hoursId = useId();
  const [projectType, setProjectType] = useState<ProjectType | null>(
    defaultProject?.type ?? null,
  );
  const subtaskItems = subtasks?.map(({ id, name }) => ({
    value: id,
    label: name,
  }));

  return (
    <>
      <ProjectSelect
        defaultSelected={defaultProject}
        disabled={disabled}
        onTypeChange={setProjectType}
      />
      <FieldErrors errors={errors?.projectId} />
      {subtaskItems && projectType === ProjectType.trello && (
        <Field>
          <FieldLabel className={LABEL_CLASS}>{SUBTASK_FIELD_LABEL}</FieldLabel>
          <Select
            name="subtaskId"
            items={subtaskItems}
            defaultValue={defaultSubtaskId}
            disabled={disabled}
          >
            <SelectTrigger className={CONTROL_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {subtaskItems.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldErrors errors={errors?.subtaskId} />
        </Field>
      )}
      <Field>
        <FieldLabel htmlFor={hoursId} className={LABEL_CLASS}>
          Heures
        </FieldLabel>
        <Input
          id={hoursId}
          name="hours"
          type="text"
          defaultValue={defaultHours}
          placeholder={HOURS_PLACEHOLDER}
          className={CONTROL_CLASS}
          disabled={disabled}
        />
        <FieldErrors errors={errors?.hours} />
      </Field>
      <Field>
        <FieldLabel className={LABEL_CLASS}>Date</FieldLabel>
        <Select
          name="date"
          items={dateOptions}
          defaultValue={defaultDate}
          disabled={disabled}
        >
          <SelectTrigger className={CONTROL_CLASS}>
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
        <FieldErrors errors={errors?.date} />
      </Field>
    </>
  );
}
