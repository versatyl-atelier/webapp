## Auth

Users can log in as either (or both) roles using shared passwords.

A reusable LoginModal component sets/unsets an HTTP-only cookie with no automatic expiration (`{ authenticated: true, issuedAt: timestamp }`) after verifying the password server-side.

Backend uses middleware to read cookie and allow/refuse access to vertain pages / API routes.

:

| role           | cookie                      | password env var             |
| -------------- | --------------------------- | ---------------------------- |
| "employé"      | `versatyl_session_employee` | `VERSATYL_PASSWORD_EMPLOYEE` |
| "gestionnaire" | `versatyl_session_manager`  | `VERSATYL_PASSWORD_MANAGER`  |
