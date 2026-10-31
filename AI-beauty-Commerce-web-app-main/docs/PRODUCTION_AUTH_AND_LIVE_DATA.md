# Production auth and live-data setup

## Google sign-in

Keep the browser verifier in session storage only. Never enable the legacy direct
Google-login endpoint.

For the agreed **single full-stack Next.js deployment**, the same Next.js app
serves the storefront and `/api/*`; set `APP_URL` and `FRONTEND_URL` to the same
public origin. No `API_UPSTREAM_URL` is needed in that deployment. The separate
root Next.js proxy is only for deployments that intentionally run the root
storefront and `backend/` Next.js app on different origins; in that setup the
proxy forwards request cookies and response `Set-Cookie` headers.

Set these backend environment variables:

- `APP_URL`: public full-stack Next.js origin (for example `https://shop.example.com`).
- `FRONTEND_URL`: same public origin (for example `https://shop.example.com`).
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: server-only Google OAuth client.
- `GOOGLE_REDIRECT_URI`: exactly `${FRONTEND_URL}/api/auth/oauth/google/callback`.

Register that exact redirect URI in Google Cloud Console.
Creator and Distributor intents route users to their portals but do not grant
partner roles; approval remains an explicit admin action. Email/password
registration, verification, password reset, and login use the same cookie session
and preserve the requested portal intent.

## Database and email

Apply pending Drizzle migrations from `backend/` with `npm run db:migrate` after
backing up the production database. Migration `0022_magical_zaran.sql` adds the
newsletter subscriber table and catalogue presentation/version/idempotency
columns. Configure production SMTP credentials in the backend environment;
newsletter opt-in and account verification emails use the existing outbox worker.

## Live product and partner data

Admin product writes require the `products:write` and `inventory:write`
permissions and a fresh MFA verification. Product state is stored in PostgreSQL;
published products are read through the shared catalogue API used by the
storefront. Creator/Distributor dashboards require an approved linked profile;
OAuth intent alone never satisfies that gate. Community posts and likes require
an authenticated session, and chat/post forms retain entered text when the API
rejects a write.

Only when running the separate root storefront and backend apps locally, set
server-only `API_UPSTREAM_URL` to the backend origin (for example
`http://localhost:3005`). Do not expose private backend credentials or Google
client secrets in `NEXT_PUBLIC_*` variables.
