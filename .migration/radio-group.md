# radio-group

2026-10-11, golden pair via CLI (radix-nova → base-nova), migrated cleanly.

## Changed

- `src/components/ui/radio-group.tsx`: `RadioGroup` (callable) from `@base-ui/react/radio-group`, and items from `@base-ui/react/radio` (`Radio.Root` / `Radio.Indicator`). Props are now `RadioGroupPrimitive.Props` / `RadioPrimitive.Root.Props`. Classes unchanged.
- `src/components/ProjectHeader.tsx:180`: project-color swatches `data-[state=checked]:…` → `data-checked:…`. Base UI emits `data-checked`, not `data-state="checked"`, so the selected ring would otherwise vanish.
- `src/components/CalendarEventForm.tsx:513`: same rewrite for the event-color swatches.
- Consumer callbacks needed no change: `onValueChange={setColor}` and the `isOneOf` guards accept Base UI's `(value, eventDetails)`.
- `CalendarEventForm.tsx:621`: `RadioGroupItem id` + `<Label htmlFor>` still works because Base UI puts the `id` on the hidden `<input type="radio">` and wires `aria-labelledby` (`RadioRoot.mjs`).
- Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/radio-group.tsx` finds nothing. No `data-[state=checked]` remains anywhere in `src/`.

## Left alone

- `disabled:*` classes on the item are dead (it renders a `<span>` now). Kept to match the registry, and nothing in the app disables a radio.

## Behavior changes

- Items render as `<span role="radio">` plus a hidden input instead of `<button role="radio">`. Arrow-key navigation and Space-to-select are unchanged. Radix's `orientation` and `loop` props are gone, but the app never set them.

## Verify by hand

- Project → edit: click the color swatches. The selected one gets the ring, and arrow keys move the selection.
- Calendar event form: the color swatches behave the same. Under recurrence "end", clicking each label text selects its radio, and typing in the date or count input selects the matching option.
