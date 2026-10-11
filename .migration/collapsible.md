# collapsible

2026-10-11, golden pair via CLI (radix-nova → base-nova), migrated cleanly.

## Changed

- `src/components/ui/collapsible.tsx`: `radix-ui` `Collapsible` → `@base-ui/react/collapsible`. `CollapsibleTrigger` → `Trigger`, `CollapsibleContent` → `Panel`. Public names are unchanged. Props are now `CollapsiblePrimitive.*.Props`.
- `src/components/ProjectsFilter.tsx:44`: `<Collapsible defaultOpen asChild><SidebarGroup className="min-h-12">…</SidebarGroup></Collapsible>` → `<Collapsible defaultOpen render={<SidebarGroup className="min-h-12" />}>…</Collapsible>`. The children were re-indented one level, which is why the diff is large.
- `src/components/ProjectsFilter.tsx:53`: chevron `group-data-[state=open]/trigger:rotate-180` → `group-data-panel-open/trigger:rotate-180`. The Base UI trigger marks the open state with `data-panel-open`, not `data-state="open"` or `data-open`.
- `src/components/ProjectNotes.tsx:90`: `<Collapsible asChild><section …>` → `<Collapsible render={<section aria-labelledby={headingId} className="flex flex-col gap-0.5" />}>`. The chevron uses `group-data-panel-open/trigger:rotate-90`.
- Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/collapsible.tsx` finds nothing.

## Left alone

- `ProjectsFilter.tsx:46`: `<SidebarGroupLabel asChild><CollapsibleTrigger/></SidebarGroupLabel>` was still `asChild` at this commit because `SidebarGroupLabel` was still on radix `Slot`. It's rewritten in the sidebar commit (see `sidebar.md`).

## Behavior changes

- None expected. Closed panels are unmounted, the same as Radix's default.

## Verify by hand

- Projects sidebar: each project group starts expanded. Clicking the group header collapses it and the chevron rotates back. Clicking again expands it.
- Project → Notes tab: a collapsible notes section starts collapsed. Clicking the header expands it and the chevron rotates 90°. Keyboard: Tab to the header, then Enter/Space toggles.
