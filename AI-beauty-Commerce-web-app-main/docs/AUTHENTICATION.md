# Authentication: storefront and API

The root Next.js storefront runs at http://localhost:3000 and proxies `/api/` to the backend on http://localhost:3005. Set `FRONTEND_URL=http://localhost:3000` and `APP_URL=http://localhost:3005` in the backend. Keep Google and SMTP credentials on the backend only.

## Account workflow

Create an account with an email and password. Until email ownership is verified, password login is denied. Open the verification email, confirm **Verify Email**, and the app creates a HttpOnly session and continues to the store. The same email/password works for later sign-ins. Verification links expire after 24 hours and can be used once; resend creates a fresh link. Successful verification consumes sibling verification links and revokes previous sessions.

Creator and distributor signup preserves the selected portal for onboarding. Signup/Google intent grants only Customer access: approved roles and partner profiles remain required for operational access. Staff sessions still complete MFA. Password resets revoke existing sessions and return to password sign-in.

Development allows localhost/127.0.0.1 origins through the same checks in API middleware and handlers. Production requires configured exact origins. Development registration/resend can populate the local verification field without SMTP; production never returns verification tokens. The UI identifies local verification and does not claim an email was delivered.

## Google OAuth

Use the backend-only `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and exact registered `GOOGLE_REDIRECT_URI`. Locally the callback may be `http://localhost:3005/api/auth/oauth/google/callback`. Start and callback share the cookie host, including when the storefront was opened through 127.0.0.1. The return URL brings the browser back to the original storefront/tab containing its PKCE proof.

Google authorization codes are exchanged only server-to-server using PKCE. A short-lived one-use handoff is exchanged by the storefront for the HttpOnly session; provider access tokens and client secrets are never returned to browser storage. Production callbacks must use HTTPS on the storefront host (the first-party API proxy supports this).

Provider configuration, expired authorization codes, and network errors produce distinct controlled failures. Logs contain only failure stage/status/code, without provider bodies, passwords, authorization codes or tokens. A successful Google prompt is not proof of a completed provider sign-in: validate consent and the callback with a real account after configuration.

## Connect your existing SMTP provider

Save your provider values in the ignored `backend/.env.local`:

```dotenv
SMTP_HOST=your-provider-host
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-provider-user
SMTP_PASS=your-provider-password
SMTP_FROM="Desla! <your-verified-sender-address>"
FRONTEND_URL=http://localhost:3000
APP_URL=http://localhost:3005
```

Use the TLS settings supplied by your provider: port 587 uses STARTTLS (`SMTP_SECURE=false`); implicit TLS uses `SMTP_SECURE=true` (commonly port 465). Production SMTP requires TLS. Restart backend and worker processes after changing environment settings.

From `backend/`, run `npm run auth:check`. This connects/authenticates without sending a message or printing credentials; it does not establish inbox delivery or validate the sender domain. Then run `npm run worker` with the same backend environment to deliver the encrypted transactional outbox. Use a fresh signup to verify receipt, the link, signed-in redirect, reload and logout. Production also requires `AUTH_EMAIL_ENCRYPTION_KEY` and the other production environment settings described in the staging guide.

SMTP delivery cannot be certified until the provider settings are saved and a real verification email is received. The default local listener at port 1025 is not an external delivery service.

## Brevo local integration (2026-10-30)

The supplied Brevo credentials are saved only in ignored backend/.env.local. SMTP connection/authentication passed, and the user-approved single test message was accepted by SMTP and received in spam. The current sender is the user's verified Gmail address, retained temporarily at their request. Inbox placement is not certified: Brevo recommends an authenticated business-domain sender for deliverability. See https://help.brevo.com/hc/en-us/articles/17378397412626-Getting-started-with-Email-deliverability and https://help.brevo.com/hc/en-us/articles/12163873383186-Authenticate-your-domain-with-Brevo-Brevo-code-DKIM-DMARC .

`npm run worker:auth -- --new-only` dispatches verification and password-reset requests created after that worker starts. It does not run commerce jobs. The user approved starting this local dispatcher. For normal deployment, supervise the existing complete worker or run `npm run worker:auth` to drain all due auth requests. A temporary --new-only session intentionally excludes earlier queued requests; use Resend to request a fresh link during this local test.

Google exchange uses https://oauth2.googleapis.com/token and the documented https://openidconnect.googleapis.com/v1/userinfo endpoint. A token POST is retried at most once only for confirmed pre-connection failures; it is never replayed after a socket reset or an OAuth rejection. Identity GETs have one bounded transient retry. Both requests disable caching and automatic redirects, retain TLS validation, and keep provider credentials server-side. Logs record stage/status and sanitized network codes. Documentation: https://developers.google.com/identity/openid-connect/reference .

Thirteen focused Google transport/OAuth failure/SMTP unit tests passed. Both TypeScript checks passed. A real Google account sign-in still needs to complete to establish provider acceptance and callback/session restoration for that account.

### Confirmed local Google runtime cause

The failing Next.js callback logged transport code EACCES. That backend had been started in a process without outbound network permission; separate permitted CLI probes succeeded, which initially masked the difference. Restarting only the backend with network permission resolved this: the actual Next route then reached Google's token endpoint (expected invalid_grant for a deliberately invalid code) and the canonical profile endpoint (expected 401 without a token). The temporary local connectivity route was removed after diagnosis. A new Google authorization attempt is required after the restart; the old code/state cannot be reused.

The dedicated new-request auth-mail worker is running locally with the user's approval. A subsequent auth.verify-email message was accepted by Brevo through that worker. Gmail is retained temporarily as requested; inbox placement remains a sender-domain deliverability task.

Final local acceptance: the user confirmed Google sign-in succeeded after restarting the backend with outbound network permission. Brevo authentication and one approved test email were confirmed; the user received it in spam and chose to keep the Gmail sender temporarily. The auth-only worker is active for new requests. No SMTP secrets are stored in tracked source.


## Account email and partner workflow correction (2026-10-30)

Local signup no longer returns verification tokens from register/resend endpoints, even in development. Password-reset tokens are also never returned in API responses. New registrations must open their emailed single-use link; the existing confirmation screen consumes it and creates the session. The signup screen clears the password and keeps the token field blank until the recipient opens their email. Already verified accounts receive an account-access email with Sign in and Forgot password links, rather than another verification token. Unverified duplicate signups receive a fresh verification link without replacing their original password. Public responses remain identical for new and existing accounts; registration and resend also use per-email shared rate limits.

The local dispatcher now runs as `npm run worker:auth`, processing due verification, reset and `partner.application-reviewed` messages, including valid older requests. This supersedes the earlier temporary `--new-only` session described above. Expired/consumed verification links are discarded; account-only expired leases recover, and a transient queue error does not terminate the loop. It does not process orders, marketing or payment jobs. A terminal session is only local development operation; production must supervise this dispatcher or the full worker.

Creator and distributor review transactions enqueue a review email together with the review status, role and partner profile. An approval email is composed from the committed application and verified account, includes the actual creator promo code/rates, and links to the proper workspace. Rejection emails include the admin's review note. Wrong-owner messages, missing roles and malformed payloads are discarded. These notifications apply to newly reviewed applications; existing historical reviews are not bulk emailed.

The account page uses `/api/auth/me`, `/api/me/profile` and owned `/api/me/addresses`. Signed-out visitors see a sign-in prompt. New accounts have no fabricated name, phone, saved addresses or wishlist. Saving a profile and adding/defaulting/deleting an address requires a successful server response. Switching accounts clears the previous account's state. New creator routine, review and tutorial drafts are blank instead of prewritten testimonials or product IDs.

Validation: isolated database tests cover emailed verification, one-time tokens, reset and session revocation, real application submission/review, same-account roles, duplicate and self-review rejection, approval/rejection mail, review rollback, recipient ownership, profile/address ownership and account-only worker recovery. Google transport and proxy regressions remain covered. `backend/scripts/check-account-ui.mjs` checks fresh guest identity, profile save/reload and empty verification fields with captured responses. These checks do not certify inbox placement or constitute a live production approval. Existing business records were not bulk deleted by this correction.


### Duplicate signup email correction

The verification screen previously appeared even when signup had silently skipped an existing verified address. The current screen says Check Your Email, explains the two account cases, offers direct Sign in and Reset password actions, and collapses manual token entry until needed. Opening a real verification link expands the confirmation form.

`auth.account-access` is now an account-mail template, handled by both dispatchers. It is rendered from the verified account and trusted storefront origin, contains no login token, and leaves password, roles and signup intent unchanged. On the user's request for elanwadeonline@gmail.com, one request through the storefront resend endpoint returned 200 and the worker completed that account-access message with status sent, attempts 1. This records SMTP acceptance, not inbox placement. Fifty isolated regression tests, both TypeScript checks and the revised browser check passed.
