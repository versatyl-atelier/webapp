"use client";

import { ToolNav } from "@/components/ToolNav";
import { LANCEUR_NAV_ITEMS } from "@/constants/lanceur";

export function LanceurNav() {
  return <ToolNav items={LANCEUR_NAV_ITEMS} />;
}
