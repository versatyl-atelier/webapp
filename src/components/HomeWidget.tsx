import { Suspense } from "react";

import { HomeProjects } from "@/components/HomeProjects";
import { HomeProjectsSkeleton } from "@/components/HomeProjectsSkeleton";
import { HomeWeekCalendar } from "@/components/HomeWeekCalendar";
import { HomeWidgetSkeleton } from "@/components/HomeWidgetSkeleton";
import { LanceurPreview } from "@/components/LanceurPreview";
import { TodayEvents } from "@/components/TodayEvents";
import {
  HOME_SIDE_WIDGET_HEIGHT_CLASS,
  HOME_WEEK_HEIGHT_CLASS,
  HOME_WIDGETS,
  type HomeWidgetId,
} from "@/constants/home";
import { LANCEUR_PREVIEW_HEADING } from "@/constants/lanceurPreview";
import { Role } from "@/generated/prisma/enums";
import type { DateKey } from "@/lib/calendar";
import {
  canFollowHomeLinks,
  homeWidgetLink,
  todayWidgetTitle,
  weekWidgetTitle,
} from "@/lib/home";
import { hasRole } from "@/lib/permissions";

type HomeWidgetProps = {
  widget: HomeWidgetId;
  today: DateKey;
  role: Role;
};

export function HomeWidget({ widget, today, role }: HomeWidgetProps) {
  const interactive = canFollowHomeLinks(role);
  const link = homeWidgetLink(widget, interactive);

  switch (widget) {
    case HOME_WIDGETS.today:
      return (
        <Suspense
          fallback={
            <HomeWidgetSkeleton
              widget={widget}
              title={todayWidgetTitle(today)}
              link={link}
              heightClass={HOME_SIDE_WIDGET_HEIGHT_CLASS}
            />
          }
        >
          <TodayEvents today={today} interactive={interactive} />
        </Suspense>
      );
    case HOME_WIDGETS.lanceur:
      return (
        <Suspense
          fallback={
            <HomeWidgetSkeleton
              widget={widget}
              title={LANCEUR_PREVIEW_HEADING}
              link={link}
              heightClass={HOME_SIDE_WIDGET_HEIGHT_CLASS}
            />
          }
        >
          <LanceurPreview today={today} interactive={interactive} />
        </Suspense>
      );
    case HOME_WIDGETS.week:
      return (
        <Suspense
          fallback={
            <HomeWidgetSkeleton
              widget={widget}
              title={weekWidgetTitle(today)}
              link={link}
              heightClass={HOME_WEEK_HEIGHT_CLASS}
            />
          }
        >
          <HomeWeekCalendar
            today={today}
            canEdit={hasRole(role, Role.manager)}
            interactive={interactive}
          />
        </Suspense>
      );
    case HOME_WIDGETS.projects:
      return (
        <Suspense fallback={<HomeProjectsSkeleton />}>
          <HomeProjects />
        </Suspense>
      );
  }
}
