import {
  HOME_LINKS_MIN_ROLE,
  HOME_TITLE_SEPARATOR,
  HOME_WIDGET_LINKS,
  HOME_WIDGET_MIN_ROLES,
  TODAY_HEADING,
  WEEK_HEADING,
  type HomeWidgetId,
  type HomeWidgetLink,
  type HomeWidgetSlot,
} from "@/constants/home";
import type { Role } from "@/generated/prisma/enums";
import {
  formatDayMonth,
  formatWeekLabel,
  mondayOf,
  type DateKey,
} from "@/lib/calendar";
import { hasRole } from "@/lib/permissions";
import type { HomeProject } from "@/lib/projectHome";

export type HomeProjectCard = HomeProject & { pinned: boolean };

function homeTitle(heading: string, detail: string): string {
  return `${heading}${HOME_TITLE_SEPARATOR}${detail}`;
}

export function todayWidgetTitle(today: DateKey): string {
  return homeTitle(TODAY_HEADING, formatDayMonth(today));
}

export function weekWidgetTitle(today: DateKey): string {
  return homeTitle(WEEK_HEADING, formatWeekLabel(mondayOf(today)));
}

export function homeLayoutForRole(
  layout: readonly HomeWidgetSlot[],
  role: Role,
): HomeWidgetSlot[] {
  return layout.filter(({ widget }) =>
    hasRole(role, HOME_WIDGET_MIN_ROLES[widget]),
  );
}

export function canFollowHomeLinks(role: Role): boolean {
  return hasRole(role, HOME_LINKS_MIN_ROLE);
}

export function homeWidgetLink(
  widget: HomeWidgetId,
  interactive: boolean,
): HomeWidgetLink | null {
  return interactive ? HOME_WIDGET_LINKS[widget] : null;
}

export function homeProjectCards(
  home: { pinned: readonly HomeProject[]; recent: readonly HomeProject[] },
  limit: number,
): HomeProjectCard[] {
  return [
    ...home.pinned.map((project) => ({ ...project, pinned: true })),
    ...home.recent.map((project) => ({ ...project, pinned: false })),
  ].slice(0, limit);
}
