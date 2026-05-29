export default function Page() {
  return (
    <main className="mx-auto max-w-200 bg-white p-5 print:p-[15mm] print:text-[11pt]">
      {/* Header */}
      <header className="mb-0 rounded-t-md border-0 bg-black px-5 py-3.75 text-center text-white print:rounded-none">
        <h1 className="mb-1 font-bold text-2xl">🕐 Guide de Pointage Rapide</h1>
        <p className="text-sm opacity-90">
          Atelier Versatyl - Système de Gestion du Temps
        </p>
      </header>

      {/* Section 1: Pointage */}
      <section className="print:page-break-inside-avoid mb-4 border-black border-r-3 border-b-3 border-l-3 p-0">
        <div className="mb-3 flex items-center gap-2.5 bg-(--punch-accent) px-4 py-2 font-bold text-base text-white">
          <span>📍</span>
          <span>POINTAGE (Punch In / Punch Out)</span>
        </div>

        <ol className="space-y-3 px-5">
          <li className="relative mb-3 pl-11.25 text-sm before:absolute before:-top-0.5 before:left-0 before:flex before:h-8 before:w-8 before:items-center before:justify-center before:rounded-full before:bg-black before:font-bold before:text-base before:text-white before:content-['1']">
            <strong>Sélectionner votre nom</strong> dans le menu déroulant sur
            la page d'accueil
          </li>
          <li className="relative mb-3 pl-11.25 text-sm before:absolute before:-top-0.5 before:left-0 before:flex before:h-8 before:w-8 before:items-center before:justify-center before:rounded-full before:bg-black before:font-bold before:text-base before:text-white before:content-['2']">
            <strong>Choisir votre projet</strong> dans "Pointage Multiple"
            <div className="my-2.5 border-(--punch-accent) border-l-4 bg-(--punch-light) px-2.5 py-2.5 text-xs">
              → Commencez à taper le nom du projet
              <br />→ Sélectionnez dans la liste qui apparaît
              <br />→{" "}
              <strong className="text-(--punch-accent)">
                Vous pouvez sélectionner jusqu'à 3 projets simultanés
              </strong>
            </div>
          </li>
          <li className="relative mb-3 pl-11.25 text-sm before:absolute before:-top-0.5 before:left-0 before:flex before:h-8 before:w-8 before:items-center before:justify-center before:rounded-full before:bg-black before:font-bold before:text-base before:text-white before:content-['3']">
            <strong>Cliquer sur "Punch In"</strong> pour démarrer le chronomètre
          </li>
          <li className="relative mb-3 pl-11.25 text-sm before:absolute before:-top-0.5 before:left-0 before:flex before:h-8 before:w-8 before:items-center before:justify-center before:rounded-full before:bg-black before:font-bold before:text-base before:text-white before:content-['4']">
            <strong>Cliquer sur "Terminé"</strong> pour revenir à la page
            principale
          </li>
          <li className="relative mb-3 pl-11.25 text-sm before:absolute before:-top-0.5 before:left-0 before:flex before:h-8 before:w-8 before:items-center before:justify-center before:rounded-full before:bg-black before:font-bold before:text-base before:text-white before:content-['5']">
            <strong>Pour dépuncher:</strong> Sélectionnez votre nom à nouveau,
            puis cliquez sur "Punch Out"
            <div className="my-2.5 border-(--punch-accent) border-l-4 bg-(--punch-light) px-2.5 py-2.5 text-xs">
              ⏰ <strong className="text-(--punch-accent)">Important:</strong>{" "}
              Les punchs s'arrêtent automatiquement à 16h00
            </div>
          </li>
        </ol>

        <div className="mx-5 mt-2.5 mb-6 rounded-sm bg-(--punch-accent-hover) px-2.5 py-2.5 text-center font-bold text-white text-xs">
          ⚠️ N'OUBLIEZ PAS DE RÉVISER VOS HEURES AVANT DE GELER VOTRE SEMAINE!
        </div>
      </section>

      {/* Section 2: Principes */}
      <section className="print:page-break-inside-avoid mb-4 border-black border-r-4 border-b-4 border-l-4">
        <div className="mb-3 flex items-center gap-2.5 bg-(--punch-accent) px-4 py-2 font-bold text-base text-white">
          <span>📋</span>
          <span>PRINCIPES À RESPECTER</span>
        </div>

        <ul className="list-none space-y-2 px-5 py-4 text-xs">
          <li className="relative pl-6">
            <span className="absolute left-0 font-bold text-(--punch-accent)">
              ✓
            </span>
            <strong>Arrêter votre punch le midi</strong> - Utilisez "Punch Out"
            avant votre pause dîner
          </li>
          <li className="relative pl-6">
            <span className="absolute left-0 font-bold text-(--punch-accent)">
              ✓
            </span>
            <strong>Ajouter 0.5h de dîner</strong> - Dans "Ajout Manuel",
            cliquez sur le bouton 🍽️ "Ajouter Dîner (0.5h)"
          </li>
          <li className="relative pl-6">
            <span className="absolute left-0 font-bold text-(--punch-accent)">
              ✓
            </span>
            <strong>Ajuster vos heures au besoin</strong> - Cliquez sur un bloc
            de temps pour le modifier ou le supprimer
          </li>
          <li className="relative pl-6">
            <span className="absolute left-0 font-bold text-(--punch-accent)">
              ✓
            </span>
            <strong>Utiliser "Combler Journée"</strong> si des heures manquent
            pour atteindre votre objectif
          </li>
          <li className="relative pl-6">
            <span className="absolute left-0 font-bold text-(--punch-accent)">
              ✓
            </span>
            <strong>Choisir votre objectif hebdomadaire</strong> dans la section
            "Objectifs" (ex: 40h/semaine)
          </li>
          <li className="relative pl-6">
            <span className="absolute left-0 font-bold text-(--punch-accent)">
              ✓
            </span>
            <strong>Geler votre semaine quand elle est équilibrée</strong> - Les
            heures doivent correspondre à votre objectif (±0.5h)
          </li>
        </ul>

        <div className="mx-5 my-2.5 grid grid-cols-2 gap-4">
          <div className="rounded bg-(--punch-light) px-2.5 py-2.5 text-xs">
            <strong className="block text-black">📊 Les totaux en bas</strong>
            Chaque colonne affiche le total d'heures de la journée en noir au
            bas
          </div>
          <div className="rounded bg-(--punch-light) px-2.5 py-2.5 text-xs">
            <strong className="block text-black">🔒 Geler la semaine</strong>
            Cliquez sur "Geler" quand vos heures sont complètes et correctes
          </div>
        </div>
      </section>

      {/* Section 3: Dépannage */}
      <section className="print:page-break-inside-avoid border-black border-r-4 border-b-4 border-l-4">
        <div className="mb-3 flex items-center gap-2.5 bg-(--punch-accent) px-4 py-2 font-bold text-base text-white">
          <span>🔧</span>
          <span>DÉPANNAGE</span>
        </div>

        <ul className="list-none space-y-2 px-5 py-4 text-xs">
          <li className="relative pl-6">
            <span className="absolute left-0">⚡</span>
            <strong>Projet manquant?</strong> Cliquez sur "Charger Projets" dans
            la section Objectifs (à droite)
          </li>
          <li className="relative pl-6">
            <span className="absolute left-0">⚡</span>
            <strong>Projet vraiment absent?</strong> Punchez sur une tâche
            normale (ex: Fabrication) puis modifiez-la plus tard en cliquant
            dessus
          </li>
          <li className="relative pl-6">
            <span className="absolute left-0">⚡</span>
            <strong>Erreur ou problème?</strong> Demandez de l'aide à votre chef
            d'équipe immédiatement!
          </li>
          <li className="relative pl-6">
            <span className="absolute left-0">⚡</span>
            <strong>Modification après gel?</strong> Seul le gestionnaire peut
            dégeler une semaine passée (code requis)
          </li>
        </ul>

        <div className="mx-5 my-4 rounded border-(--punch-accent) border-l-4 bg-(--punch-light) px-2.5 py-2.5 text-center text-xs">
          <strong className="text-(--punch-accent)">❓ BESOIN D'AIDE?</strong>
          <br />
          Contactez votre chef d'équipe ou le gestionnaire
        </div>
      </section>
    </main>
  );
}
