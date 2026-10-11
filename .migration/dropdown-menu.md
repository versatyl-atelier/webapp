# dropdown-menu

2026-10-11, golden pair via CLI (radix-nova → base-nova), migrated cleanly.

## Changed

- `src/components/ui/dropdown-menu.tsx`: `radix-ui` `DropdownMenu` → `@base-ui/react/menu`. This is the canonical menu mapping:
  - `Content` → `Portal > Positioner > Popup`. `align = "start"`, `alignOffset = 0`, `side = "bottom"` and `sideOffset = 4` are declared through `Pick<MenuPrimitive.Positioner.Props, …>`, destructured, and forwarded to the Positioner (`dropdown-menu.tsx:21-41`). The Positioner gets `isolate z-50 outline-none`.
  - `Label` → `GroupLabel`, `ItemIndicator` → `CheckboxItemIndicator` / `RadioItemIndicator`, `Sub` / `SubTrigger` → `SubmenuRoot` / `SubmenuTrigger` (open state via `data-popup-open:`), and `SubContent` uses the registry's own Positioner defaults.
  - CSS vars: `--radix-dropdown-menu-*` → `--available-height`, `--anchor-width`, `--transform-origin`.
  - `cn` now comes from `@/lib/utils`. The old file imported it from the `cn` npm package.
- `src/components/CollapsedCrumbs.tsx:31`: `<DropdownMenuItem asChild><Link href={href}>{label}</Link></DropdownMenuItem>` → `<DropdownMenuItem render={<Link href={href} />}>{label}</DropdownMenuItem>`. `Menu.Item` defaults to `nativeButton={false}`, so rendering an `<a>` is valid.
- Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/dropdown-menu.tsx` finds nothing.

## Left alone

- Unused exports (sub-menus, checkbox/radio items, shortcut) are kept as in the registry. No call sites use them.

## Behavior changes

- `DropdownMenuCheckboxItem` / `DropdownMenuRadioItem` would no longer close the menu on click (`closeOnClick` defaults to `false` in Base UI). Nothing in the app uses them today. Flagged for future use.
- Plain items still close the menu on click, as before.
- Menu focus now loops by default (`loopFocus`). Radix didn't loop.

## Verify by hand

- Narrow the window until the breadcrumb collapses into "…", then click it. The menu opens below, left-aligned, at least 8rem wide.
- Keyboard: focus "…", press Enter or ArrowDown, use the arrows to move (wrapping at the ends), type a letter to jump by typeahead, and press Enter to navigate. The menu closes and the route changes.
- Escape closes the menu and returns focus to "…".
