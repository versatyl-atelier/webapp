# Coding conventions

- WCAG 2.1 AA compliance
- strict typing
- react state for state management
- shadcn/ui for UI components, fallback: other npm packages, last resort: custom code
- react server actions
- zod for validating all inputs
- text directly inlined in the code
- business logic as pure functions
- wide-event logging
- server components by default (`'use client';` only where required)
- semantic HTML
- prefer async/await over manually using promises

- don't add comments in the code
- no `any` type
- no magic values, define and export constants instead
- form actions using `restrictToRole()` should wrap the call in try-catch, call `handleAuthError()` on auth errors, and client components should use `useAuthError()` hook to show login modal
