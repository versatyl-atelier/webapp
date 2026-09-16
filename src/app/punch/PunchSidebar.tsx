import Link from "next/link";

import { Wrench } from "lucide-react";

import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

import { ToolSidebar } from "@/components/ToolSidebar";

export function PunchSidebar() {
  return (
    <ToolSidebar title="Punch" href="/punch">
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Wrench className="" />
              <Link href="/punch/gestionnaire">Interface Gestionnaire</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </ToolSidebar>
  );
}
