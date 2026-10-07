# Project map — where to find things

## Storefront (Vite + React)
- `src/App.tsx` — screen router (only importer of `src/screens/**`).
- `src/screens/<feature>/` — UI journeys, grouped by feature (catalog, checkout, orders, account, ai, community, partners, admin).
- `src/components/` — reusable UI: `common/` (header, nav, cards), `sheets/` (bottom sheets/drawers), `ai/`, `community/`, `partner/`, `admin/`, `auth/`.
- `src/context/` — global state (`AppContext`, `ViewportContext`).
- `src/lib/owned-api.ts` — production API client (backend/). Use this for new features.
- `src/lib/backend.ts`, `src/lib/supabase.ts`, `src/lib/redis.ts` — FROZEN prototype path (mocks). Do not extend.
- `src/data/` — frozen local mocks. Do not extend.
- `src/types/` — shared UI types.

## Backend (Next.js modular monolith — source of truth)
- `backend/src/app/api/` — HTTP routes: thin parse → Zod `.strict()` → rate-limit → service.
- `backend/src/modules/<domain>/` — business logic per domain (`schema.ts` / `service.ts` / `validation.ts`): `catalog`, `inventory`, `cart`, `orders`, `payments`, `shipping`, `loyalty`, `reviews`, `creators`, `distributors`, `routing`, `ledger`, `partners`, `wholesale`, `notifications`, `auth`, `users`, `audit`, `ai`, `skin`, `community`.
- `backend/src/db/` — Drizzle client, schema registry, seeds, migrations runner.
- `backend/src/lib/` — cross-cutting: errors, auth, rate-limit, storage (S3/R2), email, observability.
- `backend/src/worker/` — background jobs: outbox sender, reservation sweeper, cart reminders, scan purge.
- `backend/tests/` — unit + PG integration tests (`npm test` in `backend/`).
- `backend/compose.production.yml` + `backend/nginx.production.conf.example` — production deploy shape (managed DB/storage/SMTP outside compose).

## Prototype (frozen, do not build on)
- `supabase/` — old Supabase schema/seed/functions. Deprecated banner at top of `schema.sql` + `README.md`. No reservations/idempotency/outbox/variants fixes will land here.

## Ops / docs
- `docker-compose.yml` — local dev infra only (postgres, redis, minio, mailhog).
- `docs/` — architecture + staging notes. `implementation.md`, `SECURITY.md` — product/design history.
- `.github/workflows/` — CI. `vercel.json`, `vite.config.ts`, `index.html`, `public/` — storefront shell.
