# breadcrumb

2026-10-11, golden pair via CLI (radix-nova → base-nova) plus one required deviation (`"use client"`). Migrated.

## Changed

- `src/components/ui/breadcrumb.tsx`: `BreadcrumbLink` moved from `Slot` / `asChild` to `useRender` + `mergeProps`. Props are now `useRender.ComponentProps<"a">` and `data-slot="breadcrumb-link"` is emitted through `state`. Other parts are unchanged apart from prettier formatting.
- `src/components/ui/breadcrumb.tsx:1`: **added `"use client"`, which the base-nova registry file doesn't have.** `useRender` calls `React.useRef`, which isn't available in the `react-server` build. `AppBreadcrumb` and `WeekCrumbs` are server components, so without the directive the breadcrumb slot would throw at request time. See `badge.md` for how this was checked.
- `src/components/ui/breadcrumb.tsx:6`: `cn` now comes from `@/lib/utils`. The old file imported it from the `cn` npm package, unlike every other wrapper. That was leftover registry output, not a customization.
- `src/components/AppBreadcrumb.tsx:60`: `<BreadcrumbLink asChild className="truncate"><Link …>{label}</Link></BreadcrumbLink>` → `<BreadcrumbLink render={<Link href={href} title={label} />} className="truncate">{label}</BreadcrumbLink>`.
- Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/breadcrumb.tsx` finds nothing.

## Left alone

- `WeekCrumbs.tsx` and `CollapsedCrumbs.tsx` use the breadcrumb parts without `asChild`, so no changes. The dropdown inside `CollapsedCrumbs` is covered by `dropdown-menu.md`.

## Behavior changes

- The breadcrumb parts are now client components. Their markup is unchanged.

## Verify by hand

- Navigate into a project (`/projets/[id]`): the breadcrumb links render, truncate, and navigate client-side (no full reload).
- Calendar week view: the week crumbs render and the prev/next links work.
