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

export type ToolNavItem = {
  href: string;
  icon: string;
  title: string;
};

type ToolNavProps = {
  items: readonly ToolNavItem[];
};

export function ToolNav({ items }: ToolNavProps) {
  const pathname = usePathname();

  return (
    <SidebarGroup className="shrink-0">
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map(({ href, icon, title }) => (
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
