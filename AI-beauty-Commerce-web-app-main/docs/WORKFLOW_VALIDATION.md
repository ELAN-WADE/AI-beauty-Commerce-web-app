# Commerce workflow validation — 30 October 2026

Current journey review: [USER_JOURNEY_AUDIT.md](USER_JOURNEY_AUDIT.md). It records the 156-test pass, four real-cookie signup journeys, both storefront UI checks, corrected order/content flows, and remaining provider setup. Older checkpoints below are retained as history; their SMTP and admin-route setup notes are superseded by the current audit.

This checkpoint covers the existing Admin, Creator Studio, Distributor Hub and storefront. The existing portal designs remain in use. It is not a certification that every prototype screen is ready for production.

## Connected workflows

| Workflow | Behavior |
| --- | --- |
| Authentication | First-party API proxy, HttpOnly session cookies, Google PKCE handoff, one-use exchange, logout and session restoration. Staff API access requires current MFA. |
| Staff access | Permissions returned by `/api/auth/me` control navigation. Super Admin can grant/revoke operational roles in Customers. Server checks remain authoritative. |
| Screen loading | Screen modules load separately; sign-in/admin do not eagerly download the 3D scanner and every storefront screen. |
| Catalogue | Products tab opens the full formulation drawer: identity, variants/prices, media, ingredients, usage and publication flags. Writes persist, detect stale versions, and refresh public catalogue data. |
| Inventory | Real platform balances, movement history, SKU transfers and receipts. Forms choose exact locations. Wholesale stock remains in its own pool. |
| Orders | Real orders and allowed fulfilment transitions. Payment state comes from backend settlement/confirmation, not an editable paid status. |
| Editorial | Hero, routines, story and ticker publish as a versioned configuration, available to public clients after reload. Local edits remain drafts until published. |
| Campaigns and PR | Admin publishes opportunities with brief details; creators apply; admin reviews and records courier references for PR dispatch. |
| Creator content | Owned drafts persist, can be edited/submitted, and editable drafts can be archived. Approved content is added to the community feed. Submitted content remains locked for review. |
| Creator collection | Real creator identity/referral terms, selected active products, collection submission and admin approval before public access. |
| Support | Creator/distributor support forms save owned tickets in the admin review queue and display the real ticket ID. |
| Distributor settings | Owned hub settings persist, protect in-progress edits from late profile reads, and display save errors. |

## Verification evidence

- Backend regression suite: 194 passing tests before the final archive/UI additions. Focused workspace suite: 7 passing tests, including archive authorization. Focused auth/proxy suite: 7 passing tests, including portal handoff and external-return rejection.
- Real PostgreSQL concurrency suite: 4 passing tests, including one reservation for the final stock unit, one commission award, one use per MFA proof, and outbox claim isolation.
- Root frontend production build: passed after separating screen bundles. The development entry chunk decreased from approximately 24 MB to 2 MB.
- Backend production build previously passed, including API routes, middleware, catalogue ISR and product page generation. The final root and backend production builds both passed after development/production output separation.
- Latest frontend and backend TypeScript checks both passed. Crypto remains explicitly outside this task; successful compilation does not validate that separate payment integration.
- The full isolated browser run passed 18 of 21 checks, including all four connected workflow tests. The two corrected admin-entry assertions and the corrected streamed-HTML assertion then passed on targeted reruns. All 21 checks have passed across these runs; this is not a claim of one uninterrupted 21/21 run.

Navigation checks verify that screens load and remain in the chosen portal; they do not certify every prototype action on those screens. Crypto remains a separate task.

All browser fixtures use a separate `TEST_DATABASE_URL`. No real payment or live Google-provider account interaction is established by these tests.

## Remaining release work

1. Validate real Google provider redirects with configured credentials and the intended administrator email policy. The local email/password bootstrap remains separate from Google configuration.
2. Configure and exercise the payment provider sandbox, signed webhooks, reconciliation and refunds; keep payments disabled until this succeeds. Service tests use controlled provider responses.
3. Validate actual media hosting/uploads, SMTP delivery and social account permissions. Local blob previews and simulated social connections cannot be treated as published assets or authorized accounts.
4. Connect remaining prototype-only resources/downloads, territory/SLA displays and any course/purchase controls to their real backing modules before enabling them in production.
5. Decide deployment rendering scope: the root storefront remains a client-rendered Next.js app; the optional backend storefront has server/ISR catalogue and product routes. A passing build does not establish full server rendering of the root storefront.

## Manual acceptance path

Sign in as the administrator, complete MFA, open Products and publish a formulation with a unique SKU and actual stock. Reload, then view it in an anonymous catalogue and cart. Publish a campaign, use a separate creator account to apply and submit content/a collection, then approve it as admin and inspect the public result. Use a separate distributor account for location-specific settings, stock and assigned order actions. Customer/creator/distributor requests to admin routes must be denied. Test checkout/provider settlement only with sandbox credentials and the isolated test database.

## Isolated acceptance run

To avoid another development task replacing the suite's generated Next files, run from `backend/` in PowerShell:

```powershell
$env:BROWSER_APP_PORT='3210'
$env:BROWSER_API_PORT='3215'
$env:BROWSER_DIST_DIR='.portal-build'
$env:BROWSER_RESULTS_DIR='test-results-portals'
npm run test:browser
```

The suite uses real cookies, APIs and the isolated PostgreSQL test database. It freezes the development refresh WebSocket so a concurrent source edit cannot erase a form in the middle of a journey. Each acceptance run is recorded in `backend/test-results-portals/summary.json`; the combined successful checks from the full run and targeted reruns are recorded in `backend/.local/portal-validation/browser-evidence.json`. Generated result folders are ignored by Git.

## OAuth and runtime follow-up

The reported `auth-flow.ts` syntax error is absent from the current source. Development and production output now use different folders (port-specific `.next-dev-<port>` and production `.next`) to prevent stale/mixed webpack modules after builds. The frontend production build passed while the development server remained running.

The focused OAuth/origin suite passed 19 tests. Live local requests returned correctly scoped creator/distributor Google-start URLs on `localhost:3000`; unauthenticated/invalid credentials returned 401 and an untrusted origin returned 403. This verifies local routing and the authentication boundary, without claiming a real Google-provider login was completed.

Final follow-up results: both production builds passed. The normal development storefront and API stayed running throughout the production builds using separate development output folders. A Chrome smoke check loaded sign-in, Creator entry and Distributor entry successfully with zero JavaScript runtime errors. The standalone OAuth verification script's creator-profile assertion was narrowed correctly so it no longer blocks the backend build; that script was not run against the live development database in this validation pass.

The admin-login 500 follow-up identified two simultaneous root development servers sharing generated files. Development output now includes the selected port, and the default storefront dev command pins port 3000. A transient syntax error in the concurrently edited upload helper also blocked the page; the current source compiles. The real local admin login returned 200 and the fresh Chrome session reached the authenticator verification field. MFA remains enabled. Browser evidence is recorded in `backend/.local/portal-validation/admin-login-ui.log`.

## Creator/distributor authentication verification (2026-10-30)

Focused authentication suites passed 37 tests across auth-proxy, OAuth PostgreSQL, sessions, email verification/password reset, and MFA. Seven isolated Chrome acceptance checks passed in one run: creator sign-in and persisted draft, distributor sign-in and saved hub settings, OAuth proof exchange with HttpOnly session persistence/reload/logout/replay rejection, and creator/distributor portal return on both storefronts for a multi-role account (including MFA). These use fixtures in the separate test database, not customer accounts.

Live localhost checks passed for CUSTOMER, CREATOR and DISTRIBUTOR Google start (307 to accounts.google.com with S256 PKCE), cancellation return to the correct portal, consumed-state rejection, and unauthenticated session/partner/admin API denial (401). Both real creator/distributor Google buttons reached Google's sign-in prompt without a provider configuration error. No Google credentials were entered or account consent granted; actual provider token exchange with a real Google account remains a manual acceptance step. Provider-response tests cover that exchange with controlled responses. Partner access still requires assigned roles and verified partner profiles; choosing a Google intent does not grant a role.

Reproducible local checks: `node scripts/check-local-partner-auth.mjs` and `node scripts/check-partner-google-ui.mjs` from backend. Evidence: `backend/.local/portal-validation/partner-auth-live.log`, `partner-google-ui.log`, `partner-auth-browser.log`, and `partner-auth-browser.json`. This verifies the described flows, not a claim that every external authentication dependency is production-certified.

## Unified signup/verification follow-up (2026-10-30)

The inconsistent localhost origin checks in middleware versus API handlers are now shared. Live localhost, alternate-port and 127.0.0.1 requests reach input validation; foreign origins remain rejected. Email verification and session creation commit together, and both storefronts restore the real session and continue to the store/selected partner onboarding page. Later email/password login remains valid. Staff MFA is still required. Local development resend can populate the verification field; no verification token is exposed by production routes.

Google start now uses the registered callback's cookie host, preserving the original storefront/tab's PKCE proof across localhost aliases. Server-side failures distinguish invalid client configuration, expired Google grants and network/provider errors without logging credentials or response bodies. Production requires a first-party HTTPS callback host. A live deliberately invalid-code probe returned invalid_grant after an initial network timeout; no real Google account consent/token exchange was completed.

Final verification: 58 focused authentication tests passed; four Chrome journeys passed together (customer, creator and distributor signup/email-link/automatic-session/reload/logout/password-login, plus Google cookie/state binding across localhost aliases). Root and backend TypeScript checks passed. Reports are preserved under backend/.local/portal-validation/signup-auth-final-evidence.json and signup-verification-browser-final.json. Repeated-run signup/verification quotas are reset only in the separate browser test database. The local development signup quota consumed by diagnostics was also cleared after validating the exact loopback glowly_dev database.

The SMTP readiness command currently reports a failed local connection. The user has an SMTP provider but its settings have not been supplied/saved in this session. Inbox delivery and the real Google account round trip remain required acceptance steps. API, worker and SMTP checker now use consistent environment-file priority, including backend/.env.local. Consolidated operator instructions are in [AUTHENTICATION.md](AUTHENTICATION.md).
