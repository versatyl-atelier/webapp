import { CreateUserForm } from "@/components/CreateUserForm";
import { UserList } from "@/components/UserList";

import { getEmployeesWithoutAccount } from "@/actions/employees";
import { getUsers } from "@/actions/users";

export default async function Page() {
  const employees = await getEmployeesWithoutAccount();
  const users = await getUsers();
  return (
    <div className="flex flex-col gap-4 px-8">
      <h1 className="ml-2 text-2xl">Admin</h1>
      <h2 className="text-xl font-bold">Créer un compte</h2>
      <CreateUserForm
        employees={employees || []}
        className="bg-background flex max-w-prose flex-col gap-4 rounded border-2 p-2"
      />
      <h2 className="text-xl font-bold">Comptes existants</h2>
      <UserList
        users={users}
        className="bg-background mb-4 w-full max-w-prose rounded border-2"
      />
    </div>
  );
}
