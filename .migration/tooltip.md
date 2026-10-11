# tooltip

2026-10-11, golden pair via CLI (radix-nova → base-nova), migrated cleanly.

## Changed

- `src/components/ui/tooltip.tsx`: `radix-ui` `Tooltip` → `@base-ui/react/tooltip`. `TooltipContent` is now `Portal > Positioner > Popup`:
  - `side`, `sideOffset`, `align` and `alignOffset` are declared through `Pick<TooltipPrimitive.Positioner.Props, …>`, destructured, and forwarded to `<TooltipPrimitive.Positioner>`. The forwarding rule is satisfied.
  - The Positioner gets `isolate z-50` and the Popup keeps `z-50`.
  - `--radix-tooltip-content-transform-origin` → `--transform-origin`.
  - The arrow gets per-side positioning classes, including logical `inline-start` / `inline-end`.
  - `TooltipProvider` `delayDuration = 0` → `delay = 0`.
- `src/components/NoteThread.tsx:275`: `<TooltipTrigger asChild><span tabIndex={0} …><Button disabled …/></span></TooltipTrigger>` → `<TooltipTrigger render={<span tabIndex={0} className="rounded-md" />}><Button …/></TooltipTrigger>`.
- `src/components/ui/sidebar.tsx:529` (still radix at this commit): `<TooltipTrigger asChild>{button}</TooltipTrigger>` → `<TooltipTrigger render={button} />`, to keep the build green. The base-nova sidebar uses the same shape.
- `src/app/layout.tsx`: `<TooltipProvider>` passes no props, so no change.
- Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/tooltip.tsx` finds nothing.

## Left alone

- The `data-[state=delayed-open]:*` classes on the popup are dead under Base UI, but the base-nova registry keeps them. `data-open:animate-in` covers the open animation.

## Behavior changes

- **Default `sideOffset` 0 → 4.** Tooltips now sit 4px further from their trigger (registry default).
- Hovering the tooltip popup itself keeps it open in both libraries. Radix's `disableHoverableContent` isn't used anywhere.
- Close delay: Base UI's Trigger `closeDelay` defaults to 0, the same as before.

## Verify by hand

- Project → Notes: hover or keyboard-focus the disabled "link email" icon. The tooltip appears immediately (provider delay 0) above it, with the arrow pointing at the icon.
- Collapse the sidebar (icon mode) and hover a menu item. The tooltip appears to the right. In expanded mode, no tooltip appears.
- Press Escape while a tooltip is open: it closes.
