import { NO_EMPLOYEE_LABEL, ROLE_LABELS } from "@/constants/auth";
import { Role } from "@/generated/prisma/enums";

type UserListProps = {
  users: {
    id: string;
    name: string;
    email: string;
    role: string | null;
    employee: { name: string } | null;
  }[];
  className?: string;
};

const isRole = (role: string | null): role is Role =>
  Object.values<string | null>(Role).includes(role);

export function UserList({ users, className }: UserListProps) {
  return (
    <table className={className}>
      <caption className="sr-only">Comptes utilisateurs</caption>
      <thead>
        <tr className="text-left">
          <th scope="col" className="p-2">
            Nom
          </th>
          <th scope="col" className="p-2">
            Courriel
          </th>
          <th scope="col" className="p-2">
            Rôle
          </th>
          <th scope="col" className="p-2">
            Employé
          </th>
        </tr>
      </thead>
      <tbody>
        {users.map(({ id, name, email, role, employee }) => (
          <tr key={id} className="border-t">
            <td className="p-2">{name}</td>
            <td className="p-2">{email}</td>
            <td className="p-2">{isRole(role) ? ROLE_LABELS[role] : role}</td>
            <td className="p-2">{employee?.name ?? NO_EMPLOYEE_LABEL}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
