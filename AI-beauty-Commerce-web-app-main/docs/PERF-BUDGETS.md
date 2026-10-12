# Performance budgets & measurement log (Part VIII)

Budgets are enforced by reasoning + tests, not wishes. Unmeasured claims are marked as such.

## Budgets (3G Moto-G class target)

| Metric | Budget | Current evidence |
|---|---|---|
| Shared First Load JS | ≤ 120 kB | 103 kB (build output, 2026-10) |
| LCP image weight (home / product) | ≤ 250 kB transferred | NOT YET MEASURED — staging task below |
| Catalogue API p95 (20 items) | ≤ 400 ms @ 2k SKUs | newest path only (see log) |
| Detail API p95 | ≤ 300 ms | NOT YET MEASURED on staging |
| Client detail-request fan-out | 1 per slug per 5 min | enforced by `detail-cache.test.ts` |

## What changed (Batch-2) and why

- **Packshots → `next/image`** (`ProductImage`, fill + per-slot `sizes`, AVIF/WebP via
  `sharp`, `priority` only on home hero / gallery main). Grids (ProductCard) inherit
  srcsets everywhere. Avatars (remote URLs), icons and tiny rails stay `<img loading="lazy">`.
- **Detail cache**: 5-min TTL + in-flight sharing + 200-entry bound; failures never cached.
- **Computed sorts in SQL**: only the page hydrates now (was: whole catalogue).

## Measurement log

- 2026-10, PGlite (WASM — directional only, ~5–10× slower than real PG), 2,000 SKUs:
  `newest` 98 ms → computed sorts **900–1,250 ms before**, same-order results after
  the rewrite (proven by `catalog-sort.test.ts`: ordering, keyset walks, filters).
- Search `ILIKE %q%` is a Seq Scan (EXPLAIN verified). **Deferred**: pg_trgm GIN —
  this PGlite build lacks the extension so it cannot be migration-tested here, and
  catalogue scale does not justify it yet. Trigger: staging EXPLAIN shows
  `Seq Scan` + search p95 > 400 ms at >5k SKUs.
- Deferred likewise: `min_price_kobo` materialization (needs backfill + write-path
  triggers; the aggregate rewrite removed the urgency).

## Staging checklist (requires hosted env)

1. `EXPLAIN (ANALYZE, BUFFERS)` the four sort paths at real scale.
2. WebPageTest/Lighthouse 3G run; record LCP + transferred image bytes vs budget.
3. `GET /_next/image?url=...` 200 + `content-type: image/avif` spot check.
