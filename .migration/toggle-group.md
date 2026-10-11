# toggle-group

2026-10-11, golden pair via CLI (radix-nova → base-nova), migrated cleanly. Consumer call sites rewritten for Base UI's array value model.

## Changed

- `src/components/ui/toggle-group.tsx`: `ToggleGroupPrimitive.Root` → callable `ToggleGroupPrimitive` (`@base-ui/react/toggle-group`). Items are now the Base UI `Toggle` primitive (`@base-ui/react/toggle`) instead of `ToggleGroup.Item`. Props are `ToggleGroupPrimitive.Props` / `TogglePrimitive.Props`. The `spacing`, `variant`, `size` and `orientation` context is unchanged.
- `src/components/CalendarEventForm.tsx` (every ToggleGroup in the app is here):
  - `:324` event type: removed `type="single"`, `value={type}` → `value={[type]}`, `onValueChange={(value) => …}` → `onValueChange={([value]) => …}`.
  - `:438` hour mode (24h / am-pm): same rewrite.
  - `:471` AM/PM: same rewrite. The existing `if (value)` guard covers the empty array.
  - `:586` weekdays: `type="multiple"` → `multiple`. The value was already an array.
  - `:338`, `:597`: item classes `data-[state=on]:…` → `data-pressed:…`. Base UI emits `data-pressed` instead of `data-state="on"`, so the selected styling would otherwise disappear.
- Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/toggle-group.tsx` finds nothing. No `data-[state=on]` remains in app code. The only remaining hit is the registry's dead class inside `ui/toggle.tsx`, noted in `toggle.md`.

## Left alone

- `ui/toggle.tsx` `toggleVariants`: imported unchanged.

## Behavior changes

- Single-select groups: clicking the already-pressed item now emits `[]` (Radix emitted `""`). Both are rejected by the existing `isOneOf` / `if (value)` guards, so the selection still can't be cleared. Same UX as before.
- Roving focus is always on in Base UI. It was the default in Radix too, and the app never turned it off.

## Verify by hand

- Calendar → new event: click each event type pill. Exactly one stays highlighted, and clicking it again keeps it selected.
- Switch the hour mode between 24h and AM/PM. In AM/PM, toggle AM/PM and check the hour changes (midnight/noon).
- Set the frequency to weekly: toggle several weekdays on and off, save, reopen, and check the selection persisted.
- Keyboard: Tab into a group, use the arrow keys to move, and Space/Enter to press.
