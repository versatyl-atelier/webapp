import { Role } from "@/generated/prisma/enums";
import { requireActiveSession } from "@/lib/session";

export default async function Page() {
  const session = await requireActiveSession("/projets");

  return (
    <div className="p-4">
      <p>
        {session.role === Role.manager ? "Tous les projets" : "Vos projets"}
      </p>
    </div>
  );
}
