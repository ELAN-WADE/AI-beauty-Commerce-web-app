# Backend current state against the client proposal

Reviewed: 2026-10-02. Reference: Ms Grace's two-phase proposal dated 2026-09-13.

## Executive assessment

The repository contains a substantial owned commerce backend, including core
Phase 1 services, several Phase 2 services, and additional partner/wholesale
capabilities. It is beyond a backend scaffold. It is not yet demonstrated as a
production-ready, end-to-end implementation of the proposal.

The remaining work is a combination of finishing missing features, repairing
specific service and integration gaps, and proving the system on staging.
Providing credentials alone will not finish the project.

This is a source-and-checks assessment, not a production acceptance report.
The working tree changed during the review: partner-network and wholesale
implementation appeared after the first inspection. Those additions were read
and the backend tests/typecheck were rerun. This document describes that later
working-tree snapshot, including uncommitted work.

## 1. Actual architecture

| Layer | Implementation found |
| --- | --- |
| Storefront | Separate Vite + React 18 + TypeScript application in `src/` |
| Backend HTTP application | Next.js 15 App Router API handlers in `backend/src/app/api/` |
| Business logic | Modular monolith in `backend/src/modules/` |
| Database | PostgreSQL, accessed using `postgres` and Drizzle ORM |
| Validation | Zod request schemas, generally strict object validation |
| Identity | Custom password/session authentication; HttpOnly session cookies and hashed tokens |
| Media | S3-compatible storage helpers; private scan bucket and signed upload/view URLs |
| Async work | Separate Node/TypeScript worker and PostgreSQL notification outbox |
| External services | Payment adapters, SMTP, Termii, Gemini, optional Sentry reporting |
| Rate limits | In-process limiter; a Redis environment variable is not evidence of an active shared Redis limiter |

Request flow: storefront API client -> Next.js route -> validation and access
checks -> domain service -> PostgreSQL transaction and/or provider adapter.
The worker processes notification and maintenance work separately from requests.

The current module directories are `auth`, `users`, `catalog`, `inventory`,
`cart`, `orders`, `payments`, `shipping`, `reviews`, `loyalty`, `notifications`,
`skin`, `ai`, `audit`, `distributors`, `creators`, `community`, `routing`,
`partners`, `ledger`, and `wholesale`.

### Differences from the proposal

- PostgreSQL and a TypeScript/Next.js backend are present.
- The ORM is **Drizzle, not Prisma**.
- Authentication is **custom session authentication**, not an integrated
  third-party authentication provider.
- Next.js serves the backend; the customer application remains a Vite SPA.
- `supabase/` and the older `src/lib/backend.ts` remain as prototype artifacts.
  The owned backend is the path used by `src/lib/owned-api.ts` when configured.
- `docs/BACKEND_ARCHITECTURE.md` describes an earlier Supabase-centric design
  and is not an accurate inventory of the current owned backend.

These are specification differences to resolve with the project owner; they
do not, by themselves, imply that the existing implementation needs rewriting.

## 2. Phase 1 backend: what has been implemented

Here, **implemented** means routes and business logic exist in the reviewed
source. It does not mean live-provider validation or client acceptance has passed.

| Proposal capability | Backend implementation | Remaining qualification |
| --- | --- | --- |
| Database foundation | Module schemas, foreign keys, indexes, constraints, seeds and 11 SQL migrations (`0000`-`0010`) | Fresh migrations run in embedded PostgreSQL tests; deployed upgrade/restore paths still need validation |
| Registration/login/logout | Password hashing, database sessions, login lockout, cookie handling, session revocation | Exercise the complete browser/session journey on staging |
| Email verification/password reset | Hashed, expiring token creation and token-consumption endpoints; password reset revokes sessions | Account-email delivery is not connected; frontend token contract also differs |
| Profiles and addresses | Owner-scoped profile read/update and address CRUD | Connect and verify customer UI persistence |
| Catalogue | Categories, brands, products, variants, SKU prices, images, attributes, ingredients, availability | Real catalogue data and complete admin/UI integration still required |
| Search/filter/sort | Product query endpoint, category/brand filters, search, stock filtering and pagination | Verify actual catalogue access paths, slug handling and sort correctness against PostgreSQL |
| Stock management | Movement ledger, reservations, expiry/release, location-scoped balances and stock-pool isolation | Staging multi-connection oversell/locking verification still required |
| Guest/authenticated carts | Persistent database carts, item updates/removal, guest-session ownership and merge-on-login service | Storefront persistence and error handling are not complete just because these APIs exist |
| Checkout | Server-owned prices, order/item snapshots, address checks, stock reservation, discounts and idempotency | Validate retries and the full retail purchasing journey |
| Orders/history/status | Owner reads, guest-email lookup, history, guarded status transitions and admin order APIs | Customer-facing order numbers and internal UUID lookup need alignment |
| Payments | Stripe, Flutterwave and Opay adapters; manual transfer claims; signature checks and server verification | Live/test merchant validation, callback UX and settlement recovery remain |
| Refunds | Provider refund requests, cumulative amount checks, order/commission effects | Provider acceptance versus completed refund must be reconciled reliably |
| Transactional notifications | Outbox and SMTP sender for order-created, paid and shipment messages | Real SMTP verification, worker recovery, and account-message templates/workflows remain |
| Administration | Permission-gated catalogue, inventory, users, orders, claims, review/loyalty, audit and network endpoints | Backend endpoints do not establish a complete usable admin product |
| Operational foundation | Health/readiness routes, request/error envelope, origin checks, CORS, security headers, rate limits and error-reporting adapter | Production configuration, deployed monitoring and operational validation remain |

Primary evidence: `backend/src/modules/{auth,users,catalog,inventory,cart,orders,payments}/`,
`backend/src/lib/{admin,permissions,errors,cookies,email,providers}.ts`, and
`backend/src/app/api/`.

### Current core commerce logic

1. Resolve the customer or guest cart.
2. Validate checkout input and replay identity/fingerprint.
3. Read prices from product variants, rather than accepting browser totals.
4. Select an eligible fulfilment location for the complete bag.
5. Calculate delivery and eligible discounts on the server.
6. Transactionally create the order, items/history and stock reservations.
7. Initialize hosted payment or the manual-transfer workflow.
8. Verify provider payment server-side; settle the order and inventory.
9. Credit eligible retail loyalty/commissions and enqueue notification work.

Recent changes also reacquire expired stock holds at the original location
before settling late payments. This is implemented logic, not merely a roadmap.

## 3. Phase 2 backend: what exists and what is missing

| Proposal capability | Current backend state |
| --- | --- |
| Customer behaviour/event tracking | Recently-viewed products and creator click counters exist, plus payment/audit/outbox records. A general product-view/search/cart/checkout/purchase event model and ingestion path were not found. These records are not interchangeable with customer event tracking. |
| AI skin/face analysis | Consent/version fields, upload reservation, signed storage URLs, size/type/magic-byte checks, owner-scoped analysis records and result validation exist. Actual image-to-model analysis is missing: the provider receives profile hints, not the uploaded image. |
| AI product assistant | Conversation/message persistence, a mock/Gemini provider interface, keyword catalogue grounding, output length limits and quotas exist. Stock eligibility and grounding enforcement require more work. |
| Recommendations | Rule-based concern matching over active catalogue products, with stock filtering, exists. Brand-approved eligibility/suitability rules and behaviour-based personalization remain. |
| Loyalty | Account, transaction ledger, paid-order earning, voucher redemption and admin adjustments exist. Guest voucher ownership, cancellation/refund treatment and client business rules need closure. |
| Reviews/moderation | Review creation, server-computed purchase badge, moderation, helpful votes and rating aggregation exist. Final eligibility rules and storefront contract/persistence need validation. |
| Shipping integration | Shipping zones/fees, shipment records and staff-entered tracking events exist. Naming a shipment provider `gig` or `dhl` does not call that provider's API; aggregator booking/tracking integration is missing. |
| Abandoned-cart automation | Worker selects registered-user carts after 24 hours and checks a seven-day outbox dedupe window. Activity timestamps and eligibility/deduplication need correction before relying on it. |
| Inactivity campaigns | No dedicated implemented workflow found. |
| Post-purchase engagement | Paid-order side effects and transactional notifications exist. Delayed review requests, complementary-product campaigns and their eligibility rules are not implemented. |
| Newsletter/marketing/segmentation | No subscriber/marketing-consent lifecycle, segmentation engine or newsletter provider workflow found. |
| Expanded admin permissions | Named permissions, role grants/revocations and audit infrastructure exist. |
| WhatsApp handoff | Frontend deep links and a backend Termii messaging adapter exist. This is not proof of a deployed support-handoff workflow or full WhatsApp Business automation. |
| Blog/content | No blog/content backend found. |
| Collaboration/distributor applications | Creator/distributor applications and staff approval services exist; partner operations have expanded substantially. |

Primary evidence: `backend/src/modules/{skin,ai,loyalty,reviews,shipping,notifications}/`,
`backend/src/lib/ai-provider.ts`, `backend/src/lib/storage.ts`, and
`backend/src/worker/tasks.ts`.

## 4. Additional partner and wholesale work in the latest snapshot

There is substantive code beyond the proposal's basic application workflows:

- **Fulfilment routing:** city/state matching, full-bag stock checks, delivery
  versus pickup, preferred location and HQ fallback.
- **Distributor operations:** account-owned locations/orders, restock requests,
  stock dispatch/receipt and short-lived pickup collection codes.
- **Creator attribution:** configured codes/rates and sales metrics derived from
  verified attributed orders.
- **Partner earnings:** balanced journal postings in kobo, pending/available/held
  balances, commission hold/release and proportional refund reversals.
- **Payout administration:** verified bank records, withdrawal holds and
  reconciliation evidence. Approval does not automatically transfer money.
- **Wholesale purchasing:** tier price books, carton minimums, server-priced
  quotes, invoice/order creation, hosted payment, receipt confirmation, direct
  sales and physical-return handling.
- **Inventory separation:** `PLATFORM` stock fulfils retail orders; `WHOLESALE`
  stock belongs to the distributor for direct resale.

Evidence: `docs/PARTNER_NETWORK.md`,
`backend/src/modules/{routing,partners,ledger,wholesale}/`,
`backend/src/modules/inventory/transfers.ts`, and migrations `0009`/`0010`.

These capabilities extend the written proposal, which explicitly excludes
multi-warehouse inventory unless separately agreed. Their inclusion and
acceptance criteria need to be reconciled with the agreed scope. Their presence
does not replace unfinished Phase 1 or Phase 2 requirements.

## 5. Concrete gaps to close

### A. Account emails are not delivered by the auth flow

`backend/src/app/api/auth/register/route.ts` and
`backend/src/app/api/auth/request-password-reset/route.ts` issue tokens and
optionally echo them in development. They do not send or enqueue account emails.
`backend/src/lib/email.ts` has commerce templates, not the missing verification
and reset workflow. The token service uses long random tokens; the reviewed
auth UI uses four-digit inputs. This requires implementation, not just SMTP keys.

### B. Payment return does not complete the storefront return contract

`backend/src/app/api/payments/return/route.ts` verifies payment and returns JSON.
The storefront return handler expects a `?pay=` entry back into the application.
A normal hosted-payment callback therefore needs an explicit, coherent return
and order-recovery flow, including guest identity after navigation/reload.

### C. Webhook receipt and successful settlement are conflated

The webhook routes record a deduplication event before settlement. On replay,
they report `settled: true` without checking whether settlement previously
succeeded. The Stripe handler acknowledges settlement errors with HTTP 200.
The worker has no payment-event reconciliation task. A temporary verification
or database failure can consequently strand a paid transaction.

Evidence: `backend/src/app/api/webhooks/{stripe,flutterwave,opay}/route.ts`,
`backend/src/modules/payments/service.ts`, `backend/src/worker/tasks.ts`.

### D. Image analysis is not connected to the image

`completeAnalysis()` validates the uploaded object, but calls
`getAiProvider().analyze()` with only `skinTypeHint` and `concernHints`.
`GeminiProvider.analyze()` builds a text-only prompt. A Gemini key alone does
not turn this into face analysis. The customer scan screen also uses preset
results rather than this upload/complete API workflow.

### E. Automation activity and recovery are incomplete

- Abandoned-cart eligibility reads `carts.updatedAt`, while the inspected cart
  mutations update cart-item timestamps rather than refreshing the parent cart.
- The reminder dedupe is a read-before-insert check, not a durable unique
  business-event key; concurrent workers need a stronger guarantee.
- Outbox claims change rows to `sending`, but no stale-claim lease/recovery was
  found. A crash after claiming can leave work stuck.
- Marketing eligibility/opt-out handling and inactivity/post-purchase campaigns
  are still absent.

Evidence: `backend/src/modules/cart/{schema,service}.ts`,
`backend/src/modules/notifications/service.ts`, `backend/src/worker/tasks.ts`.

### F. Additional contracts and rules need focused verification

- `catalog/service.ts:getProduct()` and `reviews/service.ts:resolveProductId()`
  compare a slug-or-ID input directly against both text and UUID columns. A
  non-UUID slug can fail PostgreSQL UUID conversion. Select the lookup branch
  by input type and add real query coverage; this was identified from source,
  not reproduced through a deployed endpoint during this review.
- Guest order lookup service expects an internal order UUID while the customer
  lookup screen submits the displayed `DES-...` order number.
- `ai/service.ts:groundProducts()` filters active products but does not join
  stock availability or require an active variant. Its text response is not
  post-validated to prevent out-of-catalogue recommendations.
- `loyalty/service.ts:consumeVoucher()` checks ownership only when a user ID is
  supplied; guest redemption requires an explicit ownership policy/enforcement.
- Refund API acceptance is currently treated as successful completion in the
  provider workflow. Reconcile asynchronous refund outcomes before applying
  final financial/fulfilment effects.

### G. Deployment is scaffolded, not established

- Workflow YAML files are inside the application subdirectory's `.github/`,
  while the Git root is one level above. GitHub Actions requires workflows at
  the actual repository root. The backend workflow paths also assume a
  different repository layout.
- Frontend deployment steps are largely commented placeholders. Vercel
  configuration deploys the SPA, not a complete backend/worker/database stack.
- Compose provides development PostgreSQL/Redis/MinIO/MailHog only.
- The backend Dockerfile copies `/app/public`, but no `backend/public/` was
  present in the inspected tree; validate/fix the image build.
- Staging secrets, provider callbacks, SMTP, storage buckets, worker supervision,
  database backups/restores and production monitoring need actual verification.

Evidence: `.github/workflows/`, `vercel.json`, `docker-compose.yml`,
`backend/Dockerfile`, `docs/STAGING.md`.

## 6. Checks actually executed

| Check | Result |
| --- | --- |
| `npm run typecheck` in `backend/` | Passed, including a rerun after the new backend additions |
| `npm test` in `backend/` | Latest run: **94 tests passed in 17 files** |
| Embedded PostgreSQL coverage | Nine tests across `partner-network-pg.test.ts` and `wholesale-pg.test.ts`; covers fresh migration execution and selected inventory, ownership, replay, payment/refund and commission paths |
| `npm run build` in `backend/` | Compilation, type validation and static-page generation completed; process timed out after 180 seconds during build-trace collection. **Not a completed successful production build** |
| Earlier storefront `npm run build` | Passed on the earlier frontend snapshot; large single JS chunk reported. Frontend subsequently changed, so this is not a verification of its latest state |

The initial backend run had 77 tests; the later 94-test run supersedes it.
Provider HTTP calls in these tests are mocked. PGlite is an embedded PostgreSQL
engine, not a deployed multi-connection PostgreSQL server. No live payment,
SMTP, shipping-provider, Gemini-image or deployed browser purchase flow was
verified in this review. Docker and `psql` executables were not available on PATH.

## 7. Recommended completion order

1. Close Phase 1 service gaps: account emails/token contract, slug/order lookup,
   payment return, webhook recovery and refund reconciliation.
2. Complete storefront/API persistence and admin workflows; ensure real errors
   and empty results are not replaced with fabricated operational data.
3. Deploy the API, PostgreSQL, storage and supervised worker to staging using a
   corrected repository pipeline; finish the production image/build validation.
4. Demonstrate guest and registered test purchases, retries, late payments,
   insufficient stock, cancellations/refunds, account recovery and staff access.
5. Complete Phase 2 event capture, real image-to-model analysis, recommendation
   eligibility, shipping-provider integration and customer-engagement workflows.
6. Validate the expanded partner/wholesale scope separately against its agreed
   business rules, including multi-connection money/stock concurrency tests.

**Bottom line:** substantial backend engineering is present. Phase 1 acceptance
is still blocked by concrete completion/integration work, and Phase 2 is partly
implemented. The next milestone should be a verified core commerce system on
staging, followed by completion of the agreed intelligence and automation layer.

## 8. Fixes applied 2026-10-02 (skills: api-design, data-storage, resilience-failure, messaging-streaming, observability)

Skills deployed as design reviewers, not as code generators: contract shapes and
retry/recovery rules come from `api-design` + `resilience-failure`, persistence
and lookup rules from `data-storage`, async outbox/worker rules from
`messaging-streaming`, and health/readiness signals from `observability`.

| Problem from §5 | Fix applied in this pass | Files |
| --- | --- | --- |
| A. Account emails missing + 4-digit UI vs long-token backend | Transactional outbox enqueue for `auth.verify-email` / `auth.reset-password` with SMTP worker templates; frontend now uses secure token paste + dev echo, demo bypass preserved | `backend/src/lib/email.ts`, `backend/src/app/api/auth/register/route.ts`, `backend/src/app/api/auth/request-password-reset/route.ts`, `backend/src/modules/auth/service.ts`, `backend/src/worker/tasks.ts`, `src/screens/ScreenAuthSuite.tsx` |
| B. Payment return JSON vs `?pay=` SPA contract + lost guest email | Return route 302-redirects browsers to `FRONTEND_URL/?pay=reference`; JSON preserved for API callers; guest email + reference persisted for return polling | `backend/src/app/api/payments/return/route.ts`, `src/context/AppContext.tsx` |
| C. Webhook receipt conflated with settlement, no recovery | Duplicate receipts now check `payments` ledger via `isReferenceSettled`; transient settle errors return 500 for provider retry; new `reconcilePayments` worker sweep | `backend/src/modules/payments/service.ts`, `backend/src/app/api/webhooks/{stripe,flutterwave,opay}/route.ts`, `backend/src/worker/tasks.ts` |
| F1. Slug vs UUID lookup can fail PG UUID cast | Branch lookup by UUID regex vs slug; no dual-column OR | `backend/src/modules/catalog/service.ts`, `backend/src/modules/reviews/service.ts` |
| F2. Guest lookup expects UUID, UI shows `DES-...` | Owner/guest lookup accepts UUID or `orderNumber`; identical 404 preserved | `backend/src/modules/orders/service.ts` |
| F3. AI grounding ignores stock/active variant | Grounding requires active variant + `PLATFORM` available stock | `backend/src/modules/ai/service.ts` |
| F4. Guest voucher ownership bypass | Voucher redemption now requires login and strict ownership | `backend/src/modules/loyalty/service.ts` |
| E. Cart `updatedAt` never touched; outbox `sending` can strand; abandoned-cart race | Touch parent cart on every mutation/merge; outbox claim uses 10-min lease + `recoverStaleSending`; abandoned-cart sweep uses per-cart advisory lock | `backend/src/modules/cart/service.ts`, `backend/src/modules/notifications/service.ts`, `backend/src/worker/tasks.ts` |
| G. CI never runs; Docker `public/` missing | Root `.github/workflows/ci.yml` added (frontend + backend + gitleaks); `backend/public/.gitkeep` ensures Docker COPY succeeds | `.github/workflows/ci.yml` at repo root, `backend/public/.gitkeep` |

Checks after fixes: `backend npm run typecheck` passed; `backend npm test` **94 passed in 17 files**; frontend `npm run build` passed. Production Docker build and live provider/SMTP/staging validation remain open, as do image-to-model AI, shipping-provider APIs, newsletter/segmentation, and multi-connection concurrency proof.

## 9. Disconnect + hardening pass 2026-10-03 (new stack: Vite SPA + Next.js API + Postgres/Drizzle)

No dedicated `cybersecurity` skill is installed; hardening was applied directly
with `api-design`, `data-storage`, `resilience-failure`, `observability`
(`find-skills` checked, no trusted security skill recommended without vetting).

Disconnect boundary enforced:

- Code: backend has zero imports from `src/`; frontend talks only via
  `VITE_API_URL` + version-stable `/api/*` JSON contract (`src/lib/owned-api.ts:7-31`).
- Runtime: backend boots standalone via `backend/src/lib/env.ts` (`getDb()` fail-fast);
  production requires `DATABASE_URL`, `APP_URL`, `FRONTEND_URL`, real payment secrets,
  S3 keys. No frontend files needed.
- CORS: exact-origin allowlist only, credentials, `Vary: Origin`
  (`backend/src/middleware.ts:32-50`). `enforceOrigin()` now fails closed in
  production when allowlist is empty (`backend/src/lib/errors.ts:127-146`).
- Frontend demo backdoors hidden in prod: `RequireRole.tsx` simulate block is
  `import.meta.env.DEV`-only; `ScreenAuthSuite.tsx` demo switcher hidden when
  live backend in production (`setSimulatedUserRole` was already no-op when
  `isOwnedApiConfigured`).

Security layers soundproofed in this pass:

- Headers: `CSP default-src 'none'`, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`,
  `HSTS`, `poweredByHeader: false` (`backend/next.config.mjs:5-21`).
- Auth atomicity: `register()` user+role+token in one transaction
  (`backend/src/modules/auth/service.ts:78-92`); no orphan users.
- Order ID hardening: malformed UUIDs return 404, never PG 22P02 500
  (`backend/src/modules/orders/service.ts:103-107`).
- Abandoned-cart race: check+dedupe+enqueue now share one transaction holding
  `pg_advisory_xact_lock` (`backend/src/worker/tasks.ts:193-212`).
- Validation already strict (Zod `.strict()`, 1 MB JSON / 256 KB webhook caps,
  magic-byte uploads); no `eval`/`dangerouslySetInnerHTML` found in `src/`.

Still left for the new stack:

1. Live staging proof with real Postgres, S3, SMTP, Termii, Stripe/FLW/Opay test keys, worker `--once` + loop, backup/restore drill.
2. Real image-to-model vision (today `skin/service.ts:73-76` uses hints only), shipping carrier APIs, newsletter/segmentation, post-purchase/inactivity campaigns.
3. Shared rate-limit store (current limiter is in-process; multi-instance bypass), WAF/Turnstile at edge, Sentry DSN + alerts, `backend/public/` real assets vs `.gitkeep`.
4. Remove legacy inner `.github/workflows/` duplicate now that root CI is canonical; add production Docker build + migration gate to pipeline.
5. Frontend bundle split (1.36 MB JS warning) + URL-token deep links for emailed verify/reset URLs.
