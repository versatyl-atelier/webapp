# Workflow

- Work on `dev` locally (`git switch dev && git pull`), never on `main`
- `git push origin dev` deploys to staging (Vercel Preview + Neon `dev` branch), runs migrations there, and opens or updates the `dev → main` PR
- Verify your changes on staging, including migrations, before asking for review
- A code owner reviews and merges the PR, which deploys to production (Vercel Production + Neon `main` branch)
