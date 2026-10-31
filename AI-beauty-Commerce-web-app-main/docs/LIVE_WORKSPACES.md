# Live admin and partner workspaces

## Portal UI restoration update

The original designed Creator, Distributor, and Admin screens have been
re-enabled. Follow `PORTAL_UI_PRESERVATION.md`: connect data behind those screens
instead of rendering `LiveWorkspace` or `LiveAdminConsole` in their place.
The three portals now have distinct entry destinations and internal navigation.
Local `preview=design` access is development-only, uses fixtures, and blocks API
transport. Some restored controls still use their original prototype state.

The operational journeys and verification checkpoint below describe the earlier
live-workspace implementation. They are historical backend/implementation notes,
not proof that every restored screen has already been integrated with those APIs.

## Current launch configuration

The root Next.js application is the storefront. `backend/` owns PostgreSQL,
session authentication, operational APIs, the optional colocated storefront,
and the background worker. Both storefronts use authenticated API reads and
writes for the admin and partner operational surfaces.

Set the root deployment's `NEXT_PUBLIC_API_URL` to the backend HTTPS origin at
**build time**. Existing `VITE_API_URL` settings are mapped for compatibility.
Set the backend's `APP_URL`, `FRONTEND_URL`, Google OAuth settings, database,
SMTP, encryption keys, trusted proxy header, and object-storage credentials
using `backend/.env.example`. Keep secrets out of `NEXT_PUBLIC_*` variables.

For Vercel, select the inner `AI-beauty-Commerce-web-app-main` application as
the project's Root Directory. `vercel.json` now targets Next.js; it must not use
the old `dist` output or `/index.html` rewrite. Set the public API origin before
building. The Nginx example proxies Next.js rather than serving a static Vite app.

**Keep `PAYMENTS_ENABLED=false` until the payment-provider integration milestone.**
This disables payment initialization and worker provider reconciliation. Payment
keys and business-bank details do not block startup while payments are disabled.

## Database and worker

From `backend/`:

```sh
npm run db:migrate
npm run db:seed
npm run db:check
npm run worker:once
npm run worker
```

Migrations `0019` and `0020` add persistent workspace records and worker
heartbeats/review notes. Use migrations on production; do not run demo catalogue
or partner seeds against production. The local development catalogue already
present in this checkout is not proof of a real production catalogue.

`compose.production.yml` runs a one-shot migration service before API/worker
startup. Start it with your provisioned production environment:

```sh
docker compose -f compose.production.yml up --build -d
```

The worker validates its interval, finishes in-flight work on SIGTERM/SIGINT,
wakes immediately from idle sleep on shutdown, closes database connections, and
exits nonzero on a failed one-shot pass. Outbox leases recover interrupted
claims; notification attempts retry using the existing backoff policy. Worker
status, heartbeat, last pass, and task results are available in admin overview.
The API and worker must be supervised continuously; an empty outbox smoke test
does not demonstrate delivery through your SMTP provider.

The RBAC seed installs roles/permissions, not demo people, products or orders.
For the first administrator, register and verify the real operator's account,
then run this from a trusted backend console using its server-side database env:

```sh
npm run admin:grant -- --email your-verified-operator@example.com
```

The bootstrap CLI only assigns an existing verified account, records an audit
entry, and still requires MFA enrollment/session verification at sign-in.

## Operational journeys

- **Admin:** sign in with an assigned staff role, enroll/verify MFA, manage live
  catalogue products, review partner applications, manage linked locations,
  inventory/transfers and wholesale price books, publish opportunities/resources
  and editorial updates, review content/PR/campaign/support requests, inspect
  users, orders, audits and worker health. Successful writes refresh server data;
  network failures never become local simulated successes.
- **Creator:** authenticate with Google or email/password, apply if not approved,
  save/edit drafts, submit content, follow moderation notes, apply to campaigns,
  submit deliverable URLs, request PR deliveries, save collections, share the
  approved public collection, view the account's referral code and ledger, register
  a bank account, request withdrawal of available funds, and open support tickets.
- **Distributor:** authenticate with the same session model, apply for review,
  see only assigned orders and the owned location's stock, transition paid orders,
  verify customer pickup codes, request platform stock, receive transfers, record
  direct sales from owned wholesale stock, review wholesale quotes/invoices,
  update contact/address/hours, download assigned-order CSV, and open support tickets.

Admin approval of creator content publishes once to the community feed. Content
reward eligibility remains a separate administrative decision; approval does not
fabricate earnings. Approving a withdrawal does not transfer money. Existing
ledger and inventory services remain the authorities for balances and stock.

Published `CMS` or `ANNOUNCEMENT` records with audience `ALL` appear as storefront
brand updates. Approved creator collections have a public page. Drafts, private
support messages and PR delivery details are never returned by the public APIs.

## Verification commands

```sh
# Root storefront
npm run build
npm audit --omit=dev

# Backend
npm run typecheck
npm test
npm run test:postgres
npm run test:browser
npm run build
npm audit --omit=dev
```

`test:postgres` and browser integration tests require a separate
`TEST_DATABASE_URL`. Browser tests run the root storefront on 3100 and backend
on 3105, use installed Google Chrome, and create distinctly named test accounts
and records in the test database. They do not use fake API responses or change
the development/production database. Browser setup migrates the isolated test
database automatically before creating its fixtures.

## Live deployment acceptance still required

Configure the real domain and Google callback, load the approved catalogue and
partner accounts into the production database, confirm SMTP/object storage,
verify MFA and authorized roles on the deployed domain, supervise the worker,
and exercise deployment backups/restore. Then enable and verify payment
providers as the final integration milestone. Local builds and browser tests do
not establish that these externally provisioned services are deployed correctly.

## Verification checkpoint

- Root and backend production builds: passed on Next.js 15.5.28.
- Backend TypeScript: passed.
- Backend unit/embedded-PostgreSQL suite: 180 passed; the four opt-in
  multi-connection tests passed separately against native PostgreSQL.
- Browser journeys against real API/PostgreSQL records: creator draft/support
  persistence, distributor settings/orders, admin MFA/campaign review/catalogue
  creation, and callback session handoff/reload/logout all passed.
- Development PostgreSQL: 21/21 migration hashes verified; schema generation is
  a no-op.
- Worker one-shot: all task results successful; provider reconciliation disabled.
- Both production-dependency audits: zero reported vulnerabilities.

Docker is unavailable in the local environment, so image build/runtime acceptance
remains a CI/hosting check. The workflow now includes image builds and live
browser journeys; its remote execution is not established by the local checks.
The callback handoff test uses a real application session, not a Google-provider
login; deployed Google authorization and actual email/storage delivery still need
the real configured services.
