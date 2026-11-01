# Administrator MFA session loop

The browser treated every HTTP 401 outside customer password login as an expired session. Invalid/replayed authenticator codes also returned 401, so a rejected factor cleared the already authenticated user and returned the administrator to the email/password form. The MFA gate additionally fetched the session twice after a successful factor, and older in-flight session reads could overwrite the newly verified state.

The fix keeps these states separate:

- Rejected authenticator/recovery codes return 422 mfa_invalid; failed setup-password confirmation returns 422 password_confirmation_failed. They do not revoke the password session. Rate limits, one-use recovery codes, and TOTP replay protection remain enforced.
- Missing, revoked, or expired primary sessions still return 401 and show the login form.
- A browser session revision changes after successful login, logout, verification, OAuth exchange, or MFA proof. An older 401 cannot clear a newer session, and older session reads cannot replace a newer identity snapshot.
- Successful MFA fetches the authoritative session once and applies that verified user to the existing app provider. The role gate opens protected dashboard content without a second refresh. Backend permission and MFA checks still authorize every protected API request.
- If MFA succeeds but the following session read temporarily fails, retry reads the session without replaying the accepted one-time code. Enrollment still displays recovery codes before proceeding, and rechecks the session when the user confirms they saved them.

This changes authentication/session behavior only. The admin layout, stored password, authenticator enrollment, encryption keys, and role restrictions are preserved. No real user factor or code is used by the tests.

Validation: 25 focused transport, server MFA/session, and admin-recovery tests passed. Five headless browser tests exercise the actual AppProvider, API client, MfaSignIn, and RequireRole with isolated HTTP fixtures: rejected-then-valid code, delayed 200 and 401 responses after successful MFA, retry after a failed session read, and actual primary-session expiration. The browser tests open protected child content as a dashboard marker; they do not connect to the live database or validate a real user's authenticator. Backend TypeScript and the optimized native Render build passed.

Run server/transport regressions with `npm exec -- vitest run tests/auth-client-session.test.ts tests/auth-mfa.test.ts tests/auth-sessions.test.ts tests/admin-bootstrap-pg.test.ts`. Run UI regressions with `npm run test:admin-ui` after installing Playwright Chromium, or set PLAYWRIGHT_CHANNEL=chrome to use installed Chrome with a separate headless test profile. The browser suite is separate from ordinary Vitest runs and uses the repository's existing locked browser/build tooling.
