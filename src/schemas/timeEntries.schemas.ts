import { Schema } from "effect";
import { FormState } from "@/schemas/forms.schemas";
import { TimeEntryGetPayload } from "@/generated/prisma/models";

export const EditTimeEntryFormSchema = Schema.Struct({
  timeEntryId: Schema.String,
  projectId: Schema.String,
  startTime: Schema.String,
  hours: Schema.String,
  command: Schema.Literal("save", "delete"),
});

export type EditTimeEntryFormErrors = {
  timeEntryId?: string[];
  projectId?: string[];
  startTime?: string[];
  hours?: string[];
  command?: string[];
};

export type EditTimeEntryFormState =
  | (FormState & {
      errors?: EditTimeEntryFormErrors;
    })
  | undefined;

export const AddManualTimeFormSchema = Schema.Struct({
  employeeId: Schema.String,
  projectId: Schema.String,
  hours: Schema.String,
  date: Schema.String,
  command: Schema.Literal("add", "lunch"),
});

export type AddManualTimeFormErrors = {
  employeeId?: string[];
  projectId?: string[];
  hours?: string[];
  date?: string[];
  command?: string[];
};

export type AddManualTimeFormState =
  | (FormState & {
      errors?: AddManualTimeFormErrors;
    })
  | undefined;

export const FillDayFormSchema = Schema.Struct({
  employeeId: Schema.String,
  projectId: Schema.String,
  target: Schema.String,
  date: Schema.String,
});

export type FillDayFormErrors = {
  employeeId?: string[];
  projectId?: string[];
  target?: string[];
  date?: string[];
};

export type FillDayFormState =
  | (FormState & {
      errors?: FillDayFormErrors;
    })
  | undefined;

export type Employee = {
  id: number;
  name: string;
  weeklyTarget?: number;
};

export type DateRange = {
  startDate: string;
  endDate: string;
};

export const timeEntryInclude = {
  projects: {
    include: {
      project: {
        select: { name: true },
      },
      task: {
        select: { name: true },
      },
    },
  },
};

export type TimeEntryWithRelations = TimeEntryGetPayload<{
  include: typeof timeEntryInclude;
}>;
