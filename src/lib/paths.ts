import {
  CHANGE_PASSWORD_PATH,
  EMAIL_PARAM,
  LOGIN_PATH,
  PROTECTED_PATH_PREFIXES,
  REDIRECT_TO_PARAM,
} from "@/constants/auth";
import { CALENDAR_WEEK_PARAM } from "@/constants/calendar";
import { PROJECT_TAB_PARAM } from "@/constants/projects";
import { TOOLS } from "@/constants/tools";
import type { DateKey } from "@/lib/calendar";
import type { ProjectTab } from "@/lib/projectTabs";

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

export function projectPath(projectId: string, tab?: ProjectTab): string {
  const path = `/projets/${projectId}`;
  if (!tab) {
    return path;
  }
  const params = new URLSearchParams({ [PROJECT_TAB_PARAM]: tab });
  return `${path}?${params.toString()}`;
}

export function changePasswordPath(redirectTo?: string): string {
  return withRedirectTo(CHANGE_PASSWORD_PATH, redirectTo);
}

export function isWithinPath(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some((prefix) =>
    isWithinPath(pathname, prefix),
  );
}

function splitHref(href: string): { path: string; params: URLSearchParams } {
  const [path, query = ""] = href.split("?");
  return { path, params: new URLSearchParams(query) };
}

export function isToolPath(pathname: string): boolean {
  return TOOLS.some(({ href }) => isWithinPath(pathname, splitHref(href).path));
}

export function activeToolHref(
  pathname: string,
  searchParams: URLSearchParams,
): string | undefined {
  return TOOLS.map(({ href }) => ({ href, ...splitHref(href) }))
    .filter(
      ({ path, params }) =>
        isWithinPath(pathname, path) &&
        [...params].every(([key, value]) => searchParams.get(key) === value),
    )
    .sort((a, b) => b.params.size - a.params.size)[0]?.href;
}
