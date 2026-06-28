import { LoginForm } from "@/components/Login";
import { Role } from "@/generated/prisma/enums";
import { redirect } from "next/navigation";
import z from "zod";
export type LoginPageProps = {
  searchParams: { [key: string]: string | string[] | undefined };
};

const LoginSearchParamsSchema = z.object({
  role: z.nativeEnum(Role),
  redirectTo: z.string().optional(),
});

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const result = LoginSearchParamsSchema.safeParse(await searchParams);
  const { success, data } = result;
  if (!success) {
    return redirect(`/login?role=${Role.employee}`);
  }
  return <LoginForm role={data?.role} redirectTo={data?.redirectTo} />;
}
