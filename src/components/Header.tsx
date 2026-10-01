import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SearchShortcutHint } from "@/components/SearchShortcutHint";
import { SearchShortcut } from "@/components/SearchShortcut";
import { LoginButton } from "@/components/Login";
import { LogoutForm } from "@/components/Logout";
import { getSession } from "@/lib/session";
import { Search } from "lucide-react";
import {
  APP_NAME,
  HEADER_SEARCH_LABEL,
  HOME_PATH,
  SEARCH_PATH,
} from "@/constants/tools";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

export async function Header() {
  const session = await getSession();
  return (
    <header className="bg-background z-30 flex h-12 w-full shrink-0 justify-between px-4">
      <div className="flex items-center gap-3">
        <h1 className="inline-block font-bold">
          <Link href={HOME_PATH}>{APP_NAME}</Link>
        </h1>
        <Button asChild variant="ghost" size="icon" className="sm:hidden">
          <Link href={SEARCH_PATH} aria-label={HEADER_SEARCH_LABEL}>
            <Search />
          </Link>
        </Button>
        <Link
          href={SEARCH_PATH}
          aria-label={HEADER_SEARCH_LABEL}
          className="hidden sm:block"
        >
          <InputGroup>
            <InputGroupInput
              readOnly
              tabIndex={-1}
              placeholder={HEADER_SEARCH_LABEL}
              className="cursor-pointer"
            />
            <InputGroupAddon align="inline-end">
              <SearchShortcutHint />
            </InputGroupAddon>
          </InputGroup>
        </Link>
      </div>
      <SearchShortcut />
      <div className="my-auto flex items-center gap-2">
        {session ? <LogoutForm name={session.name} /> : <LoginButton />}
      </div>
    </header>
  );
}
