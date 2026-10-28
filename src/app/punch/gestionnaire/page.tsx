import { notFound } from "next/navigation";

import { getPeople, getStatuts } from "@/actions/accounts";
import { getEmployeesWithoutAccount } from "@/actions/employees";
import { PeopleTable } from "@/components/PeopleTable";
import { PUNCH_MANAGER_PATH } from "@/constants/punch";
import { Role } from "@/generated/prisma/enums";
import { requireActiveSession } from "@/lib/session";

export default async function Page() {
  const session = await requireActiveSession(PUNCH_MANAGER_PATH);
  if (session.role !== Role.manager) {
    notFound();
  }
  const [people, statuts, employeesWithoutAccount] = await Promise.all([
    getPeople(),
    getStatuts(),
    getEmployeesWithoutAccount(),
  ]);

  return (
    <div className="p-4">
      <PeopleTable
        people={people}
        statuts={statuts}
        employeesWithoutAccount={employeesWithoutAccount}
        currentUserId={session.userId}
      />
    </div>
  );
}
