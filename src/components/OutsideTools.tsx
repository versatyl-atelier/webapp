"use client";

import { PropsWithChildren } from "react";
import { usePathname } from "next/navigation";

import { isToolPath } from "@/lib/paths";

export function OutsideTools({ children }: PropsWithChildren) {
  const pathname = usePathname();
  return isToolPath(pathname) ? null : children;
}
