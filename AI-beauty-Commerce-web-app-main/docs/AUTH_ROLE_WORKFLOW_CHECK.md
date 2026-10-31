# Auth and role workflow check — 31 October 2026

Check-only pass. No UI or application behavior changed. Existing local database/API/frontend processes were started because the services were stopped. No account password, profile, business record or approval was changed, and no verification/reset email was sent. Live auth-start requests created only temporary OAuth state; administrator login created a normal session.

## Passed

- 135 isolated automated tests across 14 suites: OAuth state/PKCE and one-use exchange, verified Google identity/linking boundaries, session/password/MFA checks, email verification/reset and encrypted queue lifecycle, creator/distributor application approval and rejection, owner-scoped profiles/orders, partner permissions and fulfilment transitions.
- Live readiness on ports 3000 and 3005: 200. Anonymous auth/me, admin requests and creator workspace access: 401. Public /admin entry: 404, as intended.
- Live Google start for CUSTOMER, CREATOR and DISTRIBUTOR: redirects to accounts.google.com, S256 provider PKCE, separate persisted browser-return PKCE, HttpOnly browser proof. Configured callback is localhost:3005/api/auth/oauth/google/callback; the recorded storefront return remains localhost:3000. Different callback/return ports are supported; they are not by themselves a redirect-loop bug.
- Google's discovery endpoint responds successfully from the checking process.
- Actual configured administrator password sign-in: 200. Session restore: 200, verified email and administrator role present. No credentials were printed or changed.
- SMTP connection and authentication passed without sending a message.
- Captured-response browser journeys on both entry points: customer orders remain separate from distributor assignments, tracking and pickup use saved records/codes, creator instructions remain present, zero runtime errors.

## Findings and limits

No auth-email worker process was running when checked. Signup queues a verification link, and a running dispatcher is required for delivery. SMTP authentication alone is not end-to-end delivery. Aggregate account-email queue counts were five sent and four historical failed, with no pending/sending rows observed. Historical failures were not retried, inspected for message content or attributed to the current SMTP connection.

The configured Google client and live start routes work, but this pass did not complete a fresh human Google account selection/consent, callback token exchange and final browser session. Server exchange/role handoff passed fixture-based tests; that is distinct from new live-provider acceptance. Previous user-confirmed Google sign-in is historical evidence only.

Creator/distributor role selection remains an application intent, not an automatic role grant. Email verification precedes local account access; partner application approval grants the role to the same account and queues its approval notification. Administrator access remains server restricted.

The browser journey checks use captured responses and do not certify a live payment settlement, courier service, social-platform publishing, real email inbox placement or a physical mobile device. Keep database, API/frontend and the appropriate email worker running when carrying out live acceptance.
