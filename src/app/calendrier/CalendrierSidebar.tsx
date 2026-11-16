import Link from "next/link";
import { Plus } from "lucide-react";

import { CalendarSearch } from "@/components/CalendarSearch";
import { NewEventShortcut } from "@/components/NewEventShortcut";
import { ToolSidebar } from "@/components/ToolSidebar";
import { Button } from "@/components/ui/button";
import { SidebarContent, SidebarFooter } from "@/components/ui/sidebar";
import {
  CALENDAR_PATH,
  CALENDAR_TITLE,
  NEW_EVENT_LABEL,
  NEW_EVENT_SHORTCUT_HINT,
} from "@/constants/calendar";
import { ENTER_KEY } from "@/constants/keys";
import { Role } from "@/generated/prisma/enums";
import { newCalendarEventPath } from "@/lib/calendar";
import { hasRole } from "@/lib/permissions";
import { getSession } from "@/lib/session";

export async function CalendrierSidebar() {
  const session = await getSession();
  const canEdit = session !== null && hasRole(session.role, Role.manager);

  return (
    <ToolSidebar glyph="📅" title={CALENDAR_TITLE} href={CALENDAR_PATH}>
      <SidebarContent>
        <CalendarSearch />
      </SidebarContent>
      {canEdit && (
        <SidebarFooter>
          <Button
            render={
              <Link
                href={newCalendarEventPath()}
                aria-keyshortcuts={ENTER_KEY}
              />
            }
            nativeButton={false}
          >
            <Plus />
            {NEW_EVENT_LABEL}
            <kbd
              aria-hidden
              className="bg-primary-foreground/15 ml-auto rounded-sm px-1.5 font-sans text-xs font-normal"
            >
              {NEW_EVENT_SHORTCUT_HINT}
            </kbd>
          </Button>
          <NewEventShortcut />
        </SidebarFooter>
      )}
    </ToolSidebar>
  );
}
