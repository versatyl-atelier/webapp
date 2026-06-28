import { z } from "zod";
import { FormState } from "./FormState";

export const ObjectivesAndKilometrageFormSchema = z.object({
  employeeId: z.string(),
  weekStart: z.string(),
  objective: z.string(),
  kilometrage: z.string(),
});

export type ObjectivesAndKilometrageFormState =
  | (FormState & {
      errors?: {
        employeeId?: string[];
        weekStart?: string[];
        objective?: string[];
        kilometrage?: string[];
      };
    })
  | undefined;
