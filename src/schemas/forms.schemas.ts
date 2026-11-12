import { Schema } from "effect";

import { HEX_COLOR_PATTERN } from "@/constants/color";
import { INVALID_COLOR_MESSAGE } from "@/constants/projects";

export const HexColorSchema = Schema.String.pipe(
  Schema.pattern(HEX_COLOR_PATTERN, { message: () => INVALID_COLOR_MESSAGE }),
);

export type FormState = {
  errors?: {
    schemaValidation?: string;
    dataValidation?: string;
    auth?: string;
  };
  message?: string;
};
