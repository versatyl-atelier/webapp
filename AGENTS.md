<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Before writing code

Read the docs that cover your change (README.md, section "Project conventions", says which one covers what), then follow the patterns of similar existing code. If you can't find similar code, ask.

## Issues

Work is tracked in GitHub issues: `gh issue view <n> --comments`. Reference the issue in the commit that resolves it (`closes #<n>`).

## Working with the user

- When troubleshooting, find the root cause and confirm it with the user before fixing it.
- The dev server and local database usually run already. Never start either in the background without asking.
- Code migrating data from the old apps belongs in a separate `versatyl-atelier` repo, never here. Schema changes to migrated tables need a matching change there. It is not on GitHub yet, so only Shawn has it for now.
