# Data

See @/prisma/schema.prisma

## Databases

| Env     | Where                                              | Env file       |
| ------- | -------------------------------------------------- | -------------- |
| local   | Docker (`npm run db:dev`)                          | `.env`         |
| staging | Neon branch `dev`, child of `main`, no auto-delete | `.env.staging` |
| prod    | Neon branch `main`                                 | `.env.prod`    |

- URLs: Neon console → branch → **Connect**
- `DATABASE_URL`: pooled (`-pooler`), used by the app
- `DATABASE_URL_UNPOOLED`: direct, used by Prisma CLI (migrations)
- Run scripts against staging/prod with `npm run db:<script>:staging|prod`
- `npm run db:copy -- <source> <target>` (`dev`, `staging` or `prod`) replaces the target DB with a copy of the source DB. Both must be on the same migrations
  - Kept from the target: passwords (matched by e-mail, others get the target's `CREATE_USERS_PASSWORD`) and `trelloWebhooks`, since only prod receives Trello webhooks
  - `--with-passwords` copies the source's passwords instead (e.g. `npm run db:prod-to-dev -- --with-passwords`)
  - Not copied: sessions (everyone on the target is signed out) and verification tokens
