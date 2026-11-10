import { notFound } from "next/navigation";

import { getTrelloConfig } from "@/actions/trello";
import { TrelloConfigForm } from "@/components/TrelloConfigForm";
import { TRELLO_PAGE_PATH } from "@/constants/trello";
import { Role } from "@/generated/prisma/enums";
import { requireActiveSession } from "@/lib/session";

export default async function Page() {
  const session = await requireActiveSession(TRELLO_PAGE_PATH);
  if (session.role !== Role.manager) {
    notFound();
  }
  const config = await getTrelloConfig();

  return (
    <div className="p-4">
      <TrelloConfigForm
        boards={config.boards}
        unavailable={config.unavailable}
        destinations={config.destinations}
        stageLists={config.stageLists}
        webhooks={config.webhooks}
      />
    </div>
  );
}
