<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

When writing code, follow the project's coding guidelines by reading the appropriate file(s) from the list in @README.md and inspecting existing sibling code before writing anything to make sure current patterns are followed precisely. Ask the user for the appropriate sibling code if you're not 100% sure where to look.

When troubleshooting an issue, find the root cause and confirm with the user before trying to implement a solution.
