import Link from "next/link";
import { PropsWithChildren } from "react";

import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

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
      className="border-r-muted mt-12 h-[calc(100svh-12*var(--spacing))]"
    >
      <SidebarHeader className="border-b-muted h-toolbar justify-center border-b">
        <SidebarMenu>
          <SidebarMenuItem className="text-muted-foreground relative">
            <Link
              href="/"
              title="Accueuil"
              className="hover:text-primary absolute inset-y-0 flex items-center px-4 text-base"
            >
              ←
            </Link>
            <Link
              href={href}
              title={title}
              className="hover:text-primary inline-block w-full text-center text-sm font-bold"
            >
              <span className="mr-2">{glyph}</span>
              {title}
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      {children}
    </Sidebar>
  );
}
