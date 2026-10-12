# Desla verification, journey and UI audit

Date: 2026-10-10. Scope: the current working tree, including the Next.js migration and subsequent performance, payment and resilience changes.

## Verdict

**Not all green; not ready for production sign-off.** There is substantial real implementation and a passing service test suite. The storefront integration, recovery paths and some later hardening changes are incomplete or defective. Earlier statements that the migration was complete, every journey worked, and the code side of the directive was fully implemented were too strong.

This audit does not certify a live deployment. It does not treat comments, HTTP 200s, mock data or service-only tests as evidence that a customer can complete a purchase.

Paths below are relative to this application directory. Repository-root CI and deployment files are one directory above it.

### Correction log (fixes verified after the first pass)

- **Navigation works.** The reported `router.push` no-op was an artifact of testing against a stale `next start` squatter (PID 31592, bound since 06:30, serving an older build) — not a code defect. On a verified-fresh production build, BottomNav Shop click navigates `/cart` → `/catalogue` within 1s with zero console errors. Always verify the probe server owns its port (Ready log + marker request) before trusting browser results.
- **Demo gating verified in production.** Fresh visitor: empty bag ("Your Shopping Bag is Empty"), `/order-confirmed` renders an honest "No order here yet" state (screenshot `final-order-confirmed-390.png`). No invented purchases, points, or tracking references. Residual: `checkoutAddress`/`userProfile` still carry editable mock defaults; profile/loyalty mocks remain.
- **Environment hazard (process finding).** Files in this tree changed outside the audit session (timestamps prove concurrent writes; a `- Copy/` directory and `desla/` folder exist). Combined with squatter servers, this means: re-verify file state before trusting earlier reads, pin probe ports, and confirm server ownership. Nothing here was committed during this audit (branch still 5 ahead, work uncommitted).

## Verification actually performed

| Check | Result |
|---|---|
| Git state/history | `main`, 5 commits ahead of origin; extensive modified and untracked work. Ownership of that work is mixed; it has not been discarded. |
| `backend: npm run typecheck` | **Failed:** `src/app/actions/catalog.ts:16` imports nonexistent `queryProducts`. |
| `backend: npm run build` | JavaScript compilation completed, then **failed** at the same TypeScript error. No current production build was certified. |
| `backend: npm test` | **166 passed, 2 skipped**; 32 test files passed, 1 skipped. |
| `backend: npm audit --omit=dev --audit-level=high` | **Failed:** registry reports Next.js moderate cache-poisoning advisories, high `source-map-js`, critical `shell-quote`. Reachability/exploitability was not separately established. |
| Root Vite `npm run build` | **Blocked by environment:** requires an HTTPS `VITE_API_URL`. This is distinct from the Next TypeScript defect. |
| Local Chromium, normal development CSP | `/cart`, `/checkout/payment` and `/order-confirmed` returned 200 but development JavaScript was blocked by CSP. Client screen content did not load. |
| Local Chromium, diagnostic CSP bypass | Reproduced broken navigation, hydration errors, demo cart/confirmation, missing local-transfer choice, small controls and unassociated form labels. The bypass is a diagnostic condition, not a passing security or production test. |
| Local disposable PGlite fault/recovery probes | Reproduced partial cart replacement, Stripe flag/retry lockout and incorrect stock filtering. |

Runtime: local Node 24.21.0; Next 15.5.26; React 19.3.0. CI/Docker target Node 20, so this local runtime is not a deployment-equivalent test.

The two skipped tests require `TEST_DATABASE_URL`. The test named “ten concurrent checkouts” calls `reserveStock`, not the entire cart/checkout/payment journey (`backend/tests/concurrency-pg.test.ts:34–53`). PGlite cannot establish multi-connection lock correctness. Live gateway transactions, production load, recovery drills and authenticated production dashboards remain unverified.

Diagnostic artifacts for this session are under `C:\Users\HP\AppData\Local\Temp\opencode`:
- `desla-runtime-audit.json`, `desla-runtime-server.log`: normal CSP pass.
- `desla-diagnostic-audit.json`, `desla-diagnostic-server.log`: explicitly CSP-bypassed UI inspection.
- `desla-diagnostic-*.png`: screenshots at 390px and 1440px.
- `desla-domain-audit.mts`: isolated fault/recovery probes, using only an in-memory database and fake provider responses.

## 1. What is genuinely implemented

| Area | Evidence and classification |
|---|---|
| Modular monolith | **Implemented.** Next routes/actions reuse Drizzle domain services; no replacement ORM or distributed service rewrite is necessary. |
| Order pricing and reservation | **Implemented, service-tested.** Checkout loads variant prices, locks the cart/stock, binds idempotency to owner/request, and creates order/reservations transactionally (`modules/orders/service.ts`). |
| Payments | **Implemented, partially verified.** Flutterwave/Stripe/Opay adapters, manual-transfer claims, provider verification, event ledger and reconciliation exist. Gateway HTTP in tests is mocked. Several recovery defects remain below. |
| Authentication/authorization | **Implemented, partially verified.** Hashed sessions, secure production cookies, server permission/ownership checks and reset revocation exist. Session cap is not atomic rotation; MFA is not delivered. |
| Worker/outbox | **Implemented.** Database claiming, retries, failed state, lease recovery and sweeps already exist. No need to add a separate queue merely to claim a queue exists. Operational visibility and concurrency guarantees remain incomplete. |
| Next storefront | **Partial/broken integration.** Route files exist and selected screens can render server HTML, but primary navigation remains the old state-switch mechanism. |
| Images/detail cache/catalog SQL sort | **Implemented, partially correct.** Responsive image wrapper, request dedupe/TTL and SQL sorting exist. Remote-image configuration and stock-filter equivalence are broken. |
| Metrics/bulkheads/feature flags | **Partial.** Counters and local limiters exist; they do not establish measured SLOs, reserve checkout connections, or implement percentage rollouts. |
| Deployment cutover | **Not complete.** Both Vercel configs still build Vite. `FROZEN.md` is a convention, not a deployment change. |

## 2. Release-blocking integration findings

### F01 — Fixed and verified

Was: `backend/src/app/actions/catalog.ts` imported nonexistent `queryProducts`; typecheck and build failed. **Now: the module uses the real `listProducts` service; `npm run typecheck` and `npm run build` pass on the current tree (93/93 static pages).** Residual from the original note still stands: shelf queries should gain runtime query validation, and routine "curation" verifies products and revalidates without persisting a routine — changing the imported name was necessary but not sufficient acceptance for those features.

### F02 — Next navigation is not actually connected

**Verified in browser and source.** `backend/src/storefront/context/AppContext.tsx:457–517` uses React state and `history.pushState` with `?screen=...`. Next page selection uses pathname. `screen-routes.ts` describes `router.push` and the context now calls it (corrected — see Correction log; earlier failure was a stale-server artifact).

Reproduction: load `/cart` at 390px, click “Shop Catalogue”. URL becomes `/cart?screen=catalogue`; header and active tab switch to Catalogue, while the body stays **Shopping Bag**. A fresh `/cart` also marks Home active.

Verified fix: BottomNav Shop click navigates `/cart` → `/catalogue` within 1s on a fresh production build, zero console errors. Remaining: back/forward multi-step and refresh coverage want a small Playwright suite on staging; filter/search URL round-trip is code-reviewed, not click-tested.

### F03 — Real-looking demo state leaks into live shopping

**Verified in browser and source.** `AppContext.tsx:290–409` seeds products, a two-item cart, orders, a profile and address regardless of live mode. Catalogue failures fall back to sample data. Cart content is React state rather than restored durable cart data.

Reproduction: a fresh browser shows a ₦43,500 sample cart and an example customer's address. Direct `/order-confirmed` shows a sample order, Stripe Paid, +510 points, a tracking reference and delivery promises without a verified purchase.

Fix applied and verified: demo seeds are opt-in (`NEXT_PUBLIC_DEMO_SEED=1`, dev-only); fresh production visitors get an empty bag, empty wishlist/orders, and an honest “No order here yet” confirmation page (screenshot `final-order-confirmed-390.png`). Remaining: `checkoutAddress`/`userProfile` still carry editable mock defaults; catalogue still falls back to sample data when the DB is unreachable (documented tradeoff, not silent success); guest cart/checkout still live in React state only — persist and restore safely (server cart exists; wire restore on load).

### F04 — Image migration is incomplete

**Verified runtime error.** `ProductImage.tsx:35` routes every image through `next/image`, including Unsplash URLs in `storefront/data/products.ts:15`. `backend/next.config.mjs:17–21` has no `remotePatterns` for those sources.

Local `/catalogue` logged `Invalid src prop ... images.unsplash.com ... not configured`. The streamed response still reported 200. Testing only one local JPEG endpoint did not prove the gallery/grid worked.

Fix: validate the actual catalog image sources, configure narrow approved remote patterns or serve owned assets, test broken-source fallback, and reset image error state when `src` changes. Preserve the QuickModal image padding/crop: `fill` positioning currently ignores the original inner padding.

### F05 — Hydration and development CSP are broken

**Verified browser errors.** The production-style `script-src` also applies to development, blocking Next's eval-based development scripts (`next.config.mjs:43`). With CSP bypassed for diagnosis, React reports hydration mismatches.

Sources: viewport reads `window.innerWidth` during initial render (`ViewportContext.tsx:16–18`); brand loader reads/writes sessionStorage during render (`InitialBrandLoader.tsx:5–13`); online status reads browser-dependent navigator state (`OfflineStatusBanner.tsx:5–7`). These can differ from server HTML.

Fix: deterministic server/client initial state, browser state after hydration or CSS-based responsiveness, and environment-appropriate CSP. Test return visits as well as first visits. Scope remote connection permissions for actual uploads/error reporting; do not broadly relax production CSP as a workaround.

## 3. Commerce and security findings

### F06 — Cart sync is not atomic

**Reproduced in a disposable database.** `actions/_shared.ts:138–146` clears the cart, commits each add separately and verifies afterwards.

Fault probe: initial `[audit-old ×4]`; inject a DB failure on the second new line; result is `[audit-a ×1]`. Original cart is lost, although sync failed. Concurrent syncs/transport retries can interleave as well. `action-client.ts:25–27` automatically falls back on transport failure, which is ambiguous after a server commit.

Fix: atomic, owner-locked replace-cart service with validated exact variant IDs, bounded input and a request/version identity. Checkout must consume the intended cart version. Prove rollback and concurrent replacement with real PostgreSQL.

### F07 — Stripe kill switch strands attempts

**Reproduced.** `payments/service.ts:102–146` persists an attempt before checking the Stripe flag at `:187`. Flag off returns 503 but leaves `status=initiated`. Re-enable and retry the same key: `:150` returns 409 forever for that attempt; no provider call occurs.

Fix: check eligibility before claiming a new attempt; define disabled/not-started versus uncertain-provider states and retry transitions. A kill switch should stop new charges while allowing reconciliation/refunds of existing charges.

### F08 — Provider retry recovery is incomplete

**Source-verified.** Stripe session creation and refunds omit Stripe `Idempotency-Key` (`lib/providers.ts:158–174,266–274`). A timeout can leave an initiated attempt without `providerRef`. The Stripe webhook receives the session ID but does not pass it into settlement (`api/webhooks/stripe/route.ts:30,55`). The worker cannot retrieve a Stripe session when neither return processing nor initialization saved its ID.

Fix: persist stable provider operation identities, supply provider idempotency keys, recover the authenticated webhook session ID, and test lost responses/DB acknowledgments, duplicate events and secret rotation. Current signature parsing keeps only the last `v1`; support multiple valid signatures during rotation. Recheck Flutterwave signature encoding against the merchant's current official contract, then run sandbox transactions.

Stripe currently charges NGN; “international cards” is not an implemented multi-currency/FX system. Confirm merchant/currency support in the real account before promising additional currencies.

### F09 — Payment choices and totals do not form one flow

**Verified browser and source.** Both checkout screens independently initialize gateway state to Flutterwave. `Screen10Checkout.tsx:135–144` saves the address but does not carry the gateway selection. `Screen11Payment.tsx:35` offers only Flutterwave/Stripe; there is no path to `prepareLiveCheckout('transfer')` or bank-details UI in these screens.

Cart and payment calculate amounts differently: the fresh cart displayed ₦45,000 including ₦1,500 delivery; payment displayed ₦43,500 total alongside that same delivery line. This is a UI/quote inconsistency, not evidence that server pricing is trusted from the browser.

Fix applied and partially verified: gateway choice is shared via context (`selectedGateway` in `AppContext`, used by both checkout screens); a bank-transfer tab, account-details panel and proof CTA exist on the payment screen; transfer tab selection verified in-browser (selected ring applied, escrow copy switches). Bank-details population needs a live backend (unavailable in this environment). Server quote remains authoritative at checkout; the payment-screen totals shown pre-fulfilment are still display estimates — keep server totals as the contract.

### F10 — Stock filter counts inventory that is not retail-available

**Reproduced.** `catalog/service.ts:148–157` aggregates all stock pools/locations. `inventory/service.ts:18–20` only counts PLATFORM stock at active locations. Price-sort `inStock=true` returned a wholesale-only product with `totalAvailable=0`; newest returned none.

Fix: one availability definition shared by filtering, sorting and hydration. Test wholesale-only, inactive-location, inactive-variant, all-reserved and multi-location cases. Newest stock filtering also happens after pagination (`catalog/service.ts:224–234`), so pages may be underfilled. Harden cursor values before SQL date/numeric casts.

### F11 — Mutation success can be fictional

**Source-verified.** Review/wishlist/community/skin wrappers await actions but ignore `{ok:false}` and swallow transport failures (`storefront/lib/owned-api.ts`, e.g. review at `:638–645`). The screen still updates local state. Those services differ in retry semantics: setting wishlist state/upserting a profile can be idempotent; creating a review or toggling a like is not inherently so.

Fix: await meaningful receipts, preserve drafts, show pending/saved/failed states, roll back optimistic state when needed, and add stable idempotency for creation/redemption where retries are offered. Reuse transport-neutral validation; REST review UUID-only validation still differs from the slug-tolerant action. Existing engagement tests mainly exercise services, not the action/auth/UI boundary.

### F12 — Dependency, session and authorization verification gaps

- The dependency audit currently fails; use reviewed compatible patches and rerun image/build/browser checks rather than blind dependency upgrades.
- Session capping and insertion are separate operations (`auth/service.ts:196–232`); parallel logins can exceed the cap. Capping old sessions is not rotation/revocation of the caller's previous cookie. The new tests are sequential.
- Some action inputs have TypeScript shapes but incomplete runtime validation, e.g. wishlist boolean/size and catalog shelf query limits.
- Rate-limit budgets are still different across transports: `checkout:<ip>` versus `action:checkout:<user>`; many engagement budgets are process-local. There is no single cross-replica, cross-transport policy.
- MFA, comprehensive object-level denial tests and browser authentication recovery remain incomplete. Server permission checks are real; client preview roles are not authorization.

## 4. Rendering, operational and maintainability findings

### F13 — ISR/cache freshness is not end-to-end

`app/layout.tsx:16` loads the full catalog for every page, including auth/admin. Home/catalogue/product pages load it again. Product metadata repeats product reads. Each seed can read up to 500 products and is passed to the client. No shared request-level memoization is present here.

`seedCatalogue` ignores later seeds once applied (`AppContext.tsx:528–535`), so router refresh/revalidation does not establish that mounted client state is fresh. `revalidatePath` does not invalidate the independent CDN-cached products response or the browser detail Map. Stock expiry, refunds and all mutation transports need a documented freshness policy.

`getProductSeed` conflates DB failure with missing product. When no seed exists, `/products/[slug]` skips `notFound()` and can render an unrelated sample product. Absolute remote OG images are incorrectly prefixed with `APP_URL` (`products/[slug]/page.tsx:32–35`).

Fix: page-scoped bounded data, request dedupe, explicit unavailable/not-found states, canonical metadata, and a policy separating cached editorial data from live prices/availability. Server checkout remains authoritative.

### F14 — Same-origin API configuration has a real URL bug

`owned-api.ts:163` calls `new URL('/api/products')` when BASE is the default empty string; without a base this throws before fetch. Similar admin list builders exist. Catching the error hides it as a fallback. `storefront/lib/env.ts:14–24` uses dynamic `process.env[key]`, which Next does not inline as public browser configuration.

Fix: use relative fetch URLs/URLSearchParams or supply a real base; use explicit public env references. Prefer same-origin transport for the unified app.

### F15 — Timeout and bulkhead claims exceed their guarantees

`withTimeout` is `Promise.race` and does not cancel database/provider work (`actions/_shared.ts:54–71`). It bounds caller waiting, not work or connections. `providers.ts:50–57` clears the network timer before consuming the JSON body. DB client has a 20-connection pool but no statement/lock deadlines (`db/client.ts:23–27`).

Bulkheads limit some endpoint handlers per instance; they do not reserve connections. Six chat + eight recommendation + four scan requests is not proof of 18 connections used: one request can issue parallel queries, and auth happens before admission. All domains still share the pool. Metrics do not expose `bulkheadDepth`.

Fix: real cancellation/dependency deadlines and short transaction/lock deadlines; weighted/aggregate admission for expensive work; explicit connection budgets across app replicas, workers, deploy overlap and operational reserve. Keep local bulkheads, but measure saturation before claiming checkout isolation.

### F16 — Observability and SLOs are proposals, not measured service objectives

The metrics endpoint reports four query durations together, recent counts, active sessions and process memory (`api/admin/metrics/route.ts:24–59`). That is not pool utilization, pure DB round-trip latency, p95/p99 or checkout success rate. A backlog older than 24h disappears from `outbox24h`. Responses are `private`, not edge-cacheable as the comment claims.

`docs/SLO.md` requires backlog age, settle lag and checkout latency, but current instrumentation does not collect them. No documented executed restore drill, alert delivery, RPO/RTO or representative load test was verified.

Fix: collect latency histograms, attempt/success denominators, oldest pending age, worker heartbeat/lease failures, reconciliation lag and pool pressure; protect metrics; then wire dashboards/alerts and run restore/load drills. High query-batch latency alone does not prove region distance. Co-location should be verified from deployment topology and separate network measurements.

### F17 — Some new audit writes are non-atomic

Profile/address writes commit before `audit()` (`api/me/profile/route.ts:19–21`, `api/me/addresses/route.ts:19–20`). Audit failure can return an error after a successful mutation. Address-create audit includes city/state values, contrary to the earlier “field names only” description.

Refund reconciliation already audited inside the payment service; the extra route audit adds another failure point after the transaction. Pass correlation context into the existing transactional audit rather than duplicating it.

### F18 — Deployment and evidence debt remain

`../vercel.json:2–5` and the application's `vercel.json` still target Vite. Seed scripts import the old root data. CI configuration exists but its current successful execution was not verified, and much implementation is untracked. New files must be included in a reviewed release.

`PERF-BUDGETS.md` contains an unsupported fixed PGlite-versus-Postgres slowdown multiplier and no after-rewrite benchmark. A single local timing is not p95. Shared First Load JS is only the shared chunk subset, not all JavaScript a route downloads. Keep those budgets as targets until measured.

## 5. Frontend/UI audit

### What to preserve

The white/charcoal/gold palette, product imagery, desktop split cart layout and black primary checkout button form a coherent visual direction. In the inspected 390px and 1440px cart views there was no horizontal overflow. Several icon controls already have accessible names. Guest shopping is visibly offered on login. These are useful foundations.

### Findings ordered by customer impact

| Finding | Evidence | Smallest design correction |
|---|---|---|
| Navigation lies about location | Browser: Catalogue header/tab with Cart body | One URL-driven location model; real navigation links. `rule/navigation-vs-action`, `rule/preserve-mental-model`. |
| Unverified success/trust claims | Direct confirmation displays paid, +510 points and fixed delivery/tracking; payment claims escrow and hardcodes merchant identifiers | Display only server-confirmed states and substantiated business promises. `rule/success-state-specific`, `rule/cover-reachable-states`. |
| AI scan is simulated but presented clinically | `Screen14AISkinScan.tsx:80–130` sets fixed scores after a timer and can mirror them to a profile | Clearly label simulation; connect a consented verified analysis or keep it as a preview. `rule/cover-reachable-states`, `rule/permission-benefit-first`. |
| Payment choice repeated/reset; transfer missing | Checkout and payment have independent state; only two choices | Choose once: Flutterwave, Stripe, local bank transfer; carry selection. `rule/control-matches-cardinality`, `rule/no-redundant-entry`. |
| Floating AI button competes with checkout | 390px payment screenshot shows it overlapping the payment area | Keep assistance reachable without covering the primary action; de-emphasize it during checkout. `rule/one-primary-action`, `rule/keyboard-complete-flow`. |
| Small hit areas and dense text | Measured quantity controls 20×20px, remove 27×27px; password visibility control 16×16px; many 10–12px labels | Enlarge effective hit areas to about 44px and improve mobile reading hierarchy while retaining tokens. Keyboard names/focus must work. `rule/accessible-name-required`, `rule/keyboard-complete-flow`. |
| Labels not associated with controls | Browser: email/password and promo fields have no associated label/aria name | Connect labels and inputs, add appropriate autocomplete, name show-password. `rule/accessible-name-required`, `rule/auth-allows-assistance`. |
| Contrast below normal-text target | Computed on white: `#D4AF37` 2.10:1, `#997A2E` 4.06:1, `#9CA3AF` 2.54:1 | Keep gold for decoration; use a darker approved token for small text needing 4.5:1. |
| Modal keyboard handling incomplete | QuickModal handles Escape/scroll lock but lacks focus entry/trap/return | Use the existing accessible dialog primitives with the same styling. `rule/keyboard-complete-flow`. |
| Offline/save messages overpromise | Banner says changes will sync without a durable write queue; mutations swallow failures | Distinguish cached reads, unsent drafts and saved data; explicit recovery. `rule/error-states-recovery`, `rule/preserve-user-input`. |
| Encoding and order-data quality | Confirmation shows `âœ“`; mapper invents dates, blanks addresses and collapses statuses | Render UTF-8 icons and actual order fields/status history. `rule/success-state-specific`. |

These are code-backed findings plus limited rendered checks, not a full WCAG certification or pixel-parity comparison across every screen. Home/catalogue rendering is blocked by the image defect; tablet, real-phone, reduced-motion and screen-reader coverage remain required.

## 6. Recommended user journey

### Brief

User: guest or returning shopper on a slow/mobile connection. Job: find a suitable product, know the delivered price, purchase once, and track it. Outcome: one recoverable order with truthful payment/fulfillment state. Consequence: initiating payment commits a financial operation; changing cart items is reversible. Privileged workflows use separate role-scoped surfaces.

### Customer path

1. **Discover:** `/` → `/catalogue?q=...&category=...&sort=...`. Real product links, sensible first-page payload, preserved filters/back position. Optional AI and signup do not block shopping. `rule/navigation-vs-action`, `rule/value-before-interruption`.
2. **Evaluate:** `/products/[slug]`. Exact variant, price/availability, ingredients/use guidance, delivery estimate after location selection, genuine approved reviews. Missing/unavailable products have a truthful recovery path. `rule/cover-reachable-states`, `rule/empty-state-action`.
3. **Build bag:** persisted guest/user cart; authoritative item IDs, quantities and quote. Quantity/remove can be undone by restoring valid items; no irreversible purchase action here. Show stock/price changes explicitly. `rule/preserve-user-input`, `rule/undo-only-when-honest`.
4. **Checkout:** contact/address → valid delivery or pickup → final quote. Keep guest checkout; reuse entered/saved information. Promotion fields remain optional/secondary. `rule/no-redundant-entry`, `rule/one-primary-action`.
5. **Review and pay:** choose one of Flutterwave, Stripe or local bank transfer. Show merchant, currency, order amount, method and consequences before activation. Hosted redirect is not success. Repeated taps/retries use one operation identity. `rule/irreversible-action-safeguard`, `rule/name-object-scope-consequence`.
6. **Recover:** cancel/unpaid/unknown/pending/failed/success are distinct states. Preserve order reference and resume capability. Do not start a second charge while the first is ambiguous. Bank transfer shows account details and “awaiting verification”; proof submission does not mean payment verified. `rule/cover-reachable-states`, `rule/time-limit-adjustable`.
7. **Confirm and track:** owned `/orders/[id]` destination, server payment status, real shipping address/history, earned points only when actually credited. Guest access uses a scoped capability. Offer account creation after value, not as a purchase gate. `rule/success-state-specific`, `rule/value-before-interruption`.

### Partner/admin paths

- Creator: authenticated landing → real referral/content/commission ledger → eligible payout; preserve drafts and show pending versus posted earnings.
- Distributor: assigned inventory/orders → permitted fulfillment transition → receipt/transfer events; avoid mixing retail available stock with wholesale stock.
- Admin: permission-scoped queue → detail/review → consequential action with reason → transactional audit → visible result. MFA for privileged access; refund status follows verified settlement, not a success-looking button click.

These use `rule/name-object-scope-consequence`, `rule/irreversible-action-safeguard`, `rule/cover-reachable-states` and `rule/preserve-user-input`. Visual implementation should preserve the current design system while correcting interaction and state truthfulness.

## 7. Repair order and acceptance gates

1. **Restore a runnable, connected app:** missing export, development CSP, image sources, deterministic hydration, URL navigation, same-origin URL construction. Gate: production build and real browser browse→product→cart→checkout navigation pass, including back/refresh/direct links.
2. **Remove false commerce states:** isolate demos, persist carts, one server quote, carry payment choice, implement bank-transfer screen, owned confirmation/tracking. Gate: a clean visitor has no invented purchases; cancellation and reload recover the same order.
3. **Close financial recovery gaps:** atomic cart replacement, Stripe preflight flag placement, provider idempotency, webhook recovery, stock-pool filtering. Gate: real PostgreSQL concurrency/fault tests and provider sandbox flows, including lost responses and repeated callbacks.
4. **Complete operational/security hardening:** reviewed dependency updates, transactional session policy/audits, unified quotas, real deadlines/admission, measurable metrics and alerts. Gate: saturation does not starve checkout; alerts and restoration are actually exercised.
5. **UI/accessibility and release:** labels, focus, targets, contrast, truthful copy, collision-free overlays, mobile/desktop regression screenshots; finalize Next hosting/CI configuration, migration rollout/rollback and same-region topology. Gate: reproducible browser E2E and accessibility runs before cutover.

Local browser E2E can and should be written now using a disposable real PostgreSQL environment and stubbed providers. Staging is additionally required for real provider, hosting, region, CDN, load and recovery validation; it is not a prerequisite for beginning E2E coverage.

Avoid additional search/index/Redis/distributed-infrastructure work until these correctness and integration gates pass. The existing stack is suitable; completing its contracts is the priority.
