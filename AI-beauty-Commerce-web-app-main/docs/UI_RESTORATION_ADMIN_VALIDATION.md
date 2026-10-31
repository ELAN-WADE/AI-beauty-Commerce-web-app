# UI preservation and administrator workflow checks

Updated 31 October 2026.

## Preserved interfaces

The orders page again uses its original header, two-column tracking layout,
milestone stepper, courier card, map panel, botanical accents and assistance
card. It reads the selected owned order, saved address, recorded history and
shipment reference. Without a courier/GPS integration it shows unavailable
location, rather than invented riders, distances, delivery times or a moving
map. The account page retains its active-order cards and progress treatment;
“View my orders” opens the personal orders page.

The administrator retains its icon sidebar and original workspaces. The sidebar
stays in place while the right column scrolls. Existing CMS panels are retained;
Posts & Videos is an additional control within that CMS, not a replacement
dashboard. Creator/distributor screens and the restored AI scan remain intact.

Product cards have text-only hover/focus labels. Clinical labels are rejected
by the publication API and filtered from legacy public presentation data.
Formulation Essentials retains its original grid without the extra discipline
filter pills. The existing quick-view modal remains: its photograph fills the
left column, with inline labels and the authenticity line over the photograph.
Adding to the bag no longer opens a second shopping-bag sheet.

## Administrator actions and real data

- Product publishing persists identity, media, description, ingredients,
  instructions, variants, stock, publication state and comparison prices.
  Public client/server mappers preserve fractional naira and distinct size
  prices, making saved discounts visible. Checkout prices remain server-owned.
- Community posting accepts entered text and actual uploaded images/videos.
  Publication is permission/MFA gated, atomic and idempotent. It creates a real
  community feed entry and audit record, with optional published-product tag.
  Failed publication preserves the draft.
- Media uploads validate JPEG/PNG/WebP/GIF or MP4/WebM contents and require
  successful storage. Image limit is 10 MB; video limit is 50 MB. Production
  requires configured object storage; local development can use saved files.
- Creator content still requires administrator review. Approval publishes the
  saved media/instructions; a connected social account does not imply an
  external TikTok/Instagram post.
- PR requests retain the published kit's actual product references. Capacity,
  approval, dispatch and delivery transitions are server enforced; dispatch
  references survive subsequent delivery updates.
- Removed disconnected administrator payout, random tracking, local-only
  review and publication success simulations. Financial actions retain their
  existing server permission, payment, ledger and reconciliation rules.
- Loaded administrator rows remain visible when switching tabs. Changing
  account clears them. Chart controls choose different recorded time windows;
  paid-sales figures describe loaded orders, not a bank balance.

Product-design decisions follow rule/preserve-user-input,
rule/cover-reachable-states and rule/success-state-specific.

## Rendering and background loading

The backend storefront already uses server-rendered catalogue/product data and
ISR for public pages. Successful publication invalidates storefront paths after
commit and notifies open clients. Account, order and administrator API data is
authenticated and private/no-store; it must not enter a shared public cache.
The port-3000 storefront still uses its client application shell; this pass
does not claim to convert that entire application to server rendering.

Storefront tools and the authorized partner's screen modules now warm after
first paint, without mounting hidden forms or triggering private writes. The
first twelve product images decode at low priority. Work runs sequentially,
pauses in hidden tabs, cancels on unmount and respects data-saving/slow network
preferences. This avoids making the first page wait for every video or portal.
Next's development badge is disabled in both applications.

See the official [ISR guidance](https://nextjs.org/docs/app/guides/incremental-static-regeneration)
and [prefetching guidance](https://nextjs.org/docs/app/guides/prefetching).

## Validation boundaries

Isolated database tests exercise product publication, stale-write protection,
community publication/replay, PR approval-to-delivery, customer order ownership,
partner fulfilment and upload failures. Captured-response Chrome checks verify
the actual layouts and controls without changing live business data.

Validation for this pass: 103 targeted tests passed, both application TypeScript
checks passed, and both production builds completed. Chrome checks passed in
both apps for personal order isolation, pickup and distributor handoff, retained
creator instructions, full-photo quick views, exact prices/discounts and the
sign-in-before-cart journey. The administrator CMS edit/reorder/publish controls,
post composer and sticky sidebar also passed captured-response browser checks.

The user previously confirmed creator Google sign-in. Brevo delivery previously
reached spam. This pass does not send additional mail or claim new live provider
acceptance. Real payment settlement, external social publishing and courier GPS
require configured providers and live acceptance. Gemini is prepared separately;
its original interface remains and does not manufacture scan results.
