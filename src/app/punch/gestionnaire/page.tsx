import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

import { CreateUserForm } from "@/components/CreateUserForm";
import { VersatylSidebarTrigger } from "@/components/VersatylSidebarTrigger";

import { getEmployeesWithoutAccount } from "@/actions/employees";
import { isOpen } from "@/lib/sidebar";
import { PunchSidebar } from "../PunchSidebar";

export default async function Page() {
  const employees = await getEmployeesWithoutAccount();
  const isSidebarOpen = await isOpen();
  return (
    <SidebarProvider defaultOpen={isSidebarOpen}>
      <PunchSidebar />
      <SidebarInset>
        <div className="bg-punch-light flex min-h-screen w-full min-w-md flex-col">
          <VersatylSidebarTrigger />
          <main className="flex flex-col gap-4 px-8">
            <h1 className="ml-2 text-2xl">Admin</h1>
            <h2 className="text-xl font-bold">Créer un compte</h2>
            <CreateUserForm
              employees={employees || []}
              className="bg-background flex max-w-prose flex-col gap-4 rounded border-2 border-black p-2"
            />
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
