# label

2026-10-11, golden pair via CLI (radix-nova → base-nova): no Base UI counterpart, so it's a native `<label>`. Migrated cleanly.

## Changed

- `src/components/ui/label.tsx`: `LabelPrimitive.Root` from `radix-ui` replaced by a native `<label>`. Props are now `React.ComponentProps<"label">`. Classes unchanged. File is prettier-formatted.
- Consumers needed no changes: `ProjectsFilter.tsx:105`, `CalendarSearch.tsx:23`, `CalendarEventForm.tsx:625` and `ui/field.tsx:106` (`FieldLabel`) only pass `htmlFor`, `className` and `children`.
- Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/label.tsx` finds nothing.

## Left alone

- `src/components/ui/field.tsx`: identical in radix-nova and base-nova, and it keeps your custom `FieldLabel` classes.

## Behavior changes

- Radix `Label` blocked text selection when you double-clicked the label (`onMouseDown` with `detail > 1` → `preventDefault`). A native `<label>` lets double-click select the label text. Cosmetic only.

## Verify by hand

- Calendar event form → recurrence end radios: clicking the label text selects the matching radio.
- Projects sidebar filter / calendar search: the sr-only label is still announced for the input (VoiceOver: focus the input).
