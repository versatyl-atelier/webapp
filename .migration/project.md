# project

2026-10-11, whole-project Radix → Base UI migration. Strategy: golden pair via CLI (`radix-nova` → `base-nova`), with each wrapper classified against the resolved radix-nova golden and then replaced with the resolved base-nova golden, with your customizations replayed. All 18 radix wrappers are migrated, and the build, types and tests are green.

## Changed

- **Preflight:** `shadcn info` reported style `radix-nova`, Tailwind v4, aliases `@/components/ui` and npm. Your pending work (dependency upgrades, README notes, removed breadcrumb catch-all) was committed first at your request (`303f4d9`). The migration ran on the local branch `migrate-radix-to-base` off `dev`, one commit per component. Nothing was pushed.
- **Baseline before any change:** `tsc --noEmit` passed and `next build` passed (run without `db:deploy`).
- **Goldens:** both registry styles were resolved with the project's own `shadcn@4.21.4` into scratch copies of the project (`npm_config_dry_run=true`, so nothing was installed). They were prettier-formatted with the repo config and diffed against your files, also prettier-normalized. Classification: every wrapper was pristine apart from the `cn` import, except `sidebar` (`SidebarInset` as `<div>`, replayed). `button`'s type-import style and `select`'s import/class order were formatting only.
- **`components.json`:** style `radix-nova` → `base-nova` (in the alert-dialog commit).
- **Order** (one commit each; per-component reports in this folder): alert-dialog, button, label, separator, badge, breadcrumb, checkbox, radio-group, toggle, toggle-group, tabs, collapsible, tooltip, dialog, sheet, dropdown-menu, select, sidebar. alert-dialog went before button because the radix alert-dialog used `<Button asChild>`.
- **Dependency swap:** `npm uninstall radix-ui` (package.json and package-lock.json). `@base-ui/react@1.9.0` was already a dependency. Some `@radix-ui/*` packages remain in `node_modules`, but only as transitive dependencies of `prisma` (`@prisma/studio-core`), not yours.
- **App-code sweep** against `consumer-props.md`: every `asChild` call site → `render` (20 sites). Raw `data-[state=checked]` → `data-checked`, `data-[state=on]` → `data-pressed`, collapsible `group-data-[state=open]` → `group-data-panel-open`. ToggleGroup moved to the array value model and `multiple`. Select `items` were added so the trigger shows labels, `onValueChange` handlers got `null` guards, and `undefined` → `null` for "no selection". `--radix-*` vars were rewritten inside the wrappers. The final grep `radix-ui|@radix-ui|asChild|--radix-` over `src` and `tests` returns nothing.
- **Deviation from the registry:** `"use client"` was added to `ui/badge.tsx` and `ui/breadcrumb.tsx`. Their base variants call `useRender`, which needs `React.useRef`, and that's missing from React's `react-server` build. Both are rendered from server components here. See `badge.md`.

## Left alone

- Not Radix, so untouched: `ui/sonner.tsx` (sonner), `ui/combobox.tsx` and `ui/autocomplete.tsx` (already Base UI; combobox got only the button `render` fix), `ui/input.tsx`, `ui/textarea.tsx`, `ui/card.tsx`, `ui/alert.tsx` (your `warning` variant), `ui/skeleton.tsx`, `ui/field.tsx` (your custom `FieldLabel` classes). `ui/input-group.tsx` got only the one-line `type` prop change. The base-nova `input` wraps `@base-ui/react/input`; that's opt-in and wasn't applied.
- The `cn` npm package (`package.json` `"cn": "0.4.0"`) is now unused: only the old breadcrumb and dropdown-menu imported it, and they now use `@/lib/utils`. Not removed because it's not a radix dependency. Remove it if it was only there for those imports.
- `AGENTS.md` was modified by `next dev` during the smoke test (it changes the heading level of its own generated block). Left uncommitted.
- Pre-existing prettier drift in `alert`, `card`, `field`, `input-group`, `input`, `skeleton`, `sonner` and `textarea` wasn't touched. Every migrated wrapper passes `prettier --check`.

## Behavior changes

Flagged per component, none patched:
- `AlertDialogAction` no longer auto-closes the dialog.
- Base UI `Button` defaults to `type="button"`. No existing implicit submit buttons were found.
- Tabs use manual activation (arrow keys move focus only).
- Tooltip `sideOffset` changed from 0 to 4.
- Separators are announced (`role="separator"`).
- Sheet slide is now a CSS transition.
- Menu checkbox/radio items wouldn't close on click (none are used).
- Badge and breadcrumb are now client components.
- Native `<label>` allows double-click text selection.

## Verify by hand

- Final checks: `npm run type-check` passes, `vitest run` passes (11 files / 148 tests), and `next build` passes (same route table as baseline).
- **Runtime smoke test, partial:** the dev server rendered `/login` (200). Logging in failed with `The table public.users does not exist`: the local Docker DB has no schema. I didn't run migrations or seed it. Every page behind auth still needs a click-through: run `npm run db:deploy && npm run db:seed` locally (or test on staging), then follow the "Verify by hand" list in each component report. Start with the select labels (`select.md`), project/calendar pages (badge and breadcrumb as client components), and the sidebar tooltips.

0 wrappers remain on Radix (`grep -rln "radix-ui\|@radix-ui" src/components/ui` returns nothing).
