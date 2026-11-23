# Screenshots

`npm run screenshot` captures pages of the running app at several screen widths, to check that a change works on a phone (360px) as well as on a desktop. It is quick enough for an AI agent to call after each UI change and then look at the PNGs.

Script: [`scripts/screenshot.ts`](../scripts/screenshot.ts) (Playwright, Chromium)

## Setup (first time)

- `npx playwright install --only-shell chromium` (downloads the browser matching the project's Playwright version)
- The dev server must be running (`npm run dev`). The script never starts it and stops with an error if it can't reach it

## Examples

```bash
npm run screenshot -- /punch                                   # 360, 768 and 1280px wide
npm run screenshot -- / /punch --widths 360,1280               # several pages
npm run screenshot -- / --scroll "#applications-heading"       # scroll a section to the top first
npm run screenshot -- / --element "#pipeline-heading"          # only that element
npm run screenshot -- /projets --full-page --color-scheme dark
npm run screenshot -- /login --signed-out                      # as a visitor
npm run screenshot -- --help
```

## Options

| Option                  | Default                 | What it does                                                         |
| ----------------------- | ----------------------- | -------------------------------------------------------------------- |
| `--widths <list>`       | `360,768,1280`          | Comma-separated viewport widths                                      |
| `--height <px>`         | `800`                   | Viewport height                                                      |
| `--full-page`           | off                     | Capture the whole scrollable page instead of the viewport            |
| `--scroll <selector>`   |                         | Scroll this element to the top of the viewport first (repeatable)    |
| `--element <selector>`  |                         | Capture only this element (repeatable)                               |
| `--wait-for <selector>` |                         | Wait for this element before capturing                               |
| `--color-scheme <name>` | `light`                 | `light` or `dark`                                                    |
| `--signed-out`          | off                     | No saved session and no sign-in: protected pages show the login page |
| `--base-url <url>`      | `http://localhost:3000` | App to capture                                                       |
| `--out <dir>`           | `screenshots`           | Output folder                                                        |

Each page is captured once per width and per `--scroll`/`--element` selector. Selectors are CSS selectors; the first visible match is used.

## Output

- PNGs go to `screenshots/` (gitignored), at 1 CSS pixel per image pixel, named `<page>[.<target>].<width>w[.dark].png`, e.g. `punch.360w.png`, `home.scroll-applications-heading.1280w.png`. `/` is `home`. A new run overwrites files with the same name
- `screenshots/index.html` shows the last run side by side, one row per page and target
- The script prints the absolute paths of the files it wrote, one per line, on stdout. Progress, warnings (page errors, 4xx/5xx answers) and failures go to stderr
- It exits with code 1 if any capture failed (e.g. a selector matched nothing), after writing the others
- The Next.js dev indicator (and with it the dev error overlay) is hidden in the images: watch stderr for page errors

## Auth

- Pages that need a signed-in user redirect to `/login`. When that happens, the script signs in through the real login form, then captures the page
- Credentials come from `SCREENSHOT_EMAIL` and `SCREENSHOT_PASSWORD`, falling back to `SEED_MANAGER_EMAIL` and `SEED_MANAGER_PASSWORD`, from the environment or `.env`. They are never printed
- After `npm run db:prod-to-dev`, the seed manager's password may not be the one in `.env`: set `SCREENSHOT_EMAIL`/`SCREENSHOT_PASSWORD` to an account that works on the local database
- The session is saved to `.auth/screenshots.json` (gitignored, readable by you only) and reused on later runs. When it expires, the script signs in again. Delete the file to force a new sign-in
- A user who must change their password can't be used: sign in once in a browser to change it
