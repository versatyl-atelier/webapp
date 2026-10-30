import { Archive, KeyRound } from "lucide-react";

import { archiveEmployee } from "@/actions/accounts";
import { DisabledAction } from "@/components/ActionTooltip";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { CreateAccountDialog } from "@/components/CreateAccountDialog";
import { EditPersonDialog } from "@/components/EditPersonDialog";
import { ResetPasswordDialog } from "@/components/ResetPasswordDialog";
import { Badge } from "@/components/ui/badge";
import {
  ACCESS_ACTIVE_LABEL,
  ACCESS_COLUMN_LABEL,
  ACCESS_NONE_LABEL,
  ACCESS_PENDING_LABEL,
  ACCOUNTS_SECTION_TITLE,
  ACTIONS_COLUMN_LABEL,
  ARCHIVE_DESCRIPTION,
  ARCHIVE_LABEL,
  ARCHIVE_NO_EMPLOYEE_REASON,
  ARCHIVE_SELF_REASON,
  EMAIL_COLUMN_LABEL,
  NAME_COLUMN_LABEL,
  NO_PEOPLE_LABEL,
  NO_VALUE_LABEL,
  RESET_PASSWORD_LABEL,
  RESET_PASSWORD_SELF_REASON,
  ROLE_COLUMN_LABEL,
  STATUT_COLUMN_LABEL,
} from "@/constants/accounts";
import { ROLE_LABELS } from "@/constants/auth";
import type { AccountAccess, Person } from "@/lib/accounts";

type PeopleTableProps = {
  people: Person[];
  statuts: { id: string; description: string }[];
  employeesWithoutAccount: { id: number; name: string }[];
  currentUserId: string;
};

const ACCESS_LABELS: Record<AccountAccess, string> = {
  none: ACCESS_NONE_LABEL,
  pending: ACCESS_PENDING_LABEL,
  active: ACCESS_ACTIVE_LABEL,
};

const ACCESS_VARIANTS = {
  none: "outline",
  pending: "secondary",
  active: "default",
} as const satisfies Record<AccountAccess, string>;

const HEADER_CELL_CLASS = "px-2 py-1 text-xs font-semibold uppercase";
const CELL_CLASS = "px-2 py-1";

export function PeopleTable({
  people,
  statuts,
  employeesWithoutAccount,
  currentUserId,
}: PeopleTableProps) {
  return (
    <section className="bg-card rounded-lg border-2 p-2">
      <h2 className="border-primary mb-2 border-b-2 pb-1 text-center text-xs font-bold">
        {ACCOUNTS_SECTION_TITLE}
      </h2>
      {people.length === 0 ? (
        <p className="text-muted-foreground text-sm">{NO_PEOPLE_LABEL}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{ACCOUNTS_SECTION_TITLE}</caption>
            <thead>
              <tr>
                <th scope="col" className={HEADER_CELL_CLASS}>
                  {NAME_COLUMN_LABEL}
                </th>
                <th scope="col" className={HEADER_CELL_CLASS}>
                  {EMAIL_COLUMN_LABEL}
                </th>
                <th scope="col" className={HEADER_CELL_CLASS}>
                  {ROLE_COLUMN_LABEL}
                </th>
                <th scope="col" className={HEADER_CELL_CLASS}>
                  {STATUT_COLUMN_LABEL}
                </th>
                <th scope="col" className={HEADER_CELL_CLASS}>
                  {ACCESS_COLUMN_LABEL}
                </th>
                <th scope="col" className={HEADER_CELL_CLASS}>
                  <span className="sr-only">{ACTIONS_COLUMN_LABEL}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {people.map((person) => {
                const isCurrentUser = person.userId === currentUserId;
                return (
                  <tr key={person.key} className="border-t">
                    <th scope="row" className={`${CELL_CLASS} font-medium`}>
                      {person.name}
                    </th>
                    <td className={CELL_CLASS}>
                      {person.email ?? NO_VALUE_LABEL}
                    </td>
                    <td className={CELL_CLASS}>
                      {person.role ? ROLE_LABELS[person.role] : NO_VALUE_LABEL}
                    </td>
                    <td className={CELL_CLASS}>
                      {person.statutLabel ?? NO_VALUE_LABEL}
                    </td>
                    <td className={CELL_CLASS}>
                      <Badge variant={ACCESS_VARIANTS[person.access]}>
                        {ACCESS_LABELS[person.access]}
                      </Badge>
                    </td>
                    <td className={CELL_CLASS}>
                      <div className="flex items-center justify-end gap-1">
                        <EditPersonDialog
                          person={person}
                          statuts={statuts}
                          isCurrentUser={isCurrentUser}
                        />
                        {person.employeeId !== null && !person.userId ? (
                          <CreateAccountDialog
                            employee={{
                              id: person.employeeId,
                              name: person.name,
                            }}
                          />
                        ) : person.userId && !isCurrentUser ? (
                          <ResetPasswordDialog
                            userId={person.userId}
                            name={person.name}
                          />
                        ) : (
                          <DisabledAction
                            label={`${RESET_PASSWORD_LABEL} ${person.name}`}
                            reason={RESET_PASSWORD_SELF_REASON}
                            icon={<KeyRound />}
                            tone="reset"
                          />
                        )}
                        {person.employeeId !== null && !isCurrentUser ? (
                          <ConfirmDeleteButton
                            action={archiveEmployee}
                            fields={{ employeeId: String(person.employeeId) }}
                            title={`${ARCHIVE_LABEL} « ${person.name} » ?`}
                            description={ARCHIVE_DESCRIPTION}
                            label={`${ARCHIVE_LABEL} ${person.name}`}
                            confirmLabel={ARCHIVE_LABEL}
                            icon={<Archive />}
                          />
                        ) : (
                          <DisabledAction
                            label={`${ARCHIVE_LABEL} ${person.name}`}
                            reason={
                              isCurrentUser
                                ? ARCHIVE_SELF_REASON
                                : ARCHIVE_NO_EMPLOYEE_REASON
                            }
                            icon={<Archive />}
                            tone="destructive"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-2 border-t-2 pt-2">
        <CreateAccountDialog employees={employeesWithoutAccount} />
      </div>
    </section>
  );
}
