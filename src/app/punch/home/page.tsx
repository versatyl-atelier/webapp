import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="bg-punch-light flex min-h-screen items-center justify-center p-5">
      <div className="w-full max-w-md text-center">
        {/* Logo Section */}
        <header className="mb-10">
          <div className="mb-5 flex justify-center">
            <Link href="/punch/home">
              <Image
                src="/logo.png"
                alt="Atelier Versatyl"
                width={80}
                height={80}
                className="rounded-lg bg-white p-1 shadow-lg"
              />
            </Link>
          </div>
          <h1 className="text-punch-dark mb-2.5 text-4xl font-bold">
            Atelier Versatyl
          </h1>
          <p>Système de gestion du temps</p>
        </header>

        {/* Main Content Block */}
        <main className="animate-fade-in-up border-punch-dark hover:border-punch-accent flex min-h-87.5 flex-col items-center justify-center rounded-2xl border-[3px] bg-white p-10 shadow-[0_15px_40px_rgba(0,0,0,0.2)] transition-all duration-300 hover:shadow-[0_20px_50px_rgba(216,80,36,0.3)]">
          <h2 className="mb-8 text-2xl font-semibold">Accès au Système</h2>

          <div className="w-full space-y-5">
            {/* Employee Button */}
            <Button
              asChild
              size="lg"
              className={
                "bg-punch-accent [a]:hover:bg-punch-accent-hover h-auto w-full border-0 py-4 text-base font-semibold tracking-wide text-white uppercase shadow-[0_4px_15px_rgba(216,80,36,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(216,80,36,0.6)]"
              }
            >
              <Link href="/punch">👤 Interface Employé</Link>
            </Button>

            {/* Calendar Button */}
            <Button
              asChild
              size="lg"
              className="bg-punch-accent [a]:hover:bg-punch-accent-hover h-auto w-full border-0 py-4 text-base font-semibold tracking-wide text-white uppercase shadow-[0_4px_15px_rgba(216,80,36,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(216,80,36,0.6)]"
            >
              <Link href="/punch/calendrier">📅 Calendrier</Link>
            </Button>

            {/* Manager Button */}
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-punch-dark text-punch-dark hover:bg-punch-dark h-auto w-full border-2 py-4 text-base font-semibold tracking-wide uppercase shadow-[0_4px_15px_rgba(216,80,36,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:text-white"
            >
              <Link href="/punch/gestionnaire">🔧 Interface Gestionnaire</Link>
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
