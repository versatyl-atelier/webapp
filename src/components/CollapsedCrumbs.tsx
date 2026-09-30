"use client";

import Link from "next/link";

import { BreadcrumbEllipsis, BreadcrumbItem } from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { COLLAPSED_CRUMBS_LABEL } from "@/constants/breadcrumbs";
import type { Crumb } from "@/lib/breadcrumbs";

type CollapsedCrumbsProps = {
  crumbs: Crumb[];
};

export function CollapsedCrumbs({ crumbs }: CollapsedCrumbsProps) {
  return (
    <BreadcrumbItem className="@3xl/toolbar:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={COLLAPSED_CRUMBS_LABEL}
          className="hover:text-foreground focus-visible:ring-ring/50 rounded-sm outline-none focus-visible:ring-3"
        >
          <BreadcrumbEllipsis />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {crumbs.map(({ href, label }) => (
            <DropdownMenuItem key={href} asChild>
              <Link href={href}>{label}</Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </BreadcrumbItem>
  );
}
