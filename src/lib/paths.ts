import {
  CHANGE_PASSWORD_PATH,
  EMAIL_PARAM,
  LOGIN_PATH,
  PROTECTED_PATH_PREFIXES,
  REDIRECT_TO_PARAM,
} from "@/constants/auth";

function withRedirectTo(path: string, redirectTo?: string): string {
  if (!redirectTo) {
    return path;
  }
  const params = new URLSearchParams({ [REDIRECT_TO_PARAM]: redirectTo });
  return `${path}?${params.toString()}`;
}

export function loginPath(redirectTo?: string, email?: string): string {
  const path = withRedirectTo(LOGIN_PATH, redirectTo);
  if (!email) {
    return path;
  }
  const separator = redirectTo ? "&" : "?";
  return `${path}${separator}${new URLSearchParams({ [EMAIL_PARAM]: email }).toString()}`;
}

export function employeePath(employeeId: number): string {
  return `/punch/employe/${employeeId}`;
}

export function projectPath(projectId: string): string {
  return `/projets/${projectId}`;
}

export function changePasswordPath(redirectTo?: string): string {
  return withRedirectTo(CHANGE_PASSWORD_PATH, redirectTo);
}

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
