import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function FormActionBar({
  className,
  ...props
}: ComponentProps<"footer">) {
  return (
    <footer
      className={cn(
        "bg-background sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-2.5 border-t py-3",
        className,
      )}
      {...props}
    />
  );
}
