import { Fragment, type ReactNode } from "react";
import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { CollapsedCrumbs } from "@/components/CollapsedCrumbs";
import { resolveCrumbs } from "@/lib/breadcrumbs";
import { CRUMB_ROUTES } from "@/lib/breadcrumb-routes";

const ITEM_CLASS = "min-w-0";
const COLLAPSIBLE_ITEM_CLASS = "hidden @3xl/toolbar:inline-flex min-w-0";
const COLLAPSIBLE_SEPARATOR_CLASS = "hidden @3xl/toolbar:block";

type AppBreadcrumbProps = {
  segments: string[];
  children?: ReactNode;
};

export async function AppBreadcrumb({
  segments,
  children,
}: AppBreadcrumbProps) {
  const crumbs = await resolveCrumbs(CRUMB_ROUTES, segments);
  if (crumbs.length === 0) {
    return null;
  }
  const lastIndex = children ? crumbs.length : crumbs.length - 1;
  const collapsedCrumbs = crumbs.slice(0, -1);

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="text-foreground flex-nowrap">
        {collapsedCrumbs.length > 0 && (
          <>
            <CollapsedCrumbs crumbs={collapsedCrumbs} />
            <BreadcrumbSeparator className="@3xl/toolbar:hidden" />
          </>
        )}
        {crumbs.map(({ href, label }, index) => {
          const collapsible = index < crumbs.length - 1;
          return (
            <Fragment key={href}>
              {index !== 0 && (
                <BreadcrumbSeparator className={COLLAPSIBLE_SEPARATOR_CLASS} />
              )}
              <BreadcrumbItem
                className={collapsible ? COLLAPSIBLE_ITEM_CLASS : ITEM_CLASS}
              >
                {index === lastIndex ? (
                  <BreadcrumbPage className="truncate font-bold" title={label}>
                    {label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild className="truncate">
                    <Link href={href} title={label}>
                      {label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
        {children && (
          <>
            <BreadcrumbSeparator />
            {children}
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
