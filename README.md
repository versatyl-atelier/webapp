# Versatyl

## Getting Started

### Setup (first time)

- See [System Requirements](docs/sys-reqs.md)
- `git clone <repo>`
- `cd <repo>`
- `cp .env.example .env && cp .env.example .env.staging && cp .env.example .env.prod`
- `npm install`
- `git switch dev` (never work on `main`, see [Workflow](docs/workflow.md))
- 

### Day-to-day dev
- Start the local database
    - Launch Docker Desktop or `docker desktop start`
    - Start the database: `npm run db:dev`
- Start the dev server: `npm run dev`
- push to `dev` branch to deploy to staging and create PR
- Code owners can merge PR into `main` to deploy to main

### For the rest

- Have a look at your options by running:

```bash
npm run
```

## Project conventions and coding guidelines

- [Auth](docs/auth.md)
- [Code](docs/code.md)
- [Copy](docs/copy.md)
- [Data](docs/data.md)
- [Logs](docs/logs.md)
- [Styles](docs/styles.md)
- [Workflow](docs/workflow.md)
