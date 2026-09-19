import { Schema } from "effect";

import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { REDIRECT_TO_PARAM } from "@/constants/auth";

export type ChangePasswordPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const ChangePasswordSearchParamsSchema = Schema.Struct({
  [REDIRECT_TO_PARAM]: Schema.optional(Schema.String),
});

export default async function ChangePasswordPage({
  searchParams,
}: ChangePasswordPageProps) {
  const data = Schema.decodeUnknownSync(ChangePasswordSearchParamsSchema)(
    await searchParams,
  );
  return (
    <main className="mt-2 flex flex-col items-center justify-center px-4">
      <ChangePasswordForm redirectTo={data[REDIRECT_TO_PARAM]} />
    </main>
  );
}
