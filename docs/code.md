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

- no `any` type
- no magic values, define and export constants instead
