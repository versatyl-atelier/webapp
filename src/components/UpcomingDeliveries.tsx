import Link from "next/link";

import { getUpcomingDeliveries } from "@/actions/projects";
import { HomeCardLink } from "@/components/HomeCardLink";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  EMPTY_UPCOMING_DELIVERIES_LABEL,
  LANCEUR_LINK_LABEL,
  UPCOMING_DELIVERIES_HEADING,
  UPCOMING_DELIVERIES_HORIZON_DAYS,
  UPCOMING_DELIVERIES_LIST_HEIGHT_CLASS,
  UPCOMING_DELIVERIES_MAX_OFFSET_PERCENT,
} from "@/constants/home";
import { cn } from "@/lib/utils";
import { LANCEUR_PATH } from "@/constants/tools";
import { addDays, formatDayMonth, type DateKey } from "@/lib/calendar";
import { projectPath } from "@/lib/paths";
import { upcomingDeliveries, upcomingDeliveryStyle } from "@/lib/projects";

type UpcomingDeliveriesProps = {
  today: DateKey;
};

export async function UpcomingDeliveries({ today }: UpcomingDeliveriesProps) {
  const deliveries = upcomingDeliveries(
    await getUpcomingDeliveries(
      today,
      addDays(today, UPCOMING_DELIVERIES_HORIZON_DAYS),
    ),
    today,
    UPCOMING_DELIVERIES_HORIZON_DAYS,
    UPCOMING_DELIVERIES_MAX_OFFSET_PERCENT,
  );

  return (
    <Card size="sm" className="gap-0 py-0">
      <CardHeader className="bg-muted/50 border-b py-2.5">
        <CardTitle className="font-semibold">
          {UPCOMING_DELIVERIES_HEADING}
        </CardTitle>
        <CardAction>
          <HomeCardLink href={LANCEUR_PATH}>{LANCEUR_LINK_LABEL}</HomeCardLink>
        </CardAction>
      </CardHeader>
      <CardContent className="py-3">
        {deliveries.length === 0 ? (
          <p
            className={cn(
              "text-muted-foreground flex items-center text-sm",
              UPCOMING_DELIVERIES_LIST_HEIGHT_CLASS,
            )}
          >
            {EMPTY_UPCOMING_DELIVERIES_LABEL}
          </p>
        ) : (
          <ol
            className={cn(
              "flex flex-col gap-1 overflow-y-auto",
              UPCOMING_DELIVERIES_LIST_HEIGHT_CLASS,
            )}
          >
            {deliveries.map((delivery) => (
              <li
                key={delivery.id}
                style={upcomingDeliveryStyle(delivery)}
                className="pl-(--upcoming-offset)"
              >
                <Link
                  href={projectPath(delivery.id)}
                  title={delivery.name}
                  className="focus-visible:ring-ring flex h-6.5 items-center justify-between gap-1.5 rounded-sm bg-(--project-color) px-2 text-xs font-medium text-white transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <span className="min-w-0 truncate">{delivery.name}</span>
                  <time
                    dateTime={delivery.date}
                    className="text-2xs shrink-0 font-normal tabular-nums opacity-85"
                  >
                    {formatDayMonth(delivery.date)}
                  </time>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
