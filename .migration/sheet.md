# sheet

2026-10-11, golden pair via CLI (radix-nova → base-nova), migrated cleanly.

## Changed

- `src/components/ui/sheet.tsx`: `radix-ui` `Dialog` → `@base-ui/react/dialog`, with `Overlay` → `Backdrop` and `Content` → `Popup`. The slide animation was rewritten from `animate-in` / `animate-out` keyframes to transitions: `transition duration-200 ease-in-out`, with per-side `data-starting-style:` / `data-ending-style:` translate and opacity. The close button uses `SheetPrimitive.Close render={<Button …/>}`. Props are now `SheetPrimitive.*.Props`.
- The only consumer is `ui/sidebar.tsx:183` (the mobile sidebar). It needed no change at this commit, and the base sidebar uses it the same way.
- Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/sheet.tsx` finds nothing.

## Left alone

- Nothing.

## Behavior changes

- The slide-in is now a 200ms CSS transition (a 2.5rem translate plus fade) instead of the tw-animate keyframes. It looks slightly different by design, matching the base registry.

## Verify by hand

- On a narrow (mobile) viewport, open the sidebar with the trigger. It slides in from the left over a backdrop. Escape and clicking the backdrop both close it, and focus returns to the trigger.
- Tab through the open sheet: focus stays inside it.
