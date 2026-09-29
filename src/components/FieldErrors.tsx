import { FieldError } from "@/components/ui/field";

export function FieldErrors({ errors }: { errors?: string[] }) {
  return (
    <FieldError>
      {errors?.map((error) => (
        <p key={error}>- {error}</p>
      ))}
    </FieldError>
  );
}
