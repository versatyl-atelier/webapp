import Link from "next/link";
import { PropsWithChildren } from "react";

import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

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
      className="border-r-muted mt-10 h-[calc(100svh-40px)]"
    >
      <SidebarHeader className="px-0 py-2">
        <SidebarMenu>
          <SidebarMenuItem className="text-punch-dark inline-block h-full py-2 pl-10">
            <SidebarMenuAction
              asChild
              className="text-muted-foreground top-0 right-auto left-0 size-10 text-base"
            >
              <Link href="/">←</Link>
            </SidebarMenuAction>
            <Link href={href} className="text-sm font-bold">
              {title}
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <Separator />
      {children}
    </Sidebar>
  );
}
