# Coding conventions

- DRY
- WCAG 2.1 AA compliance
- semantic HTML
- wide-event logging
- business logic as pure functions, Effect for side-effects
- shadcn/ui for UI components
- load page data via React Server Components
- user actions using React Server Actions (`<form action={…}>`) and `useActionState`
- Effect.Schema for input validation (e.g. form data)
- auth
  - src/proxy.ts protects pages
  - `cachedGetter` and `protectedEffect` (see src/lib/effect.ts) protect actions
  - `runEffectAsFormAction` helps with form actions
- strict typing. No `any` type
- prefer async/await over manually using promises, but prefer Effect for code dealing with side-effects
- don't add comments in the code
- no magic values, define and export constants instead
