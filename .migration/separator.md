# separator

2026-10-11, golden pair via CLI (radix-nova → base-nova), migrated cleanly.

## Changed

- `src/components/ui/separator.tsx`: `SeparatorPrimitive.Root` from `radix-ui` → callable `SeparatorPrimitive` from `@base-ui/react/separator`. Props are now `SeparatorPrimitive.Props`. The `decorative` prop is gone (Base UI has none). Classes unchanged: `data-horizontal:` / `data-vertical:` come from `shadcn/tailwind.css` and match `data-orientation`, which Base UI still emits.
- Consumers needed no changes: `ui/field.tsx:163` (`FieldSeparator`) and `ui/sidebar.tsx:358` (`SidebarSeparator`) never passed `decorative`.
- Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/separator.tsx` finds nothing.

## Left alone

- `src/components/ui/field.tsx`: identical between radix-nova and base-nova.

## Behavior changes

- **Separators are now announced.** Radix defaulted `decorative = true` (`role="none"`). Base UI always renders `role="separator"` with `aria-orientation`. Screen readers will now announce the `FieldSeparator` and `SidebarSeparator` lines. That matches the shadcn base registry and isn't a WCAG problem, but it is audible.

## Verify by hand

- Sidebar: the separator lines still render at the same width and color.
- Any `FieldSeparator` with a label: the line runs behind the centered text.
