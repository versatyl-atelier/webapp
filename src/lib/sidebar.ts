import { cookies } from "next/headers";

export async function isOpen() {
  const cookieStore = await cookies();
  return cookieStore.get("sidebar_state")?.value === "true";
}
