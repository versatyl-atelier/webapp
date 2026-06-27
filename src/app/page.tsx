import { Role } from "@/generated/prisma/enums";
import Link from "next/link";

export default async function Home() {
  return (
    <main>
      <h1>Accueuil: à venir</h1>
      <ul>
        <li>
          <Link href="punch">Punch</Link>
        </li>
        <li>
          <Link href="guide-pointage">Guide de Pointage</Link>
        </li>

        <li>
          <Link href={`login?role=${Role.employee}`}>Login employé</Link>
        </li>
        <li>
          <Link href={`logout?role=${Role.employee}`}>Logout employé</Link>
        </li>
        <li></li>
        <li>
          <Link href={`login?role=${Role.manager}`}>Login gestionnaire</Link>
        </li>
        <li>
          <Link href={`logout?role=${Role.manager}`}>Logout gestionnaire</Link>
        </li>
      </ul>
    </main>
  );
}
