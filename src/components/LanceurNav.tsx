"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LANCEUR_NAV_ITEMS } from "@/constants/lanceur";

export function LanceurNav() {
  const pathname = usePathname();

  return (
    <SidebarGroup className="shrink-0">
      <SidebarGroupContent>
        <SidebarMenu>
          {LANCEUR_NAV_ITEMS.map(({ href, icon, title }) => (
            <SidebarMenuItem key={href}>
              <SidebarMenuButton
                render={<Link href={href} />}
                isActive={href === pathname}
              >
                <span aria-hidden>{icon}</span>
                <span>{title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
