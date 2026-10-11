# button

2026-10-11, golden pair via CLI (radix-nova → base-nova) to the real `@base-ui/react/button` primitive, migrated cleanly.

## Changed

- `src/components/ui/button.tsx`: `Slot` / `asChild` replaced by `ButtonPrimitive` from `@base-ui/react/button` (it takes `render` natively). Props are now `ButtonPrimitive.Props & VariantProps<typeof buttonVariants>`. Your only customization was `import type { ComponentProps }` instead of `React.ComponentProps`, and it no longer applies because the wrapper doesn't reference React types. The base-nova golden doesn't emit `data-variant` / `data-size` on the button. Nothing in `src/` or `tests/` selects on them, so they were dropped to match the registry.
- `src/components/ui/combobox.tsx:71-78` (consumer, not a radix wrapper): `<InputGroupButton asChild><ComboboxTrigger /></InputGroupButton>` → `<InputGroupButton render={<ComboboxTrigger />} />`, which is the base-nova golden shape.
- `src/components/ui/input-group.tsx:92-95` (consumer, not a radix wrapper): `InputGroupButton` props now `Omit<…, "size" | "type"> & { type?: "button" | "submit" | "reset" }`, as in the base-nova golden. Applied as a minimal edit so the rest of the file isn't reformatted.
- `asChild` → `render={<Link … />} nativeButton={false}`, with children moved onto `Button`:
  - `src/app/calendrier/CalendrierSidebar.tsx:29`
  - `src/components/Header.tsx:29`
  - `src/components/WeekCrumbs.tsx:46` and `:68` (`TodayWeekButton`; `inert` stays on the Link)
  - `src/components/CalendarEventForm.tsx:707` (Cancel link)
  - `src/components/CalendarDayDetail.tsx:78`
- Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/button.tsx` finds nothing.

## Left alone

- `src/components/ui/input.tsx`, `textarea.tsx`: not radix. base-nova's `input` wraps `@base-ui/react/input`, but that's an opt-in change unrelated to removing radix.
- Buttons still nested inside not-yet-migrated radix `asChild` triggers at the time of this commit: radix `Slot` merges props onto the base Button, which works in the meantime. Those triggers are migrated in their own component commits.

## Behavior changes

- **Base UI `Button` defaults to `type="button"`** (native `<button>` defaults to `submit`). I swept every form-containing file for `<Button>` without an explicit `type`: `ProjectHeader.tsx:110`, `PieceCard.tsx:160`, `ProjectContacts.tsx:107` (onClick "edit" buttons) and `EditTimeEntryForm.tsx:175` (cancel in `DialogClose`). None of them is meant to submit, so nothing regresses. Any new submit button now needs `type="submit"`, which every existing submit button already has.
- Disabled buttons: Base UI sets `disabled` natively and stops pointer events. `focusableWhenDisabled` defaults to `false`, the same as before.
- Link-rendered buttons (`nativeButton={false}`) render a real `<a>` with no `role="button"` override, the same semantics as before.

## Verify by hand

- Header on a narrow viewport: the search icon button navigates to `/recherche`.
- Calendar sidebar "new event" and the day-detail "add event" button navigate. Cmd/Ctrl-click opens a new tab (it's a real link).
- Week crumbs: prev/next arrows and "today" work. "Today" is invisible and inert on the current week.
- Calendar event form: Cancel navigates back, Save submits.
- Any combobox (employee/project selects): the chevron button opens the list, and the clear button still shows when there's a value.
