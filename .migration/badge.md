# badge

2026-10-11, golden pair via CLI (radix-nova → base-nova) plus one required deviation (`"use client"`). Migrated.

## Changed

- `src/components/ui/badge.tsx`: `Slot` / `asChild` → `useRender` + `mergeProps` (`@base-ui/react/use-render`, `@base-ui/react/merge-props`). Props are now `useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>`. `data-slot="badge"` and `data-variant` are still emitted, now through `state: { slot, variant }`.
- `src/components/ui/badge.tsx:1`: **added `"use client"`, which the base-nova registry file doesn't have.** `useRender` calls `React.useRef` through `@base-ui/utils/useMergedRefs`, and `useRef` doesn't exist in React's `react-server` build. I verified this: `node --conditions=react-server -e 'require("react").useRef'` gives `undefined`. `Badge` is rendered from server components (`ToolTiles.tsx`, `ProductionPipeline.tsx`), so without the directive those pages would throw at request time. `tsc` and `next build` can't catch this because the routes are dynamic.
- `src/components/ToolTiles.tsx:39`: `<Badge asChild …><li>{tag}</li></Badge>` → `<Badge render={<li />} …>{tag}</Badge>`. A `<li />` element is serializable, so it's fine to pass across the server → client boundary.
- Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/badge.tsx` finds nothing.

## Left alone

- Other `Badge` consumers (`ProjectHeader`, `ProductionPipeline`, `NoteThread`, `ProjectContacts`) only pass `variant`, `className` and `children`. No changes needed.

## Behavior changes

- `Badge` is now a client component. Its markup is unchanged and it still server-renders HTML, but it adds a few hundred bytes of client JS to pages that use it.

## Verify by hand

- Home page tool tiles: the tags still render as `<li>` pills (inspect the DOM: `li[data-slot=badge]`).
- Project page: stage/phase badges keep their colors and variants.
