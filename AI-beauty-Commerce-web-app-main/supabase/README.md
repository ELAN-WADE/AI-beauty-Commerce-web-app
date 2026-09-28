# Desla!™ Backend — Supabase + Redis Setup

Resumed backend architecture (Supabase Postgres is source of truth, Upstash Redis is cache only).

## 1. Current architecture (audited 2026-09-28)

- Before this resume: **no backend existed**. Frontend used local mocks in `src/data/*.ts`
  (`products`, `distributors`, `creators`, `communityPosts`, `reviews`, `orders`)
  with in-memory state in `src/context/AppContext.tsx`.
- Now: `supabase/schema.sql` + `supabase/seed.sql` mirror those mocks 1:1.
  `src/lib/*` provides cache-first access with automatic fallback to mocks
  when env keys are missing, so the app never breaks locally.

```
Vite React (src/)
  └─ src/lib/backend.ts      ← single API surface the UI should call
       ├─ src/lib/supabase.ts ← Supabase client (graceful null when unconfigured)
       ├─ src/lib/redis.ts    ← Upstash REST + in-memory fallback cache
       └─ src/data/*.ts       ← fallback mocks (still used until keys are set)

Supabase Postgres (source of truth)
  profiles, categories, products, distributors, inventory, creators,
  orders, order_items, tracking_steps, reviews, community_posts,
  community_messages, vouchers, points_activity, carts, cart_items,
  authenticity_codes  (+ Storage buckets: product-media, community-media, review-media)

Redis / Upstash (cache only, never authoritative)
  products:list (3600s) · product:{id} (3600s) · distributors:city:{city} (300s)
  creator_code:{code} (600s) · reviews:product:{id} (600s) · feed:community:latest (120s)
```

## 2. Create Supabase project

1. https://supabase.com/dashboard → New project → region closest to Lagos
   (e.g. `eu-west-1` / `eu-central-1` if West Africa unavailable).
2. SQL Editor → New query → paste `supabase/schema.sql` → Run.
3. SQL Editor → New query → paste `supabase/seed.sql` → Run.
4. Project Settings → API → copy `Project URL` + `anon public key`
   (+ `service_role` key only for server-side scripts, never expose in Vite).
5. Auth → Providers → enable Email (+ Google if needed).
6. Storage → confirm buckets `product-media`, `community-media`, `review-media`
   exist and are Public.

## 3. Create Redis (Upstash)

1. https://upstash.com → New Redis DB (same region as Supabase if possible).
2. Copy `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.
3. Local dev without Redis is fine — `src/lib/redis.ts` falls back to
   in-memory cache automatically.

## 4. Env wiring

```bash
cp .env.example .env
```

Fill:

```env
VITE_SUPABASE_URL=https://xyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_UPSTASH_REDIS_REST_URL=https://...upstash.io
VITE_UPSTASH_REDIS_REST_TOKEN=...
```

Rules:
- `VITE_*` keys ship to the browser — only anon key + Upstash REST with
  read/write scoped token, never `service_role`.
- Missing keys = app runs on local mocks (see `backend.ts` `isBackendConfigured`).
  Open DevTools console: `[desla-backend] running on local mocks` vs `Supabase+Redis`.

## 5. Verify

```bash
npm install
npm run dev      # http://127.0.0.1:5173
npm run build    # tsc -b && vite build must pass
```

Smoke test (with keys set):
- Home loads products (from Supabase via Redis cache).
- Switch city Lagos → Abuja: distributor list hits `distributors:city:{city}`.
- Product page: reviews via `reviews:product:{id}`, community buzz via hashtag.
- Checkout create order → writes `orders` + `order_items` + `tracking_steps`.
- Creator code `AMARA10` validates from `creators` (cached 600s).

## 6. Next steps (not yet done)

- Supabase Auth wiring in `AppContext` (email OTP → `profiles` row).
- Paystack/Flutterwave webhook → `orders.payment_reference` + `points_activity`.
- Realtime: `community_messages` + `community_posts` subscriptions.
- Full product import: current seed has 5 core SKUs; extend `seed.sql`
  from `src/data/products.ts` (633 lines) before production launch.
- Storage upload flows for review/community photos.
