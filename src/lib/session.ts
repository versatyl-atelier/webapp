import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth";
import { changePasswordPath, loginPath } from "@/lib/paths";
import { toAppSession } from "@/lib/permissions";
import type { AppSession } from "@/schemas/auth.schemas";

export const getSession = cache(async (): Promise<AppSession | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  return session ? toAppSession(session.user) : null;
});

export async function requireActiveSession(
  redirectTo?: string,
): Promise<AppSession> {
  const session = await getSession();
  if (!session) {
    redirect(loginPath(redirectTo));
  }
  if (session.mustChangePassword) {
    redirect(changePasswordPath(redirectTo));
  }
  return session;
}
