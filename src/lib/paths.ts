import {
  CHANGE_PASSWORD_PATH,
  EMAIL_PARAM,
  LOGIN_PATH,
  PROTECTED_PATH_PREFIXES,
  REDIRECT_TO_PARAM,
} from "@/constants/auth";
import { CALENDAR_WEEK_PARAM } from "@/constants/calendar";
import {
  EMPLOYEE_TOOLS,
  HOME_PATH,
  MANAGER_TOOL,
  type Tool,
} from "@/constants/tools";

import type { DateKey } from "@/lib/calendar";

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

export function employeeWeekPath(
  employeeId: number,
  weekStart: DateKey,
): string {
  const params = new URLSearchParams({ [CALENDAR_WEEK_PARAM]: weekStart });
  return `${employeePath(employeeId)}?${params.toString()}`;
}

export function projectPath(projectId: string): string {
  return `/projets/${projectId}`;
}

export function changePasswordPath(redirectTo?: string): string {
  return withRedirectTo(CHANGE_PASSWORD_PATH, redirectTo);
}

export function isWithinPath(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isProtectedPath(pathname: string): boolean {
  return (
    pathname === HOME_PATH ||
    PROTECTED_PATH_PREFIXES.some((prefix) => isWithinPath(pathname, prefix))
  );
}

const ALL_TOOLS = [...EMPLOYEE_TOOLS, MANAGER_TOOL];

export function isToolPath(pathname: string): boolean {
  return ALL_TOOLS.some(({ href }) => isWithinPath(pathname, href));
}

export function activeSectionHref(
  tools: readonly Tool[],
  pathname: string,
): string | undefined {
  return tools
    .filter(({ href }) => isWithinPath(pathname, href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

export function activeToolHref(pathname: string): string | undefined {
  return activeSectionHref(ALL_TOOLS, pathname);
}
