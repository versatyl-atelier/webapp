import { VersionTag } from "@/components/VersionTag";
import { getVersionInfo } from "@/lib/version";

export function Footer() {
  const { version, commitSha } = getVersionInfo(process.env);

  return (
    <footer className="text-muted-foreground mt-auto w-full shrink-0 pt-4 pb-2 text-center text-[10px] print:hidden">
      <VersionTag version={version} commitSha={commitSha} /> - Atelier Versatyl
      © 2025
    </footer>
  );
}
