# Styling conventions

Respect existing styling conventions. Look at siblings to fit the project's existing patterns.

In particular, use Tailwind CSS v4 for everything.

- No `<style>` tags, no `style=` attributes, no custom CSS (`.classname { /*css*/}`) except for things TailwindCSS v4 can't do.
- Use Official TailwindCSS v4 utility classes names directly on elements or add project theme utility classes
- Use `@theme` for design tokens to allow tree shaking and to get extra utility classes for free
- Use v4 opacity syntax (`bg-black/50`)
- Use shorthand canonical classes
- Use theme variables, no magic values
- Use TaildwindCSS for transitions and animations, not Typescript
- Don't use `@apply`
- Never generate deprecated utilities
