import { requireActiveSession } from "@/lib/session";

export default async function Page() {
  const session = await requireActiveSession("/projets");

  return <h1>Projets</h1>;
}
