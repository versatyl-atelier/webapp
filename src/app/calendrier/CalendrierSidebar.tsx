import Link from "next/link";
import { Plus } from "lucide-react";

import { CalendarSearch } from "@/components/CalendarSearch";
import { ToolSidebar } from "@/components/ToolSidebar";
import { Button } from "@/components/ui/button";
import { SidebarContent, SidebarFooter } from "@/components/ui/sidebar";
import {
  CALENDAR_PATH,
  CALENDAR_TITLE,
  NEW_EVENT_LABEL,
} from "@/constants/calendar";
import { Role } from "@/generated/prisma/enums";
import { newCalendarEventPath } from "@/lib/calendar";
import { hasRole } from "@/lib/permissions";
import { getSession } from "@/lib/session";

export async function CalendrierSidebar() {
  const session = await getSession();
  const canEdit = session !== null && hasRole(session.role, Role.manager);

  return (
    <ToolSidebar glyph="🗓" title={CALENDAR_TITLE} href={CALENDAR_PATH}>
      <SidebarContent>
        <CalendarSearch />
      </SidebarContent>
      {canEdit && (
        <SidebarFooter>
          <Button asChild>
            <Link href={newCalendarEventPath()}>
              <Plus />
              {NEW_EVENT_LABEL}
            </Link>
          </Button>
        </SidebarFooter>
      )}
    </ToolSidebar>
  );
}
