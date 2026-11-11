import Link from "next/link";
import { PropsWithChildren } from "react";

import { ActionTooltip } from "@/components/ActionTooltip";
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { HOME_LABEL } from "@/constants/tools";

type ToolSidebarProps = {
  glyph: string;
  title: string;
  href: string;
};

export function ToolSidebar({
  glyph,
  title,
  href,
  children,
}: PropsWithChildren<ToolSidebarProps>) {
  return (
    <Sidebar
      variant="sidebar"
      className="border-r-muted shadow-background mt-12 h-[calc(100svh-12*var(--spacing))] shadow-md data-[side=left]:left-(--sidebar-width-icon)"
    >
      <SidebarHeader className="border-b-muted h-toolbar justify-center border-b">
        <SidebarMenu>
          <SidebarMenuItem className="text-muted-foreground relative">
            <ActionTooltip
              label={HOME_LABEL}
              render={
                <Link
                  href="/"
                  aria-label={HOME_LABEL}
                  className="hover:text-primary absolute inset-y-0 flex items-center px-4 text-base"
                />
              }
            >
              ←
            </ActionTooltip>
            <ActionTooltip
              label={title}
              render={
                <Link
                  href={href}
                  className="hover:text-primary inline-block w-full text-center text-sm font-bold"
                />
              }
            >
              <span className="mr-2">{glyph}</span>
              {title}
            </ActionTooltip>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      {children}
    </Sidebar>
  );
}
