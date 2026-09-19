import { redirect } from "next/navigation";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

import { EmployeeSelect } from "@/components/EmployeeSelect";

import { getEmployees } from "@/actions/employees";
import { NO_EMPLOYEE_LINKED_MESSAGE } from "@/constants/auth";
import { Role } from "@/generated/prisma/enums";
import { requireActiveSession } from "@/lib/session";
import { isOpen } from "@/lib/sidebar";
import { PunchSidebar } from "./PunchSidebar";
import { VersatylSidebarTrigger } from "@/components/VersatylSidebarTrigger";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await requireActiveSession("/punch");
  if (session.role === Role.employee) {
    if (session.employeeId === null) {
      return (
        <main className="mt-2 flex flex-col items-center justify-center px-4">
          <p>{NO_EMPLOYEE_LINKED_MESSAGE}</p>
        </main>
      );
    }
    redirect(`/punch/employe/${session.employeeId}`);
  }
  const employees = await getEmployees();
  const isSidebarOpen = await isOpen();
  return (
    <SidebarProvider defaultOpen={isSidebarOpen}>
      <PunchSidebar />
      <SidebarInset>
        <div className="bg-punch-light flex min-h-screen w-full min-w-md flex-col">
          <VersatylSidebarTrigger />
          <main className="">
            <EmployeeSelect employees={employees || []} className="w-md pl-8" />
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
