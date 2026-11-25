---
name: neon
description: Neon-specific operations on the staging/prod databases (branches, console, CLI, restore, connection settings). Not for queries, schema or migrations, which go through Prisma.
---

This project uses Neon only as Postgres hosting, through Prisma and `pg`. Environments and branches are described in `docs/data.md`.

For anything Neon-specific beyond that, read the relevant guide in https://github.com/neondatabase/agent-skills/tree/main/skills (start with `neon-postgres/SKILL.md`). Ignore its advice on drivers, ORMs and auth: this project's choices stand.
