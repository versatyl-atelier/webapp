# Workflow

- `main` is production. Never work on it or push to it
- `git push origin dev` deploys to staging (Vercel Preview + Neon `dev` branch), runs migrations there, then CI opens or updates the `dev → main` PR
- Everything on `dev` ships together, so verify your changes on staging, including migrations, before the release

## Shipping a change

- Known-good work: commit on `dev` (`git switch dev && git pull`) and push
- Work you want reviewed: push a feature branch (e.g. `Feature-Calendrier`) and open a PR into `dev`. The reviewer runs it locally, then merges it
- A code owner reviews and merges the `dev → main` PR, which deploys to production (Vercel Production + Neon `main` branch)

## Issues

- Work is tracked in [GitHub issues](https://github.com/versatyl-atelier/webapp/issues)
- Close an issue from the commit or PR that resolves it: `closes #31`
