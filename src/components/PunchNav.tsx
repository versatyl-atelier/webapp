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
import type { Tool } from "@/constants/tools";
import { activeSectionHref } from "@/lib/paths";

type PunchNavProps = {
  tools: Tool[];
};

export function PunchNav({ tools }: PunchNavProps) {
  const activeHref = activeSectionHref(tools, usePathname());

  return (
    <SidebarGroup className="shrink-0">
      <SidebarGroupContent>
        <SidebarMenu>
          {tools.map(({ href, icon, title }) => (
            <SidebarMenuItem key={href}>
              <SidebarMenuButton
                render={<Link href={href} />}
                isActive={href === activeHref}
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
