import { Schema } from "effect";
import { LoginForm } from "@/components/Login";
import { Role } from "@/generated/prisma/enums";

export type LoginPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const LoginSearchParamsSchema = Schema.Struct({
  role: Schema.Enums(Role),
  redirectTo: Schema.optional(Schema.String),
});

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const data = Schema.decodeUnknownSync(LoginSearchParamsSchema)(
    await searchParams,
  );
  return (
    <main className="mt-2 flex flex-col items-center justify-center">
      <LoginForm role={data.role} redirectTo={data.redirectTo} />
    </main>
  );
}
