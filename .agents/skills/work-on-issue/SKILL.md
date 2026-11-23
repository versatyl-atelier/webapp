---
name: work-on-issue
description: Work on a GitHub issue of this repo, from reading it to a commit that closes it. Use when asked to work on, fix or implement an issue (#n or URL).
---

1. Read the issue and its discussion: `gh issue view <n> --comments`. Issues are often in French and written by users, not developers.
2. Restate what's asked in a few lines. If anything is ambiguous, ask before writing code. For bugs, find the root cause and confirm it with the user before fixing it.
3. Ask whether to work directly on `dev` or on a feature branch for review (see `docs/workflow.md`).
4. Read the docs that cover the change (README.md, section "Project conventions") and similar existing code.
5. Implement, then verify: `npm run test:ci`, plus screenshots at phone and desktop widths for anything visible (see `docs/screenshots.md`).
6. When the user asks to commit, reference the issue in the message: `closes #<n>` if it's clear the issue was resolved. Don't comment on, label or close the issue on GitHub unless asked.
