# select

2026-10-11, golden pair via CLI (radix-nova → base-nova), migrated. All 8 call sites needed changes so the trigger keeps showing labels.

## Changed

- `src/components/ui/select.tsx`: `radix-ui` `Select` → `@base-ui/react/select`.
  - `Select` is now a bare `SelectPrimitive.Root` re-export, which keeps its generics.
  - `Content` → `Portal > Positioner > Popup`. `side`, `sideOffset`, `align`, `alignOffset` and `alignItemWithTrigger` are picked from `Positioner.Props`, destructured, and forwarded (`select.tsx:59-81`). `position="item-aligned"` became `alignItemWithTrigger = true`, which is the same default behavior.
  - `Viewport` → `List`, `ScrollUp/DownButton` → `ScrollUp/DownArrow`, `Label` → `GroupLabel`, and `ItemText` now comes before `ItemIndicator`.
  - CSS vars: `--radix-select-*` → `--available-height`, `--anchor-width`, `--transform-origin`.
  - Your customizations were import order (`import type * as React`) and class order, which are formatting only, so nothing needed replaying.
- **Value labels.** Base UI's `<Select.Value>` renders the raw value unless `items` is passed to the Root (`docs/react/components/select.md`, "Formatting the value"). Radix rendered the selected item's text. Every call site uses `<SelectValue />` with labels that differ from values, so each one now passes `items`:
  - `ProjectHeader.tsx:50`: new module constant `STAGE_ITEMS = { [NO_PROJECT_STAGE_VALUE]: NO_PROJECT_STAGE_LABEL, ...PROJECT_STAGE_LABELS }`, passed as `items`.
  - `CreateUserForm.tsx:73`: role select `items={ROLE_LABELS}`.
  - `CreateUserForm.tsx:36`: employee select builds `employeeItems` once (the "none" option plus employees). The `SelectItem`s are rendered from it, so labels aren't duplicated.
  - `ManualTimeForm.tsx:85` and `FillDayForm.tsx:74`: `items={dateOptions}` (already `{ value, label }[]`).
  - `PieceCard.tsx:79`: `phaseItems` is built once and used for both `items` and the `SelectItem`s.
  - `CalendarEventForm.tsx:153`: module constant `HOUR_ITEMS` (built from `HOURS` and `formatHour`) is used for both `items` and the `SelectItem`s. The frequency select uses `items={FREQUENCY_LABELS}`.
- **`onValueChange` type.** It now receives `(value: string | null, eventDetails)`. Handlers that passed a `useState<string>` setter directly (`ProjectHeader`, `FillDayForm`) or fed `isOneOf` (`CalendarEventForm` frequency) now guard with `value !== null`. `PieceCard` and the `CalendarEventForm` hour select got the same guard, so `Number(null)` can't become `0`.
- `PieceCard.tsx:251`: `value={targetPhaseId === null ? undefined : …}` → `null`. In Base UI, `null` means "controlled, no selection", while `undefined` switches to uncontrolled mode.
- Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/select.tsx` finds nothing.

## Left alone

- `ProjectSelect.tsx` and `EmployeeSelect.tsx` are built on `ui/combobox` (already Base UI), not `ui/select`.

## Behavior changes

- Forms still submit the same field names: Base UI renders a hidden `<input name>` instead of Radix's hidden native `<select>`.
- The default `align` on the Positioner is `"center"` (registry), but `alignItemWithTrigger` is on, so the popup overlays the trigger with the selected item lined up, the same as Radix item-aligned. On touch input or in tight space, Base UI falls back to a dropdown below the trigger.
- Typeahead uses the item labels, as before.

## Verify by hand

- Project → edit header: the stage trigger shows "Vente / Design" etc., not `venteDesign`. "Aucune étape" shows for no stage. Change it, save, and reload.
- Manager → create user: the role trigger shows "Employé" by default, not `employee`. The employee select shows names. Submit and check that `role` / `employeeId` arrive.
- Punch → manual time / fill day: the date selects show the human labels. Submitting posts the ISO value.
- Project piece → edit → phase select shows phase names. Moving to another phase updates the hidden `phaseId`.
- Calendar event (24h mode): the hour select shows formatted hours. Recurring → the frequency select shows "Hebdomadaire" etc.
- Keyboard: focus a trigger, press Space or ArrowDown to open, use the arrows and typeahead letters, Enter to select, and Escape to close (focus returns to the trigger).
