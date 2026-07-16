## Auth

Users can log in as either (or both) roles using shared passwords.

A reusable LoginModal component sets an encrypted HTTP-only cookie after verifying the password server-side.

Backend reads and decrypts cookie and allow/refuse access to certain pages / API routes.
