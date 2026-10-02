import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

type HomeCardLinkProps = {
  href: string;
  children: ReactNode;
};

export function HomeCardLink({ href, children }: HomeCardLinkProps) {
  return (
    <Link
      href={href}
      className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1 rounded-sm text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      {children}
      <ArrowRight aria-hidden className="size-3" />
    </Link>
  );
}
