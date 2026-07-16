import { Schema } from "effect";
import { LogoutForm } from "@/components/Logout";
import { Role } from "@/generated/prisma/enums";

export type LogoutPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const LogoutSearchParamsSchema = Schema.Struct({
  role: Schema.optional(Schema.Enums(Role)),
  redirectTo: Schema.optional(Schema.String),
});

export default async function LogoutPage({ searchParams }: LogoutPageProps) {
  const data = Schema.decodeUnknownSync(LogoutSearchParamsSchema)(
    await searchParams,
  );
  return (
    <main className="mt-2 flex flex-col items-center justify-center">
      <LogoutForm role={data.role} redirectTo={data.redirectTo} />
    </main>
  );
}
