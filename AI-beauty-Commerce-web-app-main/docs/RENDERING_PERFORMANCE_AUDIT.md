# Rendering and performance audit

Reviewed 30 October 2026. Scope: public shopping pages, state updates, partner
workspaces, catalogue delivery, and the difference between development and
production rendering. Cryptocurrency integration remains outside this task.

## What the application actually uses

Both applications run Next.js 15.5.28. They do not currently use the same rendering
strategy, and using Next.js alone does not make every page server-rendered.

| Surface | Current rendering and delivery |
| --- | --- |
| Root application, port 3000 | Next App Router shell, then browser rendering through `ClientEntry` with `ssr: false`. Screen changes mostly use client state and `?screen=`. Public canonical links redirect into that shell. |
| Root homepage request | Dynamic server shell because `page.tsx` reads headers for the private administrator entry. The shopping content is still client-rendered. |
| Full-stack application, port 3005: `/` | Server-rendered public product seed with ISR, one-hour time fallback. |
| Full-stack `/catalogue` | Server-rendered product grid with ISR, five-minute time fallback. |
| Full-stack `/products/[slug]` | Pre-generated known product routes, on-demand generation for other slugs, one-hour time fallback, server metadata. |
| Accounts, checkout, AI, admin and partner workspaces | Interactive client components; live authenticated APIs provide private data. A prerendered route shell does not mean its private screen content is server-rendered. |

Admin writes already call path revalidation and publish an SSE catalogue update.
Public product-list API responses also allow shared-cache freshness of 60 seconds
and stale-while-revalidate of 300 seconds. These are separate caching mechanisms.
Payments and checkout still require authoritative server validation.

## Changes made in this audit

1. **Restore the server-to-browser catalogue handoff.** The full-stack provider
   accepted `initialCatalogue` but initialized its product state to `[]`. It now
   uses the same seed during SSR and hydration. Populated seeds skip the duplicate
   initial `/api/products` fetch. Empty seeds retain a recovery read.
2. **Deduplicate server catalogue loads within a render.** `getCatalogSeed` and
   `getProductSeed` use React `cache`, so identical layout/page/metadata calls can
   share a load. This is request memoization, not a new persistent stock cache.
   Each catalogue load may still perform multiple SQL queries and pages.
3. **Remove the home page's development-only blank first render.** Real product
   cards can now appear in the initial HTML in development as well as production.
4. **Remove the fixed brand overlay from the active app shells.** Its 650 ms
   hold and 900 ms unmount timer no longer cover otherwise usable content.
   Next's actual streaming/loading boundary remains available while data loads.
5. **Load tools when needed.** Six storefront overlays have independent lazy
   boundaries. Once opened, they stay mounted so closing a drawer preserves its
   draft. Home quick view uses the shared overlay instead of a duplicate modal.
   The 22 creator/distributor workspace screens also load independently.
6. **Reduce unrelated card updates.** Product cards use a small, memoized actions
   context with stable callbacks, and are memoized themselves. Changes to chat,
   panels, or checkout fields no longer change this context. Wishlist and product
   changes still propagate. Cart quantity updates also preserve item immutability.
7. **Avoid repeating catalogue filtering for unrelated updates.** Filtering and
   sorting are memoized. Search uses a deferred query so result rendering can
   follow typing without making the input wait for that work.
8. **Fetch chat on entry.** Shopping-page startup no longer fetches chat history.
   Opening the drawer/community screen loads the selected channel and ignores
   obsolete responses when the channel changes or the view closes.
9. **Subscribe to breakpoint changes.** Viewport state uses `matchMedia` rather
   than every resize event; its context value and toggle callback are stable.
10. **Keep healthy catalogue streams connected.** The first-party proxy formerly
    aborted established SSE streams after its ordinary 20-second production or
    120-second development timeout. Only the handshake now has that deadline;
    an established stream follows client cancellation and disables proxy buffering.

The rendering guidance follows the [Next.js 15 caching documentation](https://nextjs.org/docs/15/app/guides/caching).
React context subscriptions still update consumers when their provider value
changes; memoizing the entire existing context would not isolate its different
state domains. See [React useContext](https://react.dev/reference/react/useContext).

## Evidence and limits

- 57 focused tests passed for catalogue seeds, inventory, admin publication,
  user-journey helpers and the private admin entry.
- 20 proxy/auth boundary tests passed, including a stream that remains usable
  after 125 simulated seconds and aborts when its client disconnects.
- Two browser rendering tests passed against a separate PostgreSQL test database.
  They verify actual product headings in the home/catalogue HTML, correct product
  detail HTML, missing-product handling, hydration, lazy filters, and no duplicate
  initial catalogue fetch for a populated server seed.
- Both application TypeScript checks passed after the state and lazy-loading
  changes. The full-stack optimized production build also passed.
- Anonymous browser interaction checks passed for both apps: opening filters
  caused **zero product-card renders**, and lazy filters and quick view worked
  with no runtime errors. Warm filter opening took approximately 95 ms on port
  3000 and 120 ms on port 3005, including browser automation overhead. These are
  single local interaction samples, not production INP measurements.
- The captured account/partner workflow checks also passed on both apps after
  the lazy-screen changes: personal orders, tracking/pickup, distributor pickup
  transitions, confirmation recovery and creator submissions had no runtime errors.
- That build reported approximately 263 kB first-load JavaScript for home,
  136 kB for catalogue and 139 kB for product details, with 104 kB shared. These
  are Next's build figures, not total page weight or a measured loading SLA.
- The initial anonymous development probe saw approximately 16.4 MB decoded
  JavaScript in the root app and 17.9 MB in the full-stack app. The full-stack
  first request took roughly 31.8 seconds while compiling, versus 1.9 seconds on
  the repeat request. These are local development observations under machine
  contention, not production benchmarks or a controlled before/after comparison.
- **Production runtime measurements are not accepted as a healthy benchmark.**
  Local production settings lack `AUTH_EMAIL_ENCRYPTION_KEY`. The runtime's
  production guard returned API 500s, while the public shell still returned 200.
  Catalogue read helpers also swallow DB/configuration errors into empty seeds.
  A fast empty page must not count as a fast working shop. Do not rotate or invent
  production keys as a benchmarking shortcut; configure durable deployment secrets
  consistently with the account-email worker and stored encrypted records.

## Remaining priorities

| Priority | Gap | Recommended next work and acceptance evidence |
| --- | --- | --- |
| 1 | Two frontend architectures | Consolidate production on the full-stack App Router storefront after parity checks. This removes the client-only initial catalogue waterfall and extra first-party proxy hop. Preserve the private admin entry and role flows. |
| 1 | Production settings and silent empty seeds | Validate production configuration before deployment and surface catalogue outages distinctly from a genuinely empty catalogue. Require healthy data APIs and real product HTML before collecting release timings. |
| 1 | Catalogue payload grows with the whole shop | Layout/home/product routes can still load up to five pages of 100 products. Seed only the products needed by a route, fetch related products separately, and paginate the catalogue on the server. Measure SQL, RSC bytes and first paint at realistic catalogue sizes. |
| 1 | Public content still arrives after hydration | Seed published hero/editorial configuration with public server data and reserve layout space. Otherwise a later hero or content update can shift the page. |
| 2 | Image optimization is largely bypassed | `ProductImage` renders a native `img`; its `sizes` prop currently creates no responsive image variants. Root config disables Next image optimization. Add correctly sized responsive product images, dimensions, modern formats and priority only for visible lead images. Configuring formats alone does not optimize native image tags. |
| 2 | Large state provider remains | Cards are isolated, but navigation, identity, CMS, chat, cart and partner state still share the main context. Continue splitting by domain and profile commits before further memoization. |
| 2 | Unneeded startup API reads remain | Distributor/creator/community data is still hydrated globally. Load it by route or defer noncritical sections; avoid duplicate development Strict Mode requests with safe request coalescing. |
| 2 | Expensive visual modules | The homepage imports the OGL carousel implementation even when no slides are published. Defer its code and GPU work until needed, preserve a static lead image, and measure mobile CPU/GPU effects. |
| 2 | Root fonts use external CSS | Replace the runtime Google Fonts stylesheet with locally served optimized fonts and matching fallback metrics. |
| 2 | Live freshness across caches/instances | Path invalidation does not necessarily purge an external CDN's product-list cache. Verify admin-update-to-visible-product latency through the real CDN. SSE listeners are process-local; multiple instances need shared invalidation delivery. Coalesce bursts and prevent older refreshes overwriting newer data. |
| 3 | No established field-performance baseline | Collect real LCP, INP and CLS by route, device and release; trace API/database p50/p95/p99 separately. Test checkout, catalogue filters, cart and approved partner workspaces with realistic data and concurrent users. |

Target LCP at or below 2.5 seconds, INP at or below 200 ms and CLS at or below 0.1,
assessed at the 75th percentile separately for mobile and desktop. These are
[Core Web Vitals targets](https://web.dev/articles/vitals), not results certified
by this local audit. Define separate business budgets for API latency and
admin-update propagation based on deployment measurements.

## Reproduce

From `backend/`:

```text
node scripts/check-rendering.mjs
node scripts/check-rendering-interactions.mjs
node scripts/check-rendering-performance.mjs --output .local/performance/result.json
```

The rendering integration runner requires a separate `TEST_DATABASE_URL` and uses
ports 3220/3225. It creates test fixtures there, never in the live database.
Interaction and performance probes are anonymous browser reads and local UI state
changes. `PERF_ORIGINS` selects comma-separated origins. Use optimized `next start`
servers with healthy APIs for release measurements. The five-second observational
probe is a diagnostic sample, not a complete Web Vitals or load-testing suite.
