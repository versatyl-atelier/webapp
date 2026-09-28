import { redirect } from "next/navigation";

import { CALENDAR_PATH } from "@/constants/calendar";

export default function Page() {
  redirect(CALENDAR_PATH);
}
