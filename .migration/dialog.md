# dialog

2026-10-11, golden pair via CLI (radix-nova → base-nova), migrated cleanly.

## Changed

- `src/components/ui/dialog.tsx`: `radix-ui` `Dialog` → `@base-ui/react/dialog`. `Overlay` → `Backdrop` and `Content` → `Popup` (centered, so no Positioner). The built-in close buttons use `DialogPrimitive.Close render={<Button …/>}`. Props are now `DialogPrimitive.*.Props`. Public exports are unchanged.
- `src/components/EditTimeEntryForm.tsx:91`: `<DialogTitle asChild><h2>…</h2></DialogTitle>` → `<DialogTitle>…</DialogTitle>`. Base UI `Dialog.Title` already renders an `<h2>`, so the DOM is identical.
- `src/components/EditTimeEntryForm.tsx:174`: `<DialogClose asChild><Button …>Annuler</Button></DialogClose>` → `<DialogClose render={<Button disabled={pending} …/>}>Annuler</DialogClose>`.
- Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/dialog.tsx` finds nothing.

## Left alone

- `src/components/Modal.tsx` (used by the `@modals` intercepting routes: login, change-password, recherche, calendrier/[date]): its unusual composition was kept as-is. It nests `<DialogContent>` inside a non-portaled `<DialogOverlay>`, even though `DialogContent` already renders its own overlay, and puts a `<Link>` inside `<DialogClose>` (a link inside a button). Base UI's `Backdrop` renders children and only needs root context, so it works the same as before. It wasn't in scope to fix, but worth a look.
- `CalendarDayDetail.tsx`: uses `DialogTitle` as a polymorphic heading (`isModal ? DialogTitle : "h1"`) with no `asChild`, so no change.

## Behavior changes

- `onOpenChange` now receives `(open, eventDetails)`. `Modal` and `EditTimeEntryForm` take one argument, so they're unaffected.
- `EditTimeEntryForm` uses `modal={false}`. Base UI non-modal dialogs also close on outside press and don't lock scroll, so the behavior matches Radix.
- The enter/exit animations still use the registry's `data-open:animate-in` / `data-closed:animate-out` classes. Base UI waits for the keyframes to finish before unmounting.

## Verify by hand

- Open `/login` (or the search modal) from a page so the intercepting route renders `Modal`. It should open with a backdrop, close on Escape, and go back in history. Clicking the backdrop should also close it.
- Punch → manager → click a time entry to open "Modifier l'entrée de temps". Focus goes to the first field and Tab stays inside the dialog. "Annuler" closes it and focus returns to the entry. Save/Supprimer still submit.
- Calendar: open a day as a modal (`/calendrier/[date]` intercepted). The heading is the dialog's accessible name (VoiceOver announces it).
