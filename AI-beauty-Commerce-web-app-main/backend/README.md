# Glowly Backend (owned) — Next.js + PostgreSQL + Drizzle + Zod

Modular monolith (S0 auth/users; catalog in S2). Supabase is prototype-only;
this is the production path you own: database, credentials, schema, migrations,
backups, secrets.

## Quickstart (no Docker needed for checks)

```bash
cd backend
npm install
npm run typecheck   # tsc --noEmit
npm test            # vitest (unit, DB-free)
npm run db:generate # emit drizzle/ migration from schema (review before commit)
```

## With Docker (staging/VPS or any machine with Docker)

```bash
# repo root
docker compose up -d postgres redis minio mailhog
cd backend && cp .env.example .env
npm run db:migrate && npm run db:seed
npm run dev  # :3001; frontend proxies /api/* here (same-origin cookies)
```

## Auth contract (S1)

| Endpoint | Body → Response |
|---|---|
| POST `/api/auth/register` | `{email,password}` → 201 `{ok,email}` (+session cookie; `_dev*Token` only in dev) |
| POST `/api/auth/login` | same → 200 `{ok}` + cookie. Failures: one generic message |
| POST `/api/auth/logout` | — → revokes server session, clears cookie |
| GET `/api/auth/me` | — → `{id,email,emailVerified,roles,profile}` |
| POST `/api/auth/verify-email` | `{token}` → `{ok}` |
| POST `/api/auth/request-password-reset` | `{email}` → always 200 (no enumeration) |
| POST `/api/auth/reset-password` | `{token,newPassword}` → `{ok}`, kills all sessions |
| GET/PATCH `/api/me/profile`, GET/POST `/api/me/addresses`, PATCH/DELETE `/api/me/addresses/[id]` | owner-scoped (BOLA by construction) |

Sessions: scrypt-hashed passwords, SHA-256 token hashes, HttpOnly + Lax cookies
(Secure in prod), 5-fail lockout, reset revokes all sessions.

## Catalog + inventory (S2)

| Endpoint | Access | Notes |
|---|---|---|
| GET `/api/products?q=&category=&brand=&sort=&inStock=&limit=&cursor=` | public | keyset pages, cost-capped; prices in kobo |
| GET `/api/products/[slug]` | public | full detail: variants + availability + attributes + ingredients |
| GET `/api/categories`, GET `/api/brands` | public | |
| POST `/api/admin/products|brands|categories`, PATCH `/api/admin/products/[id]` | ADMIN/STAFF | strict Zod; variants carry SKUs |
| GET/POST `/api/admin/inventory` | ADMIN/STAFF/INVENTORY_MANAGER | ledger read + adjustment (movement-logged) |

Inventory strategy: `available = on_hand - reserved`, row-locked reservations
with TTL (`reserveStock`), sweeper `releaseExpired` (S5 worker), CHECKs as backstop.
Seed: `npm run db:seed:catalog` ports the Vite mocks (idempotent; stock seeded once).
Storefront reads this API when `VITE_API_URL` is set, mocks otherwise.

## Cart + checkout + orders (S3)

| Endpoint | Access | Notes |
|---|---|---|
| GET `/api/cart`, POST `/api/cart/items`, PATCH/DELETE `/api/cart/items/[id]`, DELETE `/api/cart/items` | user or `X-Session-Id` guest | authoritative prices, availability attached |
| POST `/api/cart/merge` | auth | folds guest cart into user cart on login |
| POST `/api/checkout` (`Idempotency-Key` required) | user or guest | atomic tx: validate → address → server pricing → order+items+history → reserve → clear cart |
| GET `/api/orders`, GET `/api/orders/[id]` (+`?email=` for guests) | owner / guest-email match | keyset pages; identical 404s (no enumeration) |
| GET/POST `/api/me/wishlist`, GET/POST `/api/me/recently-viewed` (cap 20) | auth | |
| GET `/api/admin/orders`, GET+PATCH `/api/admin/orders/[id]` | ADMIN/STAFF | status machine enforced; PAID is system-only |

Checkout trusts nothing from the client: totals/price/discount keys are
rejected by `strict()`; stock failures roll back the whole order; replays
return the prior order (`replay: true`); cross-user key reuse → 409.
Delivery fee is 0 until the S5 shipping module prices it.

## Payments (S4 — Flutterwave + Paystack + Opay + bank transfer)

| Endpoint | Access | Notes |
|---|---|---|
| POST `/api/payments/init` `{orderId, provider, guestEmail?}` | owner | server-side init; returns hosted `authorizationUrl` (transfer → bank details) |
| GET `/api/payments/status?reference=` | owner | frontend polling |
| GET `/api/payments/return?...` | public (lookup only) | provider redirect landing; settles via server verify, never trusts query |
| POST `/api/webhooks/flutterwave|paystack|opay` | signature-verified | HMAC-SHA256 / HMAC-SHA512 / HMAC-SHA512; dedupe ledger; verified 200s |
| POST `/api/payments/transfer-claim` | owner | proof of manual transfer for PENDING orders |
| GET `/api/admin/transfer-claims`, POST `…/confirm` | ADMIN/STAFF | approve settles via system-only PAID path with evidence note |
| POST `/api/admin/refunds` | ADMIN/STAFF | provider API refunds (opay/transfer = dashboard step); full refunds flip order |

Settle rule (four-way match): provider status successful + NGN + amount ≥
expected + reference match — anything less leaves the order PENDING. Opay
Cashier create/status paths are env-overridable (`OPAY_*_PATH`) pending
dashboard confirmation at merchant onboarding.

## Growth (S5 — reviews, loyalty, shipping, notifications)

| Endpoint | Access | Notes |
|---|---|---|
| POST `/api/reviews`, GET `/api/products/[slug]/reviews`, POST `/api/reviews/[id]/helpful` | auth / public / auth | verified badges are server-computed; aggregates recomputed in-tx |
| GET `/api/admin/reviews`, PATCH `/api/admin/reviews/[id]` | ADMIN/STAFF | moderation; aggregates follow the decision |
| GET `/api/me/loyalty`, POST `/api/me/loyalty/redeem` | auth | 1pt/₦100 on PAID (idempotent), fixed voucher tiers |
| POST `/api/admin/loyalty/adjust` | ADMIN/STAFF | balance can never go negative |
| POST `/api/admin/shipments`, POST `…/[id]/events` | ADMIN/STAFF | scans auto-advance the order via the guarded machine |
| GET `/api/orders/[id]/shipment` | owner / guest-email | tracking + events |

Checkout now prices zone delivery fees and consumes loyalty vouchers
atomically. Notifications use a transactional outbox (`order.created`,
`order.paid`, `shipment.update`); a worker claims batches with SKIP LOCKED
(sender integration = the one remaining step, no API changes needed).

## AI skin + assistant (S6 — mock by default, Gemini when keyed)

| Endpoint | Access | Notes |
|---|---|---|
| GET/PUT `/api/me/skin-profile` | auth | type, concerns, notes |
| POST `/api/skin-analyses` | auth | consent literal + version required; returns presigned PUT (private bucket) |
| POST `/api/skin-analyses/[id]/complete` | auth | HEAD + magic-byte verify → provider → Zod-validated result + profile refresh |
| GET `/api/skin-analyses[/[id]]` | auth | owner-only; 5-min signed view URL on complete |
| GET `/api/recommendations?analysisId=` | auth | DB-grounded, in-stock only, with reasons |
| GET/POST `/api/ai/conversations`, GET/POST `…/[id]/messages` | auth | 20/day quota; catalogue-grounded, length-capped replies |

Rules: consent recorded (versioned) or no analysis; generated storage keys
(no user filenames); images private with 30-day purge (S7 sweeper); AI output
is validated data, never a decision; every response labels its provider.

## Operations (S7 — audit, permissions, worker)

| Surface | Notes |
|---|---|
| GET `/api/admin/audit` | `audit:read`; filter by entity/action |
| POST/DELETE `/api/admin/users/[id]/roles` | `roles:grant`; anti-escalation + anti-lockout guards |
| All admin mutations | named-permission gates + audit rows with actor/ip/request-id |
| `npm run worker [--once]` | outbox sender (SMTP or log driver), reservation sweeper, 24h abandoned-cart reminders (7-day dedupe), 30-day scan purge |

Permission bundles live in migration `0006` (STAFF keeps prior catalog access,
SUPPORT is read-only, grants are SUPER_ADMIN-only). Audit rows are append-only
by construction — no update/delete path exists.

## Partner ecosystem (S8 — distributors, creators, community)

| Endpoint | Access | Notes |
|---|---|---|
| GET `/api/distributors`, `/api/distributors/[id]`, `/api/distributors/stock` | public | verified-only directory; city-scoped "in stock near you" |
| POST `/api/distributors` (apply) | optional auth | partnership application queue |
| GET `/api/creators`, `?code=` validate, POST click | public | promo-code directory; discount info only; best-effort clicks |
| POST `/api/creators` (apply) | optional auth | affiliate applications |
| GET/POST `/api/community/posts`, POST `…/[id]/like` | public / auth | server-derived Verified Buyer badges; toggle likes |
| GET/POST `/api/community/chat` | public / auth | channel chat, spam-throttled |
| Admin applications + stock + community moderation | named perms | approvals mint distributor/creator rows; audit-trailed |
| Checkout `creatorCode` | any | server-validated affiliate discount persisted on the order; sales + commission accrue on PAID |

Seed: `npm run db:seed:partners` ports the storefront mocks (idempotent).

## Conventions (enforced, not suggested)
- Routes: parse → Zod `.strict()` → rate-limit → service. Never import `db/` from
  components; services never trust client prices/ids (S3+ pattern).
- Errors: `api()` wrapper; unexpected → generic 500 + server log. No stacks/SQL to clients.
- Every schema change: `db:generate` → review SQL → test migrate → staging → prod.
