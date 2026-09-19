import { Schema } from "effect";
import { LoginForm } from "@/components/Login";
import { REDIRECT_TO_PARAM } from "@/constants/auth";

export type LoginPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const LoginSearchParamsSchema = Schema.Struct({
  [REDIRECT_TO_PARAM]: Schema.optional(Schema.String),
});

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const data = Schema.decodeUnknownSync(LoginSearchParamsSchema)(
    await searchParams,
  );
  return (
    <main className="mt-2 flex flex-col items-center justify-center">
      <LoginForm redirectTo={data[REDIRECT_TO_PARAM]} />
    </main>
  );
}
