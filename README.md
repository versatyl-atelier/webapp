# Versatyl

## Getting Started

### Setup (first time)

- See [System Requirements](docs/sys-reqs.md)
- `git clone <repo>`
- `cd <repo>`
- `cp .env.example .env && cp .env.example .env.staging && cp .env.example .env.prod`
- `npm install`
- `git switch dev` (never work on `main`, see [Workflow](docs/workflow.md))

### Dropbox

Project files live in Dropbox. Set these variables in `.env`, `.env.staging` and `.env.prod`, and in the Vercel Preview and Production environments (a deploy without them can't reach Dropbox):

| Variable                | Value                                                                    |
| ----------------------- | ------------------------------------------------------------------------ |
| `DROPBOX_APP_KEY`       | App key (Dropbox App Console → Settings)                                 |
| `DROPBOX_APP_SECRET`    | App secret (same page)                                                   |
| `DROPBOX_REFRESH_TOKEN` | Long-lived refresh token, obtained once with `token_access_type=offline` |
| `DROPBOX_ROOT_PATH`     | Folder holding one folder per project, e.g. `/Projets`                   |

- The Dropbox app needs the `files.content.read`, `files.content.write`, `files.metadata.read` and `files.metadata.write` permissions
- The refresh token is not the "Generate access token" button, which gives a 4-hour access token. Authorize the app at `https://www.dropbox.com/oauth2/authorize?client_id=<APP_KEY>&response_type=code&token_access_type=offline`, then exchange the returned code at `https://api.dropbox.com/oauth2/token` (`grant_type=authorization_code`, with the app key and secret as basic auth)
- Never put real values in `.env.example`, it is committed

### Day-to-day dev

- Start the local database
  - Launch Docker Desktop or `docker desktop start`
  - Start the database: `npm run db:dev`
- Start the dev server: `npm run dev`
- Staging/prod variants (using values from `.env.staging` or `.env.prod`):
  - `npm run build:staging` or `npm run build:prod`
  - `npm run start:staging` or `npm run start:prod`
- push to `dev` branch to deploy to staging and create PR
- Code owners can merge PR into `main` to deploy to main
- To import db from prod: `npm run db:prod-to-dev`

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
