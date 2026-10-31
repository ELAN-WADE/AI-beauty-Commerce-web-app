# Rendering and click latency

This pass preserves the existing storefront, quick-view, scan and portal designs. It changes when public content, code and images become available.

## Findings and changes

The root storefront used a browser-only ClientApp, empty initial products and a later catalogue fetch. Even a fast API could not put product cards into the first HTML response. Public home/catalogue/product views now render on the server using the saved catalogue and CMS configuration. The server and hydration use the same seed; the initial browser catalogue fetch is skipped when that seed exists. A failed seed can still recover through the existing browser fetch.

Product quick views previously lazy-loaded behind a null Suspense fallback. They now render from the already available card data without a separate module/data request on click. Home, catalogue and product screens are available directly; secondary public screens warm during idle time. Bottom navigation warms destinations on pointer, keyboard focus and touch intent. In the backend Next.js app, likely routes prefetch in the background, and opening a quick view prefetches its full product route.

Local product images now use Next.js responsive image optimization with the existing dimensions, crops and classes. Modal/main images receive priority. External CMS images retain their saved URLs; this pass does not proxy arbitrary external hosts through the image optimizer. Background image warming requests the resized image instead of downloading the full original as well as the displayed thumbnail. Save-Data/2G checks, hidden-page pauses and bounded warming remain in place.

Open quick views now receive live catalogue updates. A price change preserves a still-valid size and entered quantity; an unpublished/removed product closes the view. Product-detail memory caches clear on catalogue invalidation, and an older in-flight request cannot overwrite a newer cache generation.

## Rendering policy

| Surface | Strategy | Freshness boundary |
| --- | --- | --- |
| Backend public home/catalogue/products | ISR HTML and server-seeded client components; tagged public Next data cache | 60-second public-data TTL plus invalidation after committed publication/inventory changes |
| Root public home and legacy query routes | SSR with cached public catalogue/CMS reads | No browser-only initial catalogue waterfall; per-request query/admin routing remains dynamic |
| Root product URLs | Prebuilt first 100 catalogue products, ISR, on-demand generation for remaining URLs | 60-second public-data TTL; reuse the same public product graph already present in the catalogue |
| Existing products/quick views | Immediate local render from saved card data | Server validates the actual cart/checkout mutation; background reads do not block opening |
| Signed-in community/posts | Session-owned client state, fetch after authentication, foreground/background refresh | No shared ISR cache for personal session data; text drafts and real media are retained on failure |
| Account, admin, creator/distributor operations, carts and checkout | Private session/permission checks, uncached mutations and private responses | Authentication, authorization, checkout stock and monetary checks remain authoritative on the server |
| Product images and static chunks | Responsive optimized local images; immutable framework chunks; bounded idle/intent preloading | Delivery benefits from the hosting/CDN configuration; this pass does not provision a global CDN |

Backend committed writes now invalidate both shared public data tags and relevant page paths before broadcasting client sync. Successful matching admin writes through the root proxy also invalidate that frontend's public data tags. Failed or read-only requests do not invalidate public data. Publication remains successful if optional cache access fails; TTL is the recovery boundary.

ISR does not mean zero work on every first visit. An uncached URL, first image transformation, authentication check, upload, first private feed request or cold server can still require a network round trip. Prefetching and server seeds remove avoidable serial waits. Rendering everything at the edge would not remove the SQL/database round trip, and Next.js 15 ISR is supported by the Node.js runtime rather than the Edge runtime. See [Next.js 15 ISR](https://nextjs.org/docs/15/app/guides/incremental-static-regeneration), [Next.js prefetching](https://nextjs.org/docs/app/guides/prefetching), and [Next.js 15 public data caching](https://nextjs.org/docs/15/app/api-reference/functions/unstable_cache).

## Verification

Read-only/captured-response Chrome checks found actual product headings in server HTML, no duplicate initial browser catalogue read, and no product-detail request needed to open a quick view. The latest desktop checks measured approximately 353 ms at port 3000 and 354 ms at port 3005 from the automation click through visible dialog. Both preserved quantity during a simulated server catalogue price update and reported no hydration errors. These are local development measurements, including automation overhead, not a production or global latency guarantee.

For a saved local image, the 384-pixel WebP response was 15,744 bytes compared with the 188,115-byte original, a reduction of about 92%. Both local apps returned the optimized image successfully. Image savings depend on the source and target size.

Targeted tests cover detail request deduplication/TTL/failure recovery, invalidation races, publication cache tags and fallback behavior, background warming, auth-proxy boundaries, persisted catalogue/workspace publication and user journeys. Across the relevant batches, 81 distinct tests passed. Mobile search/scan regression checks also passed on both apps without hydration errors.

Private posts, approval operations, credentials and real-time balances are deliberately not placed into a public shared cache. Multi-instance deployments require a shared Next cache/invalidation setup and a cross-instance sync transport; the existing in-process SSE broadcaster alone does not promise cross-instance delivery.
