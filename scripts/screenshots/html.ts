import {
  DEFAULT_CONCURRENCY,
  DEFAULT_ENV,
  DEFAULT_HEIGHT,
  DEFAULT_MODES,
  DEFAULT_ROLE,
  DEFAULT_WIDTHS,
  ENVS,
  MODES,
  PAGES,
  PRESETS,
  ROLES,
  type EnvName,
} from "./config";
import { shotLabel, targetLabel } from "./shots";
import type {
  CompareReport,
  ComparedShot,
  Manifest,
  ShotResult,
} from "./types";

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};
const HTML_SPECIAL_CHARACTERS = /[&<>"]/g;
const SHORT_SHA_LENGTH = 7;
const PERCENT_DECIMALS = 2;
const SMALLEST_SHOWN_PERCENT = 0.01;
const REFRESH_SECONDS = 2;
const LIST_SEPARATOR = ",";

const STYLES = `
:root { color-scheme: light dark; --bg: #f4f4f5; --fg: #18181b; --muted: #71717a; --card: #fff; --border: #d4d4d8; --accent: #2563eb; --bad: #dc2626; }
@media (prefers-color-scheme: dark) { :root { --bg: #18181b; --fg: #f4f4f5; --muted: #a1a1aa; --card: #27272a; --border: #3f3f46; --accent: #60a5fa; --bad: #f87171; } }
body { margin: 1rem; font-family: system-ui, sans-serif; background: var(--bg); color: var(--fg); }
a { color: var(--accent); }
h1 { font-size: 1.25rem; } h2 { font-size: 1rem; margin: 1.5rem 0 0.5rem; }
.muted { color: var(--muted); font-size: 0.875rem; }
.bad { color: var(--bad); }
.row { display: flex; gap: 1.5rem; align-items: flex-start; overflow-x: auto; padding-bottom: 1rem; }
figure { margin: 0; flex: none; }
figcaption { font-size: 0.875rem; margin-bottom: 0.25rem; }
img { display: block; height: auto; max-width: none; border: 1px solid var(--border); background: white; }
.compare { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; align-items: start; }
.compare img, .swipe img { width: 100%; }
.swipe { display: grid; max-width: 100%; margin-top: 1rem; }
.swipe img { grid-area: 1 / 1; align-self: start; }
.swipe img + img { clip-path: inset(0 calc(100% - var(--swipe, 50%)) 0 0); }
.swipe input { grid-area: 2 / 1; width: 100%; }
fieldset { border: 1px solid var(--border); background: var(--card); margin: 0 0 1rem; padding: 0.75rem 1rem; }
legend { font-weight: 600; }
label { margin-right: 1rem; white-space: nowrap; }
input[type="text"], textarea, select { font: inherit; padding: 0.25rem; max-width: 100%; }
textarea { width: 40rem; height: 3.5rem; }
button { font: inherit; padding: 0.4rem 1rem; }
table { border-collapse: collapse; } td, th { padding: 0.25rem 0.75rem 0.25rem 0; text-align: left; vertical-align: top; }
nav { margin-bottom: 1rem; }
`;

const SWIPE_SCRIPT = `
document.querySelectorAll("input[data-swipe]").forEach((input) =>
  input.addEventListener("input", () =>
    input.parentElement.style.setProperty("--swipe", input.value + "%"),
  ),
);
`;

export function escapeHtml(value: string) {
  return value.replace(
    HTML_SPECIAL_CHARACTERS,
    (character) => HTML_ESCAPES[character] ?? character,
  );
}

function renderDocument(title: string, body: string, refresh = false) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${refresh ? `<meta http-equiv="refresh" content="${REFRESH_SECONDS}">` : ""}
<title>${escapeHtml(title)}</title>
<style>${STYLES}</style>
</head>
<body>
${body}
<script>${SWIPE_SCRIPT}</script>
</body>
</html>
`;
}

function image(src: string, alt: string, width?: number) {
  return `<a href="${escapeHtml(src)}"><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}"${width ? ` width="${width}"` : ""}></a>`;
}

function runSummary(manifest: Manifest) {
  const { git, params, baseUrls } = manifest;
  const failed = manifest.shots.filter(({ error }) => error).length;
  const envs = params.envs
    .map((env) => `${env} (${escapeHtml(baseUrls[env] ?? "?")})`)
    .join(", ");
  return `<p class="muted">${escapeHtml(manifest.status)} · ${manifest.shots.length}/${manifest.total} shots${failed ? ` · <span class="bad">${failed} failed</span>` : ""} · started ${escapeHtml(new Date(manifest.startedAt).toLocaleString())} · ${git.sha ? escapeHtml(git.sha.slice(0, SHORT_SHA_LENGTH)) : "no git"}${git.dirty ? " + uncommitted changes" : ""}<br>
${envs} · modes ${params.modes.join(LIST_SEPARATOR)} · widths ${params.widths.join(LIST_SEPARATOR)}${params.signedOut ? " · signed out" : ` · as ${params.as ?? DEFAULT_ROLE}`}${params.clock ? ` · clock ${escapeHtml(params.clock)}` : ""}</p>
${manifest.error ? `<p class="bad">${escapeHtml(manifest.error)}</p>` : ""}`;
}

export function renderRunSheet(
  manifest: Manifest,
  src: (result: ShotResult) => string,
  nav = "",
) {
  const rows = Map.groupBy(manifest.shots, (result) =>
    result.mode === "print"
      ? `${result.env} · ${result.page} · print`
      : `${result.env} · ${result.page} · ${targetLabel(result.target)} · ${result.mode}`,
  );
  const sections = [...rows]
    .map(
      ([title, results]) => `<h2>${escapeHtml(title)}</h2>
<div class="row">
${results
  .map(
    (result) => `<figure>
<figcaption>${result.mode === "print" ? "print" : `${result.width}px`}${result.path && result.path !== result.page ? ` · ${escapeHtml(result.path)}` : ""}</figcaption>
${result.error ? `<p class="bad">${escapeHtml(result.error)}</p>` : image(src(result), shotLabel(result), result.width)}
</figure>`,
  )
  .join("\n")}
</div>`,
    )
    .join("\n");
  return renderDocument(
    `Run ${manifest.id}`,
    `${nav}<h1>Run ${escapeHtml(manifest.id)}</h1>
${runSummary(manifest)}
${sections}`,
    manifest.status === "running",
  );
}

export function formatMismatch(mismatch: number | null) {
  if (mismatch === null) {
    return "missing";
  }
  if (mismatch > 0 && mismatch < SMALLEST_SHOWN_PERCENT) {
    return `<${SMALLEST_SHOWN_PERCENT}%`;
  }
  return `${mismatch.toFixed(PERCENT_DECIMALS)}%`;
}

function comparedFigure(
  caption: string,
  file: string | null,
  src: (file: string) => string,
) {
  return `<figure><figcaption>${escapeHtml(caption)}</figcaption>${file ? image(src(file), caption) : `<p class="muted">none</p>`}</figure>`;
}

function renderComparedShot(
  shot: ComparedShot,
  report: CompareReport,
  src: (file: string) => string,
) {
  const sideA = `${report.a.run} · ${report.a.env}`;
  const sideB = `${report.b.run} · ${report.b.env}`;
  const swipe =
    shot.a && shot.b
      ? `<figure><figcaption>swipe: ${escapeHtml(sideA)} on the left</figcaption><div class="swipe" style="width: ${shot.width}px"><img src="${escapeHtml(src(shot.b))}" alt="${escapeHtml(sideB)}"><img src="${escapeHtml(src(shot.a))}" alt="${escapeHtml(sideA)}"><input type="range" min="0" max="100" value="50" data-swipe aria-label="Swipe position"></div></figure>`
      : "";
  return `<h2>${escapeHtml(formatMismatch(shot.mismatch))} · ${escapeHtml(shot.label)}</h2>
<div class="compare">
${comparedFigure(sideA, shot.a, src)}
${comparedFigure(sideB, shot.b, src)}
${shot.diff ? comparedFigure("diff", shot.diff, src) : ""}
</div>
${swipe}`;
}

export function renderCompare(
  report: CompareReport,
  src: (file: string) => string,
  nav = "",
) {
  const changed = report.shots.filter(({ mismatch }) => mismatch !== 0);
  const identical = report.shots.filter(({ mismatch }) => mismatch === 0);
  return renderDocument(
    "Compare",
    `${nav}<h1>${escapeHtml(`${report.a.run} · ${report.a.env}`)} → ${escapeHtml(`${report.b.run} · ${report.b.env}`)}</h1>
<p class="muted">${report.shots.length} shots · ${changed.length} different or missing · ${identical.length} identical</p>
${changed.map((shot) => renderComparedShot(shot, report, src)).join("\n")}
${identical.length ? `<details><summary>${identical.length} identical</summary><ul>${identical.map(({ label }) => `<li>${escapeHtml(label)}</li>`).join("")}</ul></details>` : ""}`,
  );
}

function radio(name: string, value: string, checked: boolean) {
  return `<label><input type="radio" name="${name}" value="${escapeHtml(value)}"${checked ? " checked" : ""}> ${escapeHtml(value)}</label>`;
}

function checkbox(
  name: string,
  value: string,
  label: string,
  checked: boolean,
) {
  return `<label><input type="checkbox" name="${name}" value="${escapeHtml(value)}"${checked ? " checked" : ""}> ${escapeHtml(label)}</label>`;
}

function runOptions(runs: Manifest[]) {
  return runs
    .flatMap((run) =>
      run.params.envs.map(
        (env) =>
          `<option value="${escapeHtml(`${run.id}:${env}`)}">${escapeHtml(`${run.id} · ${env}`)}${run.name ? "" : ` (${run.shots.length} shots)`}</option>`,
      ),
    )
    .join("");
}

export function renderHome(
  runs: Manifest[],
  envUrls: Partial<Record<EnvName, string>>,
  activeRun: string | null,
  error: string | null,
) {
  const tools = Map.groupBy(PAGES, ({ tool }) => tool);
  const pages = [...tools]
    .map(
      ([tool, toolPages]) =>
        `<p><strong>${escapeHtml(tool)}</strong> ${toolPages.map(({ path }) => checkbox("page", path, path, false)).join(" ")}</p>`,
    )
    .join("\n");
  const envs = (Object.keys(ENVS) as EnvName[])
    .map((env) =>
      checkbox(
        "env",
        env,
        `${env} ${envUrls[env] ?? "(not configured)"}`,
        env === DEFAULT_ENV,
      ),
    )
    .join(" ");
  const runRows = runs
    .map(
      (run) =>
        `<tr><td><a href="/runs/${encodeURIComponent(run.id)}">${escapeHtml(run.id)}</a></td><td>${escapeHtml(run.status)}</td><td>${run.shots.length}/${run.total}</td><td>${escapeHtml(run.params.envs.join(LIST_SEPARATOR))}</td><td>${escapeHtml(run.params.paths.join(" "))}</td><td class="muted">${escapeHtml(new Date(run.startedAt).toLocaleString())}</td></tr>`,
    )
    .join("\n");
  const options = runOptions(runs);
  return renderDocument(
    "Screenshots",
    `<h1>Screenshots</h1>
${error ? `<p class="bad">${escapeHtml(error)}</p>` : ""}
${activeRun ? `<p>Running: <a href="/runs/${encodeURIComponent(activeRun)}">${escapeHtml(activeRun)}</a></p>` : ""}
<form method="post" action="/runs">
<fieldset><legend>Pages</legend>
<p><strong>presets</strong> ${Object.keys(PRESETS)
      .map((preset) => checkbox("preset", preset, preset, false))
      .join(" ")}</p>
${pages}
<p><label>Other paths, one per line<br><textarea name="paths"></textarea></label></p>
</fieldset>
<fieldset><legend>Screens</legend>
<p><label>Widths <input type="text" name="widths" value="${DEFAULT_WIDTHS.join(LIST_SEPARATOR)}"></label>
<label>Height <input type="text" name="height" value="${DEFAULT_HEIGHT}" size="5"></label>
${checkbox("fullPage", "on", "full page", false)}</p>
<p>${MODES.map((mode) => checkbox("mode", mode, mode, DEFAULT_MODES.includes(mode))).join(" ")}</p>
<p>${envs}</p>
</fieldset>
<fieldset><legend>Targets</legend>
<p>${checkbox("sections", "on", "configured sections", false)} ${checkbox("signedOut", "on", "signed out", false)}</p>
<p><strong>as</strong> ${ROLES.map((role) => radio("as", role, role === DEFAULT_ROLE)).join(" ")}</p>
<p><label>Scroll to, one selector per line<br><textarea name="scroll"></textarea></label></p>
<p><label>Capture only, one selector per line<br><textarea name="element"></textarea></label></p>
<p><label>Mask, one selector per line<br><textarea name="mask"></textarea></label></p>
<p><label>Wait for <input type="text" name="waitFor"></label></p>
</fieldset>
<p><label>Run name (optional) <input type="text" name="name"></label>
<label>Concurrency <input type="text" name="concurrency" value="${DEFAULT_CONCURRENCY}" size="3"></label>
<button type="submit"${activeRun ? " disabled" : ""}>Capture</button></p>
</form>
<h2>Compare</h2>
${
  options
    ? `<form method="get" action="/compare"><label>Before <select name="a">${options}</select></label> <label>After <select name="b">${options}</select></label> <button type="submit">Compare</button></form>`
    : `<p class="muted">No runs yet</p>`
}
<h2>Runs</h2>
<table><tr><th>Run</th><th>Status</th><th>Shots</th><th>Envs</th><th>Pages</th><th>Started</th></tr>
${runRows}
</table>`,
  );
}
