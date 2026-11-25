# Styling conventions

Use Tailwind CSS v4 for everything.

- No `<style>` tags, no `style=` attributes, no custom CSS (`.classname { /*css*/ }`) except for what Tailwind CSS v4 can't do
- Use official Tailwind CSS v4 utility class names directly on elements, or add project theme utility classes
- Use `@theme` for design tokens, to allow tree shaking and get extra utility classes for free
- Use the v4 opacity syntax (`bg-black/50`)
- Use the shortest canonical class names (`size-4`, not `w-4 h-4`)
- Use theme variables, no magic values
- Use Tailwind CSS for transitions and animations, not TypeScript
- Don't use `@apply`
- Never use deprecated utilities

## Mobile-first

Every page must work on a phone (360px wide) as well as on a desktop.

- Unprefixed classes target phones. Add `sm:`, `md:` and up for larger screens
- Nothing may be available on hover only (e.g. tooltips): touch screens have no hover
- Touch targets are at least 44px
- The page never scrolls horizontally. Wide content (tables, Gantt charts) scrolls inside its own container
- Prefer CSS breakpoints over `useIsMobile` (`src/hooks/use-mobile.ts`), which only kicks in after hydration
- Prefer CSS transitions and animations over JS where reasonable
