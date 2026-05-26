import Image from "next/image";
import Link from "next/link";
import pkg from "@/../package.json";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-(--punch-light) p-5">
        <div className="w-full max-w-md text-center">
          {/* Logo Section */}
          <header className="mb-10">
            <div className="mb-5 flex justify-center">
              <Image
                src="/logo.png"
                alt="Atelier Versatyl"
                width={80}
                height={80}
                className="rounded-lg bg-white p-1 shadow-lg"
              />
            </div>
            <h1 className="mb-2.5 font-bold text-(--punch-dark) text-4xl">
              Atelier Versatyl
            </h1>
            <p className="text-(--punch-dark) text-base">
              Système de gestion du temps
            </p>
          </header>

          {/* Main Content Block */}
          <main className="flex min-h-87.5 animate-fade-in-up flex-col items-center justify-center rounded-2xl border-(--punch-dark) border-[3px] bg-white p-10 shadow-[0_15px_40px_rgba(0,0,0,0.2)] transition-all duration-300 hover:border-(--punch-accent) hover:shadow-[0_20px_50px_rgba(216,80,36,0.3)]">
            <h2 className="mb-8 font-semibold text-(--punch-dark) text-2xl">
              Accès au Système
            </h2>

            <div className="w-full space-y-5">
              {/* Employee Button */}
              <Button
                asChild
                size="lg"
                className={
                  "h-auto w-full border-0 bg-(--punch-accent) py-4 font-semibold text-base text-white uppercase tracking-wide shadow-[0_4px_15px_rgba(216,80,36,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(216,80,36,0.6)] [a]:hover:bg-(--punch-accent-hover)"
                }
              >
                <Link href="/punch">👤 Interface Employé</Link>
              </Button>

              {/* Calendar Button */}
              <Button
                asChild
                size="lg"
                className="h-auto w-full border-0 bg-(--punch-accent) py-4 font-semibold text-base text-white uppercase tracking-wide shadow-[0_4px_15px_rgba(216,80,36,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(216,80,36,0.6)] [a]:hover:bg-(--punch-accent-hover)"
              >
                <Link href="/punch/calendrier">📅 Calendrier</Link>
              </Button>

              {/* Manager Button */}
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-auto w-full border-(--punch-dark) border-2 py-4 font-semibold text-(--punch-dark) text-base uppercase tracking-wide shadow-[0_4px_15px_rgba(216,80,36,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-(--punch-dark) hover:text-white"
              >
                <Link href="/punch/gestionnaire">
                  🔧 Interface Gestionnaire
                </Link>
              </Button>
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="fixed right-5 bottom-5 text-(--punch-dark) text-xs">
        V{pkg.version}
      </footer>
    </>
  );
}
