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
import { TOOLS, HOME_LABEL, HOME_PATH } from "@/constants/tools";
import { isWithinPath } from "@/lib/paths";

export function AppSidebar() {
  const pathname = usePathname();
  return (
    <Sidebar
      collapsible="none"
      className="border-r-muted sticky top-0 z-20 h-svh w-(--sidebar-width-icon) shrink-0 border-r"
    >
      <SidebarHeader className="h-12 justify-center">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={{ children: HOME_LABEL, hidden: false }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground justify-center p-1 [&_svg]:size-5"
            >
              <Link href={HOME_PATH}>
                <svg viewBox="0 0 12 12" fill="currentColor" aria-hidden>
                  <rect x="1" y="1" width="4" height="4" rx="1" />
                  <rect x="7" y="1" width="4" height="4" rx="1" />
                  <rect x="1" y="7" width="4" height="4" rx="1" />
                  <rect x="7" y="7" width="4" height="4" rx="1" />
                </svg>
                <span className="sr-only">{HOME_LABEL}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {TOOLS.map(({ href, icon, title }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isWithinPath(pathname, href)}
                    tooltip={{ children: title, hidden: false }}
                    className="justify-center p-3 text-xl"
                  >
                    <Link href={href}>
                      <span aria-hidden>{icon}</span>
                      <span className="sr-only">{title}</span>
                    </Link>
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
