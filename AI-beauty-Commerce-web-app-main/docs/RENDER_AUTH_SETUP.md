# Google sign-in and account email on the existing Render service

The live service is https://ai-beauty-commerce-web-app.onrender.com. The database readiness check passed on revision 86a9a3a. Google preparation returned HTTP 503 `oauth_configuration` for customer, creator, and distributor intent: this happens before contacting Google, when server configuration is missing or invalid.

## Configure the existing web service

Set these values in Render's web-service Environment page, then save and redeploy the latest main commit. Do not create another service just to use embedded email delivery.

In the local working copy, backend/.local/render-auth.env has been prepared with the existing Google and SMTP credentials plus the values below. It is private and Git-ignored. Use Render's Environment → Add from .env option to import its contents, review replacements, then choose Save, rebuild, and deploy. Keep all other existing environment values. If copying individual values instead, omit the surrounding .env quotes. See https://render.com/docs/configure-environment-variables.

```dotenv
NODE_ENV=production
APP_URL=https://ai-beauty-commerce-web-app.onrender.com
FRONTEND_URL=https://ai-beauty-commerce-web-app.onrender.com
PUBLIC_SITE_URL=https://ai-beauty-commerce-web-app.onrender.com
GOOGLE_REDIRECT_URI=https://ai-beauty-commerce-web-app.onrender.com/api/auth/oauth/google/callback
AUTH_EMAIL_WORKER_MODE=embedded
EMAIL_TRANSPORT=smtp
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=2525
SMTP_SECURE=false
ALLOW_LOG_EMAIL=false
```

Also set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to the matching Web application OAuth client credentials from Google Cloud (the local backend configuration already contains the working pair). Set SMTP_USER to the Brevo SMTP login, SMTP_PASS to its existing SMTP key, and SMTP_FROM to the sender verified in Brevo. These credentials belong in Render's environment settings, not this document, Git, or NEXT_PUBLIC_* variables. The sender must actually be verified; acceptance by Brevo does not guarantee inbox placement.

Keep the existing DATABASE_URL, AUTH_EMAIL_ENCRYPTION_KEY, MFA_ENCRYPTION_KEY, and other established production settings. The two encryption keys must be independent 64-character hexadecimal values; do not replace keys already used to encrypt stored records.

Render Free blocks outbound ports 25, 465, and 587. Brevo supports 2525 as an alternative. SMTP_SECURE=false selects STARTTLS rather than implicit TLS; this application still requires TLS for remote SMTP. Port 2525 connectivity from the actual Render service must pass the read-only check below. Sources: https://render.com/docs/free and https://help.brevo.com/hc/en-us/articles/10905415650322-Which-SMTP-port-should-I-use-Port-587-465-or-2525.

## Google Cloud console

On the exact OAuth Web application client used above, add:

- Authorized JavaScript origin: https://ai-beauty-commerce-web-app.onrender.com
- Authorized redirect URI: https://ai-beauty-commerce-web-app.onrender.com/api/auth/oauth/google/callback

Keep the localhost entries for local development. The redirect URI must match exactly, including HTTPS, hostname, and path, with no extra trailing slash. Do not use a localhost callback for the hosted site. See https://developers.google.com/identity/protocols/oauth2/web-server.

Customer, creator, and distributor Google sign-in share this client. Intent chooses the destination/onboarding flow; it never grants an approved partner role. Administrator Google sign-in additionally checks ADMIN_GOOGLE_EMAIL and existing staff authorization; configure the existing administrator address there.

The server now resolves the Render public origin before database initialization and logs missing/invalid environment-variable names for OAuth configuration failures, without credential values. Explicitly configured URLs still take precedence; fix any localhost overrides in Render.

## What actually sends the emails

Signup, resend-verification, password reset, and partner reviews enqueue durable database records. A dispatcher claims records and sends only valid account-related messages. Setting SMTP credentials alone does not run it.

AUTH_EMAIL_WORKER_MODE=embedded starts and supervises the account-email dispatcher alongside Next.js, using the existing web service. It restarts after failure and shuts down with the web process. The dispatcher reads the same database and encryption key as the API; expired/consumed verification links are discarded. It does not run payment, marketing, or general commerce jobs.

Use AUTH_EMAIL_WORKER_MODE=external instead if a separate `npm run worker:auth` service already runs. The proposed two-service render.production.yaml keeps this external mode. Never assume a separate worker exists just because the web service is running.

An embedded dispatcher only runs while the web instance runs. Render Free spins down during inactivity, so background delivery can pause; new web requests wake it again. An always-running worker/web plan is needed for guaranteed background processing independent of visits. This source change creates no paid resources.

## Optional HTTPS delivery

If SMTP is unavailable, the same outbox can use Brevo's HTTPS API:

```dotenv
EMAIL_TRANSPORT=brevo
EMAIL_FROM=your-verified-sender@example.com
EMAIL_FROM_NAME=Desla!
AUTH_EMAIL_WORKER_MODE=embedded
```

Set BREVO_API_KEY to a Brevo API key in Render. An SMTP key is not an API key and cannot be reused in that setting. SMTP settings are not required for this transport. If using an external worker, share EMAIL_TRANSPORT, EMAIL_FROM, EMAIL_FROM_NAME, and BREVO_API_KEY with it as well as the existing database/encryption settings. See https://developers.brevo.com/docs/send-a-transactional-email.

## Account journey and validation

Local signup creates an unverified account and queues a single-use verification link (24-hour expiry). Following the link verifies the address and establishes a session. Later sign-in uses email/password. This is email verification, not an emailed OTP for every login. Google establishes a verified identity directly. Existing unverified local accounts must prove their email before Google can link to them.

Creator/distributor users submit their application after authentication. Approval grants the role and queues an account notification. Ordinary customers are not required to set up MFA. Staff MFA is a separate authenticator-app TOTP flow; its codes are not delivered by SMTP. Password-reset links also travel through the same dispatcher; passwords are never emailed.

After deployment:

1. Require `/api/ready` to return 200.
2. Run `npm run auth:check` from the backend directory in the hosted environment if a shell is available. It prints OAuth configuration status and checks SMTP authentication (or read-only Brevo API authentication). It sends no email and does not create a session. The Google check validates local configuration, not registration in Google Cloud.
3. Check logs for `scope=auth-email-worker`, `status=ready`, and the chosen transport. Supervisor mode alone does not prove provider authentication or successful sending.
4. Request a fresh verification link through the hosted UI. Check for a `sent` log and inspect Brevo's transactional logs/inbox/spam. A successful SMTP/API acceptance is not proof of inbox delivery.
5. Open the link once, confirm the session/profile and correct role destination, then sign out/in using email/password.
6. Complete a fresh hosted Google round trip for customer and both partner intents. Confirm pending applications do not acquire approved roles. Approve a real application and confirm the notification and role on that same account.

Historical terminally failed emails are not automatically replayed. Request a fresh link after correcting delivery settings. Tests use isolated databases and mocked transports; no test emails are sent by the test suite.

Local validation passed: 86 targeted tests, TypeScript, and the optimized native Render build. Existing Brevo credentials authenticated on port 2525 without sending mail. The actual dedicated dispatcher completed one future-filtered empty-queue pass and reported ready; it sent no messages. These checks do not establish hosted Google consent/callback registration, hosted SMTP connectivity, or inbox delivery. Those still require the deployed configuration and user journey above.
