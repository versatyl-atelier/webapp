# Screenshots

Capture pages of the app at several screen widths and modes, compare runs and spot visual regressions. Works from the terminal (for humans and AI agents) and from a small local web UI.

Code: [`scripts/screenshots/`](../scripts/screenshots) (Playwright, Chromium). Pages and presets: [`scripts/screenshots/config.ts`](../scripts/screenshots/config.ts)

## Setup

- `npx playwright install --only-shell chromium` once (the browser matching the project's Playwright version)
- Local: the dev server must be running (`npm run dev`). The tool never starts it
- Each env reads its base URL (`BETTER_AUTH_URL`) and these variables from its own file (`.env`, `.env.staging`, `.env.prod`):

| Variable                           | Used for                                                                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTOMATION_GESTIONNAIRE_EMAIL`    | Robot manager account, used by default                                                                                                            |
| `AUTOMATION_GESTIONNAIRE_PASSWORD` | Its password                                                                                                                                      |
| `AUTOMATION_EMPLOYE_EMAIL`         | Robot employee account, used with `--as employe`                                                                                                  |
| `AUTOMATION_EMPLOYE_PASSWORD`      | Its password                                                                                                                                      |
| `VERCEL_AUTOMATION_BYPASS_SECRET`  | Staging only: gets past Vercel Deployment Protection (Vercel → the project → Settings → Deployment Protection → Protection Bypass for Automation) |

- Each env needs both robot users created in its database. For local only, variables set in the shell override `.env`
- Sessions are saved per env and role in `.auth/<env>.<role>.json` (gitignored, readable by you only) and reused. The tool signs in again through the login form when a session expires. Delete the file to force a new sign-in
- Prod is a real site: the tool only navigates and submits the login form, nothing else, but signing in does create a session on prod. Use `--signed-out` when you don't need one
- Credentials and the bypass secret never leave the tool: not printed, not saved in runs, not sent to the UI

## 1. Check a page at every size and mode

```bash
npm run screenshot -- /punch                                  # 360, 768 and 1280px, light
npm run screenshot -- /punch --modes all                      # light, dark and print
npm run screenshot -- / --scroll "#applications-heading"      # scroll a section to the top first
npm run screenshot -- / --element "#pipeline-heading"         # only that element
npm run screenshot -- / --sections                            # plus each section listed in the config
npm run screenshot -- /punch --as employe                     # as an employee
npm run screenshot -- /login --signed-out                     # as a visitor
```

- Print is a full-page capture with print styles at a paper-like width (816px). Widths and targets don't apply to it
- The written PNGs are printed on stdout, one per line, then the run's `index.html` contact sheet. Progress and warnings (page errors, 4xx/5xx answers) go to stderr
- A failed shot (e.g. a selector that matches nothing) doesn't stop the run, but the exit code is 1

## 2. Compare local, staging and prod

```bash
npm run screenshot -- /login --env local,prod --signed-out --compare
npm run screenshot -- --preset punch --env staging,prod --compare
npm run screenshot:compare -- latest:staging latest:prod      # compare an existing run's envs
```

The data differs between environments, so env comparisons are mostly for looking side by side, not for pixel-exact checks.

## 3. Check a changeset for visual regressions

On demand only, never part of `npm run test:ci`. Capture before and after on the same local server and database, so the data matches:

```bash
npm run screenshot -- --preset all --name before              # before changing code (or: --changed, --preset punch, paths…)
# change the code
npm run screenshot -- --like before --name after              # same pages and parameters
npm run screenshot:compare -- before after                    # add --json for machine-readable output
```

- The compare summary lists only the shots that differ, most different first, with paths to the before, after and diff images. Open only those
- `--like <run>` reuses that run's parameters, including its fixed browser clock, so client-side clocks (e.g. Punch) match. Flags you pass override them
- Data computed on the server (e.g. Punch's current week) still changes over time: capture before and after the same day
- Cover unstable regions with `--mask <selector>` or with `masks` in the config
- `--changed` (or `--changed-since <ref>`) picks pages from files changed under `src/app`. A change elsewhere in `src/` (components, lib…) falls back to every page

## 4. Pick shots in the UI, or capture everything

```bash
npm run screenshot:ui                                         # http://127.0.0.1:4300
npm run screenshot -- --preset all --modes all --concurrency 4
```

- The UI configures a run (pages and presets from the config, free paths, widths, modes, envs, role, sections, masks), shows its progress, browses past runs and compares two runs or envs (side by side, swipe overlay, diff image and mismatch %)
- It listens on 127.0.0.1 only. Stop it with Ctrl+C

## Options

| Option                  | Default        | What it does                                                         |
| ----------------------- | -------------- | -------------------------------------------------------------------- |
| `<path>...`             |                | Paths to capture, e.g. `/punch` or `/projets/abc`                    |
| `--preset <name>`       |                | Pages from the config: `all` or a tool (repeatable)                  |
| `--changed`             |                | Pages changed since `HEAD` (`--changed-since <ref>` for another ref) |
| `--widths <list>`       | `360,768,1280` | Viewport widths                                                      |
| `--height <px>`         | `800`          | Viewport height                                                      |
| `--modes <list>`        | `light`        | `light`, `dark`, `print` or `all`                                    |
| `--env <list>`          | `local`        | `local`, `staging`, `prod`                                           |
| `--full-page`           |                | Whole scrollable page instead of the viewport                        |
| `--scroll <selector>`   |                | Scroll this element to the top first (repeatable)                    |
| `--element <selector>`  |                | Capture only this element (repeatable)                               |
| `--sections`            |                | Also capture each section listed in the config                       |
| `--mask <selector>`     |                | Cover this element with a solid box (repeatable)                     |
| `--wait-for <selector>` |                | Wait for this element before capturing                               |
| `--signed-out`          |                | No saved session and no sign-in                                      |
| `--as <role>`           | `gestionnaire` | Sign in as `gestionnaire` or `employe`                               |
| `--name <name>`         | timestamp      | Name the run. A run with the same name is replaced                   |
| `--like <run>`          |                | Start from an earlier run's parameters (`latest` works)              |
| `--concurrency <n>`     | `2`            | Pages captured in parallel                                           |
| `--clock <iso\|none>`   | run start      | Fixed browser clock, local only                                      |
| `--compare`             |                | Then compare the run's first two envs                                |

`npm run screenshot -- --help` and `npm run screenshot:compare -- --help` show the same.

## Output

- `screenshots/runs/<run>/` (gitignored): one folder per env with the PNGs, `manifest.json` (parameters, base URLs, git commit and whether the tree had uncommitted changes, per-shot results) and `index.html`
- File names: `<page>[.<target>].<width>w[.dark].png` or `<page>.print.png`, e.g. `punch.360w.png`, `home.scroll-applications-heading.1280w.dark.png`. `/` is `home`, and dynamic pages keep their pattern (`projets-id`) so runs stay comparable
- `screenshots/compares/<before>--<after>/`: diff images, `report.json` and `index.html`
- Only the last 10 unnamed runs are kept. Named runs stay until you delete them: `npm run screenshot:clean` deletes unnamed runs (`--keep <n>` keeps the newest, `--named` deletes named ones too)

## Config

[`scripts/screenshots/config.ts`](../scripts/screenshots/config.ts) lists the app's pages, grouped by tool (each tool is a preset, plus `all`). Per page, optionally:

- `sections`: selectors captured with `--sections`
- `masks`: selectors always masked
- `waitFor`: a selector to wait for
- `sample`: for dynamic routes (`/projets/[id]`), where to find a real URL in each env: the first link matching `link` on the page `from`. If none is found, that shot fails with a message, and you can pass a real path instead

Add new pages there when you add routes.
