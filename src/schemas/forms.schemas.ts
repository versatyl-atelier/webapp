export type FormState = {
  errors?: {
    schemaValidation?: string;
    dataValidation?: string;
    auth?: string;
  };
  message?: string;
};
