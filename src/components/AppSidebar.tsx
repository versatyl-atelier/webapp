"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/Logo";
import { HOME_LABEL, HOME_PATH } from "@/constants/tools";
import type { Role } from "@/generated/prisma/enums";
import { activeToolHref } from "@/lib/paths";
import { toolsForRole } from "@/lib/tools";

type AppSidebarProps = {
  role: Role | null;
};

export function AppSidebar({ role }: AppSidebarProps) {
  const pathname = usePathname();
  const activeHref = activeToolHref(pathname);
  return (
    <Sidebar
      collapsible="none"
      className="border-r-muted z-20 h-full w-(--sidebar-width-icon) shrink-0 border-r print:hidden"
    >
      <SidebarHeader className="h-12 justify-center">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href={HOME_PATH} />}
              tooltip={{ children: HOME_LABEL, hidden: false }}
              className="group border-input justify-center rounded-lg border p-1 [&_svg]:size-6"
            >
              <Logo />
              <span className="sr-only">{HOME_LABEL}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {toolsForRole(role).map(({ href, icon, title }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    render={<Link href={href} />}
                    isActive={href === activeHref}
                    tooltip={{ children: title, hidden: false }}
                    className="justify-center p-3 text-xl"
                  >
                    <span aria-hidden>{icon}</span>
                    <span className="sr-only">{title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
