# Administrator sign-in

Open the private URL configured by `ADMIN_ENTRY_PATH`. The old `/admin` entry returns 404. Google and email/password use the persistent backend session. Admin API requests require server-assigned permissions and authenticator verification. Google OAuth never assigns administrator roles from a submitted role or email substring.

For the separate root storefront, configure `API_UPSTREAM_URL` with the backend origin and `FRONTEND_URL` on the backend with the exact storefront origin (locally http://localhost:3000). Restart the backend after changing its environment. Keep GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI on the backend; register the callback URI in Google. A callback must return to the originating storefront so its tab-scoped PKCE proof remains available.

To create the requested local administrator, set LOCAL_ADMIN_EMAIL and LOCAL_ADMIN_PASSWORD in the shell, then run `npm run admin:local` in backend. This creates a hashed-password account only in a local glowly_dev database and refuses to overwrite existing credentials. Complete MFA enrollment at first sign-in. For an existing verified account use `npm run admin:grant -- --email <email>` instead. No passwords belong in frontend code.

Administrator Google sign-in is restricted to ADMIN_GOOGLE_EMAIL (the configured Desla administrator). The Google identity and stored account must both match, and an existing staff role is required. Google never grants administrator access from a requested role. Other Google emails can register as customers and apply for creator/distributor approval. For Google-created staff accounts with no known password, use the password-reset flow before initial authenticator enrollment.

## Authenticator workflow

The password signs you into your account. Administrator verification then asks for a separate six-digit code from your authenticator app; entering the password again does not generate that code.

On the first sign-in, confirm the password, choose **Set up authenticator**, and add a new **time-based account** in Google Authenticator or Microsoft Authenticator using the setup key shown on the page. Enter the app's current six-digit code and save the recovery codes displayed after verification. The app generates a new code about every 30 seconds. Future sign-ins use the password followed by the current app code, or one unused recovery code if the authenticator is unavailable.

The setup key is used to add the account to the app; it is not the six-digit code you type into the verification field. Google sign-in also requires this administrator verification step for staff access.

## Local Next.js runtime

The storefront runs at `http://localhost:3000`; the API runs at `http://127.0.0.1:3005` after starting `npm run dev` in the root and in `backend/`. Development output is isolated by port (`.next-dev-3000` for the storefront and `.next-dev-3005` for the API); production `npm run build` uses `.next`. This prevents production builds and simultaneous development servers from replacing generated files that another server is using. The root development command pins port 3000 so an accidental second start fails clearly. Browser acceptance runs use their own folder and ports.

Creator and distributor Google-start routes have been checked on the storefront origin. Local loopback compatibility is restricted to development; production must use its configured HTTPS storefront and registered Google callback. A Google-start response proves configuration/routing, not completion of an interactive Google account sign-in.


## Private administrator entry (current)

Set the same server-only `ADMIN_ENTRY_PATH=/ops-<long-random-value>` in the root and backend ignored `.env.local` files. Set `ADMIN_GOOGLE_EMAIL` on the backend to the single allowed administrator address. Restart both servers after changing these values. No private route or password belongs in NEXT_PUBLIC settings or tracked frontend code. `/admin`, `/admin-console`, and `?screen=admin-console` return 404; old hash aliases do not display the admin form. The private page is excluded from indexing and sends no referrer. Its location does not replace authentication, permission checks or MFA.

The private page has its own email/password endpoint and Google action. Password sign-in requires the configured administrator email, a valid stored password hash, verified email and a privileged role. Google admin intent checks the verified Google identity on the server and uses the originating private page as the callback destination. Staff Google sign-in through a customer intent cannot bypass the single-email policy. Only authenticated staff receive the private entry path from `/api/auth/me`; customer profiles do not receive it.

For the requested local account configuration, `npx tsx scripts/configure-private-admin.ts` reads LOCAL_ADMIN_PASSWORD from ignored backend settings, stores a scrypt hash, preserves MFA and revokes that account's sessions if its password changes. This command is restricted to local glowly_dev; it does not delete other staff accounts or roles. Passwords are never sent in verification email. Customers and partners use verification or password-reset links, persistent HttpOnly sessions and their approved roles.

Runtime validation: the private storefront page rendered, the configured local administrator password was accepted, the authenticated account returned its private path, and admin API access stayed blocked until MFA. The Google start/cancel browser flow returned to the private page. Isolated tests reject other admin Google accounts, reject admin intent without an existing role, and keep customer/creator/distributor onboarding available.
