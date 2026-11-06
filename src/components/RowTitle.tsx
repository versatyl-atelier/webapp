import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const ROW_TITLE_CLASS =
  "text-muted-foreground text-xs font-semibold tracking-wider uppercase";

export function RowTitle({ className, ...props }: ComponentProps<"h2">) {
  return <h2 className={cn(ROW_TITLE_CLASS, className)} {...props} />;
}
