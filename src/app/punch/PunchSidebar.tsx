import Link from "next/link";

import { Wrench } from "lucide-react";

import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

import { ToolSidebar } from "@/components/ToolSidebar";
import { Role } from "@/generated/prisma/enums";
import { getSession } from "@/lib/session";

export async function PunchSidebar() {
  const session = await getSession();
  const isManager = session?.role === Role.manager;
  return (
    <ToolSidebar title="Punch" href="/punch">
      <SidebarContent>
        <SidebarMenu>
          {isManager && (
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Wrench className="" />
                <Link href="/punch/gestionnaire">Interface Gestionnaire</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>
    </ToolSidebar>
  );
}
