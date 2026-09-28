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
import { resolveCrumbs } from "@/lib/breadcrumbs";
import { CRUMB_ROUTES } from "@/lib/breadcrumb-routes";

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

  return (
    <Breadcrumb>
      <BreadcrumbList className="text-foreground">
        {crumbs.map(({ href, label }, index) => (
          <Fragment key={href}>
            {index !== 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {index === lastIndex ? (
                <BreadcrumbPage className="font-bold">{label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={href}>{label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
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
