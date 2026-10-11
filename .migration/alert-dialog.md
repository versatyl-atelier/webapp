# alert-dialog

2026-10-11, golden pair via CLI (radix-nova → base-nova, resolved in a scratch project, `@/lib/utils` import kept), migrated cleanly.

## Changed

- `components.json`: style `radix-nova` → `base-nova` (whole-project mode flip, done in this commit because alert-dialog went first).
- `src/components/ui/alert-dialog.tsx`: replaced with the base-nova variant. `radix-ui` `AlertDialog` → `@base-ui/react/alert-dialog`; `Overlay` → `Backdrop`, `Content` → `Popup`; `AlertDialogCancel` → `AlertDialogPrimitive.Close render={<Button />}`; `AlertDialogAction` is now a plain `<Button>` (Base UI has no Action part). Prop types moved to `AlertDialogPrimitive.*.Props`. The wrapper was pristine apart from the `cn` import, so nothing else needed replaying. File is now prettier-formatted like the rest of the repo.
- `src/components/PieceCard.tsx:103`: `<AlertDialogTrigger asChild><Button …><X /></Button>` → `<AlertDialogTrigger render={<Button … />}><X /></AlertDialogTrigger>`.
- `src/components/CalendarEventForm.tsx:676`: same `asChild` → `render` rewrite for the delete-event trigger.
- Order note: alert-dialog went before button because the radix wrapper used `<Button asChild>`, which the base Button doesn't support. The base wrapper only passes `Button` through `render`, so it works with either button.
- Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/alert-dialog.tsx` finds nothing.

## Left alone

- Consumer `AlertDialogCancel` / `AlertDialogAction` call sites (`PieceCard.tsx:121-127`, `CalendarEventForm.tsx:693-702`): their props (`variant`, `onClick`, `type="submit"`, `form`, `name`, `value`) are still valid on the base wrappers.

## Behavior changes

- **`AlertDialogAction` no longer closes the dialog.** Radix `Action` closed on click; the base wrapper is a plain Button. In `PieceCard` the dialog now stays open while `deletePiece` runs and closes when the piece unmounts. In `CalendarEventForm` it stays open until the delete submit navigates away. Flagged, not patched. If you want the old behavior, render the action through `AlertDialogPrimitive.Close`.
- Initial focus: Radix focused `Cancel` on open. Base UI focuses the first tabbable element in the popup, which in the footer order here is still Cancel.
- Clicking outside still doesn't dismiss (Base UI alert dialogs ignore outside presses by design, the same as Radix).

## Verify by hand

- Projects → a piece → the "remove" X: the dialog opens and focus lands on Cancel. Escape closes it and focus returns to the X button.
- Confirm removal: the piece disappears. Note that the dialog stays open while the delete is pending.
- Calendar → edit an event → Delete: confirm it submits the form with `command=delete` and you get redirected.
- Open/close animation still fades and zooms. Clicking the backdrop does nothing.
