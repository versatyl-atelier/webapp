import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SKELETON_ROWS } from "@/constants/home";

const ROWS = Array.from({ length: SKELETON_ROWS }, (_, row) => row);

type HomeWidgetSkeletonProps = {
  className?: string;
};

export function HomeWidgetSkeleton({ className }: HomeWidgetSkeletonProps) {
  return (
    <Card size="sm" aria-busy className={className}>
      <CardHeader>
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {ROWS.map((row) => (
          <Skeleton key={row} className="h-6.5 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}
