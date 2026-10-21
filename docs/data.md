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
- `npm run db:prod-to-dev` replaces the local DB with a read-only copy of prod (local passwords kept, sessions not copied). Both must be on the same migrations
