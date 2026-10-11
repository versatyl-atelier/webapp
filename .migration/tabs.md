# tabs

2026-10-11, golden pair via CLI (radix-nova → base-nova), migrated cleanly.

## Changed

- `src/components/ui/tabs.tsx`: `radix-ui` `Tabs` → `@base-ui/react/tabs`. `Trigger` → `Tab` and `Content` → `Panel`. Public names (`TabsTrigger`, `TabsContent`) are unchanged. Props are now `TabsPrimitive.*.Props`. The trigger gains `aria-disabled:pointer-events-none aria-disabled:opacity-50` (registry delta). `data-active:` resolves for both libraries through `shadcn/tailwind.css`.
- Consumers needed no change: `src/components/ProjectTabs.tsx` (`value` / `onValueChange` with a single-argument handler) and `src/app/projets/[id]/page.tsx` (`TabsContent value`).
- Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/tabs.tsx` finds nothing.

## Left alone

- Nothing.

## Behavior changes

- **Keyboard activation is now manual.** Radix activated a tab as soon as arrow keys moved focus to it. Base UI (and the shadcn base registry) only moves focus, and Enter/Space activates. On the project page each activation calls `router.replace(…?tab=…)`, so arrow-keying through the tabs no longer triggers a navigation per keypress. Flagged, not patched. To restore the Radix behavior, add `activateOnFocus` to `TabsList`.
- Hidden panels: Radix unmounted inactive `TabsContent`. Base UI also unmounts them by default (`keepMounted={false}`), so no change.

## Verify by hand

- Project page: click each tab. The URL `?tab=` updates and the right panel shows, with the underline (line variant) on the active tab.
- Keyboard: Tab to the tab list, then Left/Right. Focus moves without switching panels, and Enter switches.
