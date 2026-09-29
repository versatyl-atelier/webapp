import Link from "next/link";
import { LoginButton } from "@/components/Login";
import { LogoutForm } from "@/components/Logout";
import { getSession } from "@/lib/session";
import { APP_NAME, HOME_PATH } from "@/constants/tools";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

export async function Header() {
  const session = await getSession();
  return (
    <header className="bg-background sticky top-0 z-30 flex h-12 w-full justify-between px-4 shadow-sm">
      <div className="flex items-center gap-3">
        <h1 className="inline-block font-bold">
          <Link href={HOME_PATH}>{APP_NAME}</Link>
        </h1>
        <InputGroup>
          <InputGroupInput placeholder="Rechercher" />
          <InputGroupAddon align="inline-end">Ctrl K</InputGroupAddon>
        </InputGroup>
      </div>
      <div className="my-auto flex items-center gap-2">
        {session ? <LogoutForm name={session.name} /> : <LoginButton />}
      </div>
    </header>
  );
}
