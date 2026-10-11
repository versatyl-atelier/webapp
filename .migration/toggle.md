# toggle

2026-10-11, golden pair via CLI (radix-nova → base-nova), migrated cleanly.

## Changed

- `src/components/ui/toggle.tsx`: `TogglePrimitive.Root` from `radix-ui` → callable `TogglePrimitive` from `@base-ui/react/toggle`. Props are now `TogglePrimitive.Props & VariantProps<typeof toggleVariants>`. `toggleVariants` is unchanged.
- No direct consumers in app code. `ui/toggle-group.tsx` only imports `toggleVariants` (see `toggle-group.md`).
- Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/toggle.tsx` finds nothing.

## Left alone

- `toggleVariants` still contains `data-[state=on]:bg-muted`. It's dead under Base UI (which emits `data-pressed`), but the base-nova registry keeps it and `aria-pressed:bg-muted` already gives the pressed style. Kept for registry parity.

## Behavior changes

- `onPressedChange` now receives `(pressed, eventDetails)`. Nothing in the app calls it directly.

## Verify by hand

- See `toggle-group.md`: the toggle-group items in the calendar event form are the only toggles rendered.
