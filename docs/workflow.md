# Workflow

- `main` is production. Never work on it or push to it
- `git push origin dev` deploys to staging (Vercel Preview + Neon `dev` branch), runs migrations there, then CI opens or updates the `dev → main` PR
- Everything on `dev` ships together, so verify your changes on staging, including migrations, before the release

## Shipping a change

- Known-good work: commit on `dev` (`git switch dev && git pull`) and push
- Work you want reviewed: push a feature branch (e.g. `Feature-Calendrier`) and open a PR into `dev`. The reviewer runs it locally, then merges it
- A code owner reviews and merges the `dev → main` PR, which deploys to production (Vercel Production + Neon `main` branch)

## Which version is running in any given environment?

- `GET /api/version` returns the release version, the full commit SHA and the environment (`production`, `preview`, or `local`). It needs no sign-in, so `curl <env-url>/api/version` confirms a deploy is live
- The footer shows the release version from `package.json`. To add the short commit SHA and a button to copy the full SHA:
  - Keyboard: hold `Alt` (`Option` on macOS)
  - Touch: tap the version 5 times quickly. Tap anywhere else, or 5 times again, to hide it
- Production builds the `dev → main` merge commit, so its SHA differs from staging's even when the code is the same

## Issues

- Work is tracked in [GitHub issues](https://github.com/versatyl-atelier/webapp/issues)
- Close an issue from the commit or PR that resolves it: `closes #31`
