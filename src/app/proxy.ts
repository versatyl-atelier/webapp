import { NextRequest, NextResponse } from "next/server";
import { decrypt, getCookieName } from "@/lib/session";
import { cookies } from "next/headers";
import { Role } from "@/generated/prisma/enums";

// const adminRoutes = [""];
const protectedRoutes = ["/punch"];
// const publicRoutes = ["/", "/login"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  // const isAdminRoute = adminRoutes.includes(path);
  const isProtectedRoute = protectedRoutes.includes(path);
  const employeeCookie = (await cookies()).get(
    getCookieName(Role.employee),
  )?.value;
  const employeeSession = employeeCookie ? await decrypt(employeeCookie) : null;
  const managerCookie = (await cookies()).get(
    getCookieName(Role.manager),
  )?.value;
  const managerSession = managerCookie ? await decrypt(managerCookie) : null;

  // if (isAdminRoute && !managerSession) {
  //   return NextResponse.redirect(
  //     new URL(`/login?role=${Role.manager}`, req.nextUrl),
  //   );
  // }

  if (isProtectedRoute && !employeeSession && !managerSession) {
    return NextResponse.redirect(
      new URL(`/login?role=${Role.employee}`, req.nextUrl),
    );
  }

  return NextResponse.next();
}

// Routes Proxy should not run on
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
