import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

import { EmployeeSelect } from "@/components/EmployeeSelect";

import { getEmployees } from "@/actions/employees";
import { pinEmployeeFirst } from "@/lib/employees";
import { Role } from "@/generated/prisma/enums";
import { requireActiveSession } from "@/lib/session";
import { isOpen } from "@/lib/sidebar";
import { PunchSidebar } from "./PunchSidebar";
import { VersatylSidebarTrigger } from "@/components/VersatylSidebarTrigger";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await requireActiveSession("/punch");
  const employees = await getEmployees();
  const isSidebarOpen = await isOpen();
  return (
    <SidebarProvider defaultOpen={isSidebarOpen}>
      <PunchSidebar />
      <SidebarInset>
        <div className="bg-punch-light flex min-h-screen w-full min-w-md flex-col">
          <VersatylSidebarTrigger />
          <main className="">
            <EmployeeSelect
              employees={pinEmployeeFirst(employees || [], session.employeeId)}
              currentEmployeeId={session.employeeId}
              canAccessAll={session.role === Role.manager}
              className="w-md pl-8"
            />
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
