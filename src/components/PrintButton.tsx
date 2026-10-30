"use client";

import { Button } from "@/components/ui/button";
import { PRINT_LABEL } from "@/constants/report";

export function PrintButton() {
  return (
    <Button
      type="button"
      size="sm"
      className="rounded-sm text-xs font-semibold uppercase print:hidden"
      onClick={() => window.print()}
    >
      {PRINT_LABEL}
    </Button>
  );
}
