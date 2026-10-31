# Render Google callback, database connections, and administrator MFA

Live checks before this change found revision 91c9c30 running with /api/ready returning 200, while Google preparation returned 503 oauth_configuration. The earlier log identified GOOGLE_REDIRECT_URI as invalid; the supplied setting used HTTP and misspelled both /api and /oauth. Intermittent CONNECT_TIMEOUT logs indicate database startup/connection failures; they do not identify Google credential errors or prove pool exhaustion.

## Fixed callback for the full-stack Render app

When RENDER=true, NODE_ENV=production, and APP_URL/FRONTEND_URL resolve to the same origin, the app now derives its Google callback from the HTTPS storefront origin and fixed /api/auth/oauth/google/callback route. A stale/misspelled GOOGLE_REDIRECT_URI cannot override that hosted route. Google authorization and server-side token exchange use the same derived value. Non-Render and split-origin deployments retain strict explicit callback validation.

For the existing site, register this exact Authorized redirect URI on the Web client matching GOOGLE_CLIENT_ID:

```
https://ai-beauty-commerce-web-app.onrender.com/api/auth/oauth/google/callback
```

The Authorized JavaScript origin is https://ai-beauty-commerce-web-app.onrender.com. GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be the matching pair for that Google Cloud client; replacing the secret does not register the callback. The startup log now prints the derived public callback without credentials. Google consent and a successful user round trip still require live validation. See https://developers.google.com/identity/protocols/oauth2/web-server.

## Connection management

Next server modules share a process-wide PostgreSQL pool. The Render default is five web connections, with two for the embedded account-email worker, instead of up to twenty in each process. Idle connections stay available for sixty seconds to reduce repeated TCP/TLS setup. These are maximums, not eagerly opened connections.

Optional overrides are DATABASE_POOL_MAX (1–50), AUTH_EMAIL_DATABASE_POOL_MAX (1–50 for the embedded worker), DATABASE_IDLE_TIMEOUT_SECONDS (1–600), and DATABASE_CONNECT_TIMEOUT_SECONDS (1–30). The connection timeout remains ten seconds by default. Startup logs show the configured pool limits, not credentials. The process-wide pool is released on worker shutdown. Separate web instances still have separate pools; plan their aggregate limits when scaling.

Recognized temporary database outages return a retryable 503 with Retry-After rather than a generic 500. Callback failures log safe database diagnostic codes and tell the user to restart sign-in. The app does not automatically replay writes, consumed OAuth states, or Google authorization codes after an ambiguous failure. This bounds connection pressure and improves recovery; it cannot guarantee availability during a database/provider outage. Confirm the active database and web service are in the same Render workspace/region when using the Internal URL, and inspect database connection/CPU metrics if timeouts recur. See https://render.com/docs/postgresql-creating-connecting and https://github.com/porsager/postgres.

## What the administrator prompt means

“Authenticator or recovery code” is an existing time-based MFA challenge, not email verification. No email is sent. Use the Desla entry created when this hosted account enrolled MFA, or one of that enrollment's saved recovery codes. The Google/Microsoft account used to sync the authenticator can be different from the administrator login identifier. A local development enrollment can have the same displayed email but a different secret from the hosted enrollment.

Administrator password provisioning marks the allowlisted account verified. The existing MFA secret and recovery codes are preserved. This change only clarifies the MFA screen wording; it does not remove the factor, change the layout, or bypass permissions. An admin email that is only a placeholder login identifier does not need an inbox for password plus authenticator login. Administrator Google sign-in, however, requires an actual Google account whose verified email matches ADMIN_GOOGLE_EMAIL and whose database account already has an approved staff role. Customer/creator/distributor Google accounts do not acquire administrator access.

The existing entry may be labeled Glowly, the issuer used by the enrollment code. Its displayed email is a label, not an inbox requirement. Keep existing encryption keys and established factor enrollment intact while making these changes. Changing MFA_ENCRYPTION_KEY without migrating existing encrypted secrets prevents their decryption. No password reset or MFA removal is performed by this change.

Local validation: 81 focused tests passed across pool reuse/options, safe diagnostics, hosted callback derivation, provider exchange, callback failures, OAuth persistence, admin recovery, and authenticator enforcement. Backend TypeScript and the optimized native Render build passed. These do not prove live provider consent completion or continuous database availability.
