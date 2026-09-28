import Link from "next/link";
import { LoginButton } from "@/components/Login";
import { LogoutForm } from "@/components/Logout";
import { getSession } from "@/lib/session";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

export async function Header() {
  const session = await getSession();
  return (
    <header className="bg-background fixed z-30 flex w-full justify-between px-4 py-2 shadow-sm">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="bg-primary text-primary-foreground rounded-sm p-1"
        >
          <svg viewBox="0 0 12 12" className="size-5" fill="currentColor">
            <rect x="1" y="1" width="4" height="4" rx="1" />
            <rect x="7" y="1" width="4" height="4" rx="1" />
            <rect x="1" y="7" width="4" height="4" rx="1" />
            <rect x="7" y="7" width="4" height="4" rx="1" />
          </svg>
        </Link>
        <h1 className="inline-block font-bold">
          <Link href="/">Versatyl</Link>
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
