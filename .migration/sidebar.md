# sidebar

2026-10-11, golden pair via CLI (radix-nova → base-nova) plus your customization replayed. Migrated cleanly. This was the last radix wrapper.

## Changed

- `src/components/ui/sidebar.tsx`: every `Slot` / `asChild` part moved to `useRender` + `mergeProps`, with `data-slot` / `data-sidebar` / `data-size` / `data-active` emitted through `state`: `SidebarGroupLabel`, `SidebarGroupAction`, `SidebarMenuButton`, `SidebarMenuAction` and `SidebarMenuSubButton`. `SidebarMenuButton` with a `tooltip` now renders through `<TooltipTrigger render={render} />` instead of wrapping. The mobile variant uses the migrated `Sheet`. The file already has `"use client"`, so `useRender` is safe here.
- **Customization kept:** `SidebarInset` renders a `<div>` (`React.ComponentProps<"div">`), not the registry's `<main>` (`sidebar.tsx:305-307`). It was re-applied by hand on top of the base golden.
- `asChild` → `render` call sites:
  - `src/app/projets/ProjetsSidebar.tsx:18`: `<SidebarMenuButton render={<Button variant="default" />}>+ Nouveau projet</SidebarMenuButton>`. This is an async server component passing a serializable element to the client `SidebarMenuButton`.
  - `src/components/AppSidebar.tsx:31` (home) and `:53` (tools): `render={<Link href={…} />}`, with the children moved onto `SidebarMenuButton`. `tooltip` and `isActive` are unchanged.
  - `src/components/ProjectsFilter.tsx:45`: `<SidebarGroupLabel render={<CollapsibleTrigger className="…" />}>…</SidebarGroupLabel>`.
  - `src/components/ProjectsFilter.tsx:65`: `<SidebarMenuButton render={<Link href={projectPath(id, tab)} title={name} />}>…`.
- Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/sidebar.tsx` finds nothing. Repo-wide, `grep -rn "radix-ui\|@radix-ui\|asChild\|--radix-" src tests` returns nothing.

## Left alone

- `src/hooks/use-mobile.ts`: identical logic between registry variants, formatting only.
- `sidebar.tsx` still uses `data-[state=collapsed]` / `data-state` selectors. Those are the sidebar's own expanded/collapsed attributes, not radix.
- Other sidebar consumers (`ToolSidebar`, `ToolLayout`, `VersatylSidebarTrigger`, `CalendarSearch`, `MultiPunchForm`, `PunchSidebar`, `CalendrierSidebar`, `layout.tsx`) don't use `asChild`, so no changes.

## Behavior changes

- Menu-button tooltips: the trigger is now the rendered element itself (Base UI `TooltipTrigger render`), not a radix `Slot` wrapper. The DOM is the same `<a>` / `<button>`.
- `SidebarMenuButton render={<Button/>}` (ProjetsSidebar): Button's and the sidebar's classes are merged by `mergeProps`, the same concatenation as Radix `Slot`.

## Verify by hand

- Left icon rail (AppSidebar): hover each tool icon. The tooltip appears on the right, the active tool is highlighted, and clicking navigates client-side. The home grid icon goes to `/`.
- Projects: "+ Nouveau projet" in the sidebar footer renders as a primary button.
- Projects sidebar groups: the header toggles the group (see `collapsible.md`), and project links navigate with the color dot and truncation intact.
- Toggle the sidebar with the trigger and with Cmd/Ctrl+B. On a mobile width it opens as a sheet.
