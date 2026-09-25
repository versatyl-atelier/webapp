import Link from "next/link";
import { PropsWithChildren } from "react";

import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type ToolSidebarProps = {
  title: string;
  href: string;
};

export function ToolSidebar({
  title,
  href,
  children,
}: PropsWithChildren<ToolSidebarProps>) {
  return (
    <Sidebar
      variant="sidebar"
      className="border-r-muted mt-12 h-[calc(100svh-40px)]"
    >
      <SidebarHeader className="border-b-muted border-b">
        <SidebarMenu>
          <SidebarMenuItem className="text-punch-dark">
            <Link
              href="/"
              title="Accueuil"
              className="hover:text-punch-accent size-10 px-4 text-base"
            >
              ←
            </Link>
            <Link
              href={href}
              title={title}
              className="hover:text-punch-accent text-sm font-bold"
            >
              {title}
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      {children}
    </Sidebar>
  );
}
