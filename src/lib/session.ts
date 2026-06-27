import "server-only";

import { cookies } from "next/headers";

import { SignJWT, jwtVerify } from "jose";
import { Role } from "@/generated/prisma/client";
import type { SessionPayload } from "@/app/actions/auth.schemas";
import { SESSION_COOKIE_NAMES } from "@/constants/auth";

const sessionDurations: Record<Role, number> = {
  [Role.employee]: 365 * 24 * 60 * 60 * 1000,
  [Role.manager]: 1 * 60 * 1000,
};

if (!process.env.SESSION_SECRET) {
  throw new Error(
    "The SESSION_SECRET environment variable must have a non-empty value in .env",
  );
}
const secretKey = process.env.SESSION_SECRET || "";
const encodedKey = new TextEncoder().encode(secretKey);

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    return undefined;
  }
}

export async function createSession(role: Role) {
  const expiresAt = new Date(Date.now() + sessionDurations[role]);
  const session = await encrypt({ expiresAt });
  const cookieStore = await cookies();
  const cookieName = getCookieName(role);

  cookieStore.set(cookieName, session, {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function updateSession(role: Role) {
  const cookieName = getCookieName(role);
  const session = (await cookies()).get(cookieName)?.value;
  const payload = await decrypt(session);

  if (!session || !payload) {
    return null;
  }

  const expires = new Date(Date.now() + sessionDurations[role]);

  const cookieStore = await cookies();
  cookieStore.set(cookieName, session, {
    httpOnly: true,
    secure: true,
    expires,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSession(role: Role) {
  const cookieStore = await cookies();
  cookieStore.delete(getCookieName(role));
}

export function getCookieName(role: Role) {
  const cookieName = SESSION_COOKIE_NAMES[role];

  if (!cookieName) {
    throw new Error(`No cookie name found for role ${role}`);
  }
  return cookieName;
}
