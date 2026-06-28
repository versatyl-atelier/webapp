import { z } from "zod";
import { type AuthErrorState } from "./auth.schemas";
import { FormState } from "./FormState";

export const EditTimeEntryFormSchema = z.object({
  timeEntryId: z.string(),
  projectId: z.string(),
  hours: z.string(),
  command: z.enum(["save", "delete"]),
});

export type EditTimeEntryFormState = (FormState & {
  errors?: {
    timeEntryId?: string[];
    projectId?: string[];
    hours?: string[];
    command?: string[];
  };
}) | undefined;

export type Employee = {
  id: number;
  name: string;
  weeklyTarget?: number;
};
