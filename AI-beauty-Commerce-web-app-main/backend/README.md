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

## Conventions (enforced, not suggested)
- Routes: parse → Zod `.strict()` → rate-limit → service. Never import `db/` from
  components; services never trust client prices/ids (S3+ pattern).
- Errors: `api()` wrapper; unexpected → generic 500 + server log. No stacks/SQL to clients.
- Every schema change: `db:generate` → review SQL → test migrate → staging → prod.
