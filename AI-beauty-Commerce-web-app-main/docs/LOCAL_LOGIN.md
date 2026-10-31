# Local full-stack login

No domain or hosting account is needed. The Next.js app in `backend/` serves both
the existing storefront/portals and API routes at **http://localhost:3005**.

From a terminal whose working directory is `backend/`:

```powershell
npm run db:local -- start
npm run dev
```

Use `http://localhost:3005/login` with a local account. Customer accounts return
to `/catalogue`, approved Creators to `/creators`, approved Distributors to
`/distributor`, and administrators to `/admin`. Sign out before changing accounts.
Administrator sign-in includes authenticator enrollment/verification in the same
sign-in card, with one-time recovery codes. The designed dashboards remain behind
the login and permission gates.

The bootstrap command `npm run dev:access` creates **new** verified local test
accounts with random passwords and approved partner profiles. It only operates
on the local `glowly_dev` database at port 5433 and never resets an existing user.
Keep the printed credentials locally; do not put them in a public document.
The accounts prepared for this session are listed in the Git-ignored
`backend/.local/LOCAL_ACCESS.md`.

## Local URLs

The local Next.js environment uses:

```dotenv
APP_URL=http://localhost:3005
FRONTEND_URL=http://localhost:3005
GOOGLE_REDIRECT_URI=http://localhost:3005/api/auth/oauth/google/callback
```

These are local addresses, not purchased domains. Use `localhost` consistently
when signing in; `127.0.0.1` is a different browser cookie host.

## Google sign-in

Google supports this localhost callback. The same exact URI must be registered
for your **Web application** OAuth client in Google Cloud. The app uses the
configured server-only `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`; the local
test-account passwords belong to the app and are not Google passwords.

A new Google account receives Customer access and can apply to be a Creator or
Distributor. Choosing a portal records the destination; it does not grant a
partner or administrator role. Local seeded partner accounts are already approved
and work immediately through email/password sign-in.

## Local email verification

The local SMTP listener is not running. In development, registration and password
reset populate the existing token field with the returned development token so
you can complete these flows locally. Production does not return these tokens
and requires the configured mail transport/outbox worker.

For the root storefront on port 3000, the consolidated setup and verification workflow is documented in [AUTHENTICATION.md](AUTHENTICATION.md). Email verification now creates the signed-in session and continues to the store/selected portal; development resend can also populate a local verification token.
