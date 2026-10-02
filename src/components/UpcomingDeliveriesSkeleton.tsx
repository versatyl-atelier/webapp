import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LANCEUR_LINK_LABEL,
  SKELETON_ROWS,
  UPCOMING_DELIVERIES_LIST_HEIGHT_CLASS,
} from "@/constants/home";
import { HomeCardLink } from "@/components/HomeCardLink";
import { LANCEUR_PATH } from "@/constants/tools";
import { cn } from "@/lib/utils";

const ROWS = Array.from({ length: SKELETON_ROWS }, (_, row) => row);

export function UpcomingDeliveriesSkeleton() {
  return (
    <Card size="sm" aria-busy className="gap-0 py-0">
      <CardHeader className="bg-muted/50 border-b py-2.5">
        <CardTitle className="font-semibold">Projet à venir</CardTitle>
        <CardAction>
          <HomeCardLink href={LANCEUR_PATH}>{LANCEUR_LINK_LABEL}</HomeCardLink>
        </CardAction>
      </CardHeader>
      <CardContent className="py-3">
        <div
          className={cn(
            "flex flex-col gap-1",
            UPCOMING_DELIVERIES_LIST_HEIGHT_CLASS,
          )}
        >
          {ROWS.map((row) => (
            <Skeleton key={row} className="h-6.5 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
