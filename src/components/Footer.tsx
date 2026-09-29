import pkg from "@/../package.json";

export function Footer() {
  return (
    <footer className="text-muted-foreground mt-auto w-full shrink-0 pt-4 pb-2 text-center text-[10px]">
      Version {pkg.version} - Atelier Versatyl © 2025
    </footer>
  );
}
