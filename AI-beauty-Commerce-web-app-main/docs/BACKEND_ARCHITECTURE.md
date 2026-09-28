# Desla!™ Backend Architecture — Secure, Scalable, CI/CD-Ready

Companion to the client proposal (Ms Grace, 2026-09-13) and `supabase/README.md`.
Design inputs: `api-design`, `data-storage`, `service-decomposition`, `caching` skills.

## 0. Key architecture decision (proposal vs reality)

| Proposal says | Actual build | Decision |
|---|---|---|
| Next.js + TypeScript, Prisma, PostgreSQL | Vite SPA + React 18, Supabase Postgres, no ORM layer (`src/lib/backend.ts` mappers) | **Keep Vite + Supabase for Phase 1.** The storefront, all 21 screens, and the Supabase schema/seed already exist and build cleanly. A Next.js rewrite would discard ~8k lines of working UI for marginal gain at this scale. Revisit only if SEO/SSR becomes a measured problem (server pre-render of catalogue pages). |
| Environment separation dev/staging/prod | Single `.env.example`, no environments | **Adopt now:** 3 Supabase projects (dev/staging/prod) + per-env Upstash DBs. See §6. |
| Prisma + server validation | Supabase RLS + Edge Functions | RLS is the enforcement point; Edge Functions own secrets + verification. |

## 1. Topology (modular monolith — not microservices)

Per `service-decomposition`: no driver (team size, differential scale) justifies
microservices. One deployable frontend + Supabase managed backend + stateless edge
functions per capability seam. Split a seam only when a real reason appears.

```
Browser (Vite SPA)
  │  HTTPS, anon key only
  ▼
Supabase Platform (managed: Postgres + Auth + Storage + Realtime)
  ├─ RLS policies ────────── authorization enforcement (schema.sql)
  ├─ Edge Functions ──────── secrets + verification + webhooks (this doc §3)
  └─ Storage buckets ─────── product-media / community-media / review-media (public read, auth write)
  │
Upstash Redis (cache ONLY, never source of truth — src/lib/redis.ts)
  └─ products:list · product:{id} · distributors:city:{city} · creator_code:{code}
     reviews:product:{id} · feed:community:latest
```

## 2. Data ownership (who owns what — no shared mutable state across seams)

| Capability | Owner | Tables | Frontend reader |
|---|---|---|---|
| Catalogue | Supabase (public read) | categories, products | `fetchProducts()` cached 3600s |
| Local fulfilment | Supabase | distributors, inventory | `fetchDistributorsForCity()` cached 300s |
| Affiliates | Supabase | creators | `validateCreatorCode()` cached 600s |
| Orders | Supabase (owner-only RLS) | orders, order_items, tracking_steps | `createOrder()` write-through, no cache |
| **Payments (new)** | **Edge Function only** | payments (migration 002) | never from browser; webhook-verified |
| Reviews/UGC | Supabase (auth write) | reviews, community_posts/messages, likes | cached 120–600s, Realtime later |
| Loyalty | Supabase (owner-only) | vouchers, points_activity | account screen |
| Cart | Supabase (guest: session_id) | carts, cart_items | checkout flow |

Scaling ladder (per `data-storage`, cheap-first): indexes (done) → Redis cache (done)
→ read replicas (Supabase managed, when reads dominate) → federation by domain →
shard only if one node genuinely exceeded (~1k QPS / TBs — not this phase).

## 3. Service boundaries / API contracts (per `api-design`: REST/JSON default)

Browser calls Supabase directly for reads; **all money and secrets go through Edge Functions.**

| Endpoint | Method | Idempotency | Notes |
|---|---|---|---|
| Supabase PostgREST `/products`, `/categories`, … | GET | n/a (safe) | anon key, RLS public-read, Redis cached |
| `POST /functions/v1/checkout-init` (to build) | POST | **Require `Idempotency-Key` (UUID/op)** | creates `orders` row status=Pending + Paystack tx; same key → same response, no double order |
| `POST /functions/v1/paystack-webhook` | POST | provider `reference` UNIQUE + key dedupe 24h | **verifies `x-paystack-signature` HMAC-SHA512 before any DB write**; see function file |
| `POST /functions/v1/ai-recommend` (Phase 2) | POST | key per request | catalogue-grounded only; never exposes service_role |
| Error envelope (all) | — | — | `{ error: { code, message, request_id, retryable } }` |

Pagination: cursor/keyset on feeds and catalogue once lists grow; offset only for
small static lists (categories). Cap page size (default 20, max 100).

## 4. Where Phase 2 plugs in (no rebuild — proposal §3 principle)

- **Event tracking:** add `events` table (user_id, type, product_id, metadata, created_at);
  checkout/cart/AI calls already centralised in `src/lib/backend.ts`, so instrumentation
  is one wrapper, not a rewrite.
- **AI face analysis:** new Edge Function + private `scan-images` bucket (signed URLs,
  auto-delete 30d) + explicit consent row. Structured result → match against `products`
  where `in_stock=true` only (proposal §7 rule enforced in query, not prompt).
- **Automation (abandoned cart, post-purchase):** `pg_cron` or scheduled Edge Function
  reading `carts.updated_at` + `automation_log` dedupe table (one reminder max — proposal §7).
- **Admin:** Supabase Dashboard (Phase 1 ops) → custom role-gated admin screens with
  `app_role` claim in `profiles` (Phase 2 expanded roles).

## 5. Proposal Phase 1/2 gap map (what is built vs stubbed)

| Proposal item | Status in repo | Path to production |
|---|---|---|
| Storefront, catalogue, search/filter/sort | Built (UI + mocks, Supabase read layer ready) | Run seed, point env at Supabase |
| Auth, email verify, password reset, profiles | **Missing** — hardcoded `initialUserProfile` | Supabase Auth (email OTP) → `profiles` row; gate checkout |
| Guest + persistent cart | Half — in-memory cart only | Persist to `carts`/`cart_items` via `session_id` |
| Paystack/Flutterwave + **server verification** | **Mock** — `Screen11Payment.tsx:89` fakes processing with `setTimeout`; test card `5399…` hardcoded `:48` | checkout-init + webhook functions + `payments` table (scaffolded this round) |
| Order history + tracking | UI built on mocks | Read `orders` owner-only |
| Admin area | **Missing** | Dashboard first, then role-gated screens |
| SEO/sitemap | Bare (`index.html` meta only) | sitemap.xml, OG tags, prerender catalogue |
| AI scan / assistant | **Simulated** (progress bar, canned replies) | Phase 2 per §4; consent + private bucket mandatory |
| Loyalty, reviews moderation, shipping, automation | UI shell only | Phase 2 per §4 |

## 6. Environments & CI/CD

- `dev` / `staging` / `prod` Supabase projects; `VITE_SUPABASE_URL/KEY` per env;
  service_role + Paystack secret + Upstash token live **only** as Edge Function
  secrets / CI secrets — never `VITE_*`, never committed.
- Pipeline (`.github/workflows/ci.yml`): typecheck (`tsc -b`) + production build on
  every push/PR; `main` → staging deploy; tags → production (manual approval gate
  = phase acceptance point, proposal §14). VPS deploy (Lightsail/QServers) via
  SSH + `dist/` rsync; DB changes via versioned `supabase/migrations/*.sql`
  applied in order — never ad-hoc SQL on prod.
- Before production: `git init` + first commit (repo currently has no VCS —
  highest operational risk after payments).
