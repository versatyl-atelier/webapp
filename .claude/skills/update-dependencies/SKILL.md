---
name: update-dependencies
description: Update dependencies in package.json files to their latest versions.
---

Use `npm outdated` to check for outdated dependencies in your project.
Update the dependencies in `package.json` for minor and patch versions. Don't update if the newer version is marked `beta`, `rc`, `alpha` or anything else that doesn't feel stable. For each update, quickly research the relevant release notes / changelog to make sure no breaking changes are expected. Revert any updates that seem risky, then run `npm install`. Run basic tests and report back but don't commit. Summarize updates and list any that were reverted due to risk or skipped for stability concerns or any other reason.
