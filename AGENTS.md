<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

- Don't run the dev server youself, ask to run it instead.
- Don't try to take screenshots, ask me to validate the visuals instead.

# Styling

Do not modify styling architecture. Look at siblings to fit the project's existing patterns.

In particular, use Tailwind CSS v4 for everything.

This means, among other things:

- Do not create a typescript or javascript configuration file, e.g. `tailwind.config.js`
- Use `@theme` for design tokens to allow tree shaking and get extra utility classes for free
- Use v4 opacity syntax (`bg-black/50`)
- Never generate deprecated utilities
