import { z } from "zod";

export const FreezeWeekFormSchema = z.object({
  employeeId: z.string(),
  weekStart: z.string(),
  weekTotal: z.string(),
  objective: z.string(),
  frozen: z.string(),
});

export type FreezeWeekFormState =
  | {
      errors?: {
        employeeId?: string[];
        weekStart?: string[];
        weekTotal?: string[];
        objective?: string[];
        schemaValidation?: string;
        dataValidation?: string;
      };
      message?: string;
    }
  | undefined;

export const FrozenWeekSchema = z.object({
  employeeId: z.number().int(),
  weekStart: z.date(),
  weekTotal: z.number(),
  objective: z.number(),
  isDeleted: z.boolean().default(false),
  deletedAt: z.date().nullable().optional(),
  deletedBy: z.number().int().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type FrozenWeek = z.infer<typeof FrozenWeekSchema>;
