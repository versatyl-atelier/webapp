import { Schema } from "effect";
import { LogoutForm } from "@/components/Logout";
import { REDIRECT_TO_PARAM } from "@/constants/auth";

export type LogoutPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const LogoutSearchParamsSchema = Schema.Struct({
  [REDIRECT_TO_PARAM]: Schema.optional(Schema.String),
});

export default async function LogoutPage({ searchParams }: LogoutPageProps) {
  const data = Schema.decodeUnknownSync(LogoutSearchParamsSchema)(
    await searchParams,
  );
  return (
    <main className="mt-2 flex flex-col items-center justify-center">
      <LogoutForm redirectTo={data[REDIRECT_TO_PARAM]} />
    </main>
  );
}
