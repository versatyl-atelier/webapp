## Auth

E-mail and password sign-in using better-auth with database-backed sessions in HTTP-only cookies.

- No sign-up, no e-mail sending, no e-mail verification. Managers create accounts for an e-mail with a temporary password
- Roles: `employee` or `manager`. A manager can do everything an employee can. An employee can read and change only their own data.
