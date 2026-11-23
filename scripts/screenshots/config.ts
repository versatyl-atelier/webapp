export const SCREENSHOTS_DIR = "screenshots";
export const RUNS_DIR = `${SCREENSHOTS_DIR}/runs`;
export const COMPARES_DIR = `${SCREENSHOTS_DIR}/compares`;
export const AUTH_DIR = ".auth";

export const DEFAULT_WIDTHS = [360, 768, 1280];
export const DEFAULT_HEIGHT = 800;
export const PRINT_WIDTH = 816;
export const DEFAULT_CONCURRENCY = 2;
export const KEPT_UNNAMED_RUNS = 10;

export const MODES = ["light", "dark", "print"] as const;
export type Mode = (typeof MODES)[number];
export const DEFAULT_MODES: Mode[] = ["light"];

export const ENVS = {
  local: { envFile: ".env", fixedClock: true, processEnvCredentials: true },
  staging: {
    envFile: ".env.staging",
    fixedClock: false,
    processEnvCredentials: false,
  },
  prod: {
    envFile: ".env.prod",
    fixedClock: false,
    processEnvCredentials: false,
  },
} as const;
export type EnvName = keyof typeof ENVS;
export const DEFAULT_ENV: EnvName = "local";

export const ROLES = ["gestionnaire", "employe"] as const;
export type Role = (typeof ROLES)[number];
export const DEFAULT_ROLE: Role = "gestionnaire";

export type SampleLink = { from: string; link: string };

export type PageConfig = {
  path: string;
  tool: string;
  sections?: string[];
  masks?: string[];
  waitFor?: string;
  sample?: SampleLink;
};

export const PAGES: PageConfig[] = [
  { path: "/login", tool: "public" },
  {
    path: "/",
    tool: "accueil",
    sections: ["#pipeline-heading", "#applications-heading"],
  },
  { path: "/recherche", tool: "accueil" },
  { path: "/change-password", tool: "accueil" },
  { path: "/calendrier", tool: "calendrier" },
  { path: "/calendrier/evenements/nouveau", tool: "calendrier" },
  {
    path: "/calendrier/jour/[date]",
    tool: "calendrier",
    sample: { from: "/calendrier", link: 'a[href^="/calendrier/jour/"]' },
  },
  {
    path: "/calendrier/evenements/[id]",
    tool: "calendrier",
    sample: {
      from: "/calendrier",
      link: 'a[href^="/calendrier/evenements/"]:not([href*="nouveau"])',
    },
  },
  { path: "/projets", tool: "projets" },
  {
    path: "/projets/[id]",
    tool: "projets",
    sample: { from: "/", link: 'a[href^="/projets/"]' },
  },
  { path: "/lanceur-de-dates", tool: "lanceur" },
  { path: "/lanceur-de-dates/tableau", tool: "lanceur" },
  { path: "/punch", tool: "punch" },
  {
    path: "/punch/employe/[id]",
    tool: "punch",
    sample: { from: "/punch", link: 'a[href^="/punch/employe/"]' },
  },
  { path: "/punch/feuille-de-temps", tool: "punch" },
  { path: "/punch/guide-pointage", tool: "punch" },
  { path: "/punch/jobines", tool: "punch" },
  { path: "/punch/taches", tool: "punch" },
  { path: "/punch/rapport", tool: "punch" },
  { path: "/punch/rapport/imprimable", tool: "punch" },
  { path: "/gestionnaire", tool: "gestionnaire" },
  { path: "/gestionnaire/trello", tool: "gestionnaire" },
];

export const ALL_PRESET = "all";

export const PRESETS: Record<string, string[]> = {
  [ALL_PRESET]: PAGES.map(({ path }) => path),
  ...Object.fromEntries(
    [...new Set(PAGES.map(({ tool }) => tool))].map((tool) => [
      tool,
      PAGES.filter((page) => page.tool === tool).map(({ path }) => path),
    ]),
  ),
};

export function pageConfig(path: string): PageConfig | undefined {
  return PAGES.find((page) => page.path === path);
}
