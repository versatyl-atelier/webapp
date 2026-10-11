# checkbox

2026-10-11, golden pair via CLI (radix-nova → base-nova), migrated cleanly.

## Changed

- `src/components/ui/checkbox.tsx`: `radix-ui` `Checkbox` → `@base-ui/react/checkbox`. Props are now `CheckboxPrimitive.Root.Props`. Classes are identical to before (`data-checked:` resolves for both libraries through `shadcn/tailwind.css`).
- Consumer `src/components/CalendarEventForm.tsx:525` needed no change. `onCheckedChange={(checked) => changeRepeats(checked === true)}` is still valid because Base UI passes `(checked: boolean, eventDetails)`. `id` + `<FieldLabel htmlFor>` still works because Base UI puts the `id` on its hidden native `<input type="checkbox">` (`CheckboxRoot.mjs:171`).
- Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/checkbox.tsx` finds nothing.

## Left alone

- The `disabled:cursor-not-allowed disabled:opacity-50` classes are now dead code, because the Base UI root renders a `<span>`, not a `<button>`. The shadcn base-nova registry keeps them too, so they were kept for parity. No checkbox in the app is ever disabled.

## Behavior changes

- The root element is now `<span role="checkbox">` plus a hidden `<input>`, instead of `<button role="checkbox">`. The accessible role, Space-to-toggle and focus ring are unchanged.
- There's no `"indeterminate"` checked value any more (Base UI uses a separate `indeterminate` prop). Nothing in the app uses it.

## Verify by hand

- Calendar → new event (as a manager): tick "repeats" by clicking the box, then by clicking the label text, then with Tab + Space. The recurrence panel should appear and disappear each time.
