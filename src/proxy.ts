import { NextRequest, NextResponse } from "next/server";
import { decrypt, getCookieName } from "@/lib/session";
import { cookies } from "next/headers";
import { Role } from "@/generated/prisma/enums";

const protectedRoutes = ["/punch", "/employee"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.includes(path);
  const employeeCookie = (await cookies()).get(
    getCookieName(Role.employee),
  )?.value;
  const employeeSession = employeeCookie ? await decrypt(employeeCookie) : null;
  const managerCookie = (await cookies()).get(
    getCookieName(Role.manager),
  )?.value;
  const managerSession = managerCookie ? await decrypt(managerCookie) : null;

  if (isProtectedRoute && !employeeSession && !managerSession) {
    return NextResponse.redirect(
      new URL(
        `/login?role=${Role.employee}&redirectTo=${encodeURIComponent(path)}`,
        req.nextUrl,
      ),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
