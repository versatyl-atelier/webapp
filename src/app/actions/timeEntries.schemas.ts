import { z } from "zod";

export const EditTimeEntryFormSchema = z.object({
  timeEntryId: z.string(),
  projectId: z.string(),
  hours: z.string(),
  command: z.enum(["save", "delete"]),
});

export type EditTimeEntryFormState =
  | {
      errors?: {
        timeEntryId?: string[];
        projectId?: string[];
        hours?: string[];
        command?: string[];
        schemaValidationError?: string;
      };
      message?: string;
    }
  | undefined;

export type Employee = {
  id: number;
  name: string;
  weeklyTarget?: number;
};
