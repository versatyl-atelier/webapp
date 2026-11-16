import type { ReactNode } from "react";

import { HomeCardLink } from "@/components/HomeCardLink";
import { Card, CardHeader } from "@/components/ui/card";
import type { HomeWidgetId, HomeWidgetLink } from "@/constants/home";
import { cn } from "@/lib/utils";

type HomeWidgetCardProps = {
  widget: HomeWidgetId;
  title: ReactNode;
  link: HomeWidgetLink | null;
  toolbar?: ReactNode;
  busy?: boolean;
  className?: string;
  children: ReactNode;
};

export function HomeWidgetCard({
  widget,
  title,
  link,
  toolbar,
  busy,
  className,
  children,
}: HomeWidgetCardProps) {
  const headingId = `${widget}-heading`;

  return (
    <section aria-labelledby={headingId} aria-busy={busy} className="h-full">
      <Card size="sm" className={cn("h-full gap-0 py-0", className)}>
        <CardHeader className="bg-muted/50 flex flex-wrap items-center gap-x-3 gap-y-1 border-b py-2.5">
          <h2 id={headingId} className="text-sm font-semibold">
            {title}
          </h2>
          {toolbar}
          {link && (
            <span className="ml-auto">
              <HomeCardLink href={link.href}>{link.label}</HomeCardLink>
            </span>
          )}
        </CardHeader>
        {children}
      </Card>
    </section>
  );
}
