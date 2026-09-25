import Link from "next/link";

import { Wrench } from "lucide-react";

import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import Clock from "@/components/Clock";
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
                <Wrench />
                <Link href="/punch/gestionnaire">Interface Gestionnaire</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <Clock className="self-center" />
      </SidebarFooter>
    </ToolSidebar>
  );
}
