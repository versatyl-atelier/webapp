# Versatyl

Internal web app of Versatyl Atelier: Punch (time tracking), Lanceur de dates (scheduling), Calendrier and project management, connected to Trello and Dropbox.

## Getting Started

### Setup (first time)

- See [System Requirements](docs/sys-reqs.md)
- `git clone <repo>`
- `cd <repo>`
- `cp .env.example .env && cp .env.example .env.staging && cp .env.example .env.prod`, then fill in the values (see [Data](docs/data.md), [Dropbox](docs/dropbox.md) and [Trello](docs/trello.md))
- `npm install`
- `git switch dev` (never work on `main`, see [Workflow](docs/workflow.md))

### Day-to-day dev

- Start the local database
  - Launch Docker Desktop or `docker desktop start`
  - Start the database: `npm run db:dev`
- Start the dev server: `npm run dev`
- Staging/prod variants (using values from `.env.staging` or `.env.prod`):
  - `npm run build:staging` or `npm run build:prod`
  - `npm run start:staging` or `npm run start:prod`
- Copy the prod database to your local one: `npm run db:prod-to-dev` (see [Data](docs/data.md))
- Ship your work: see [Workflow](docs/workflow.md)

### For the rest

- Have a look at your options by running:

```bash
npm run
```

## Project conventions

Read the ones that apply before changing code:

| Doc                                | Read it when you…                                                           |
| ---------------------------------- | --------------------------------------------------------------------------- |
| [Code](docs/code.md)               | change any code                                                             |
| [Styles](docs/styles.md)           | change JSX, class names or anything visible                                 |
| [Copy](docs/copy.md)               | write user-facing text or name a domain concept                             |
| [Data](docs/data.md)               | change the schema or migrations, or work with the staging or prod databases |
| [Auth](docs/auth.md)               | touch sign-in, sessions, roles or permissions                               |
| [Logs](docs/logs.md)               | write an action or effect                                                   |
| [Workflow](docs/workflow.md)       | commit, push or open a PR                                                   |
| [Screenshots](docs/screenshots.md) | check how a page looks at phone and desktop widths                          |
| [Dropbox](docs/dropbox.md)         | touch project folders or files                                              |
| [Trello](docs/trello.md)           | touch Trello cards, lists or webhooks                                       |
