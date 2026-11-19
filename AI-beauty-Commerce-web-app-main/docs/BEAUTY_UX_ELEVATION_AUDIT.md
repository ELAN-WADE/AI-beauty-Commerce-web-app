# Desla beauty commerce: design and motion review

Date: 18 November 2026. Status: proposals, not implemented UI.

## Scope and evidence

Reviewed the landing compositions, home components, product detail screen, partner shell, scan screen and AI transport in source. No running storefront was available on the checked local ports; visual quality, frame pacing, responsive crops and touch behaviour still require browser verification. Production-oriented proposals target `backend/src/storefront/`. Keep the sign-in and Connect with Desla / Client Sanctuary section unchanged, including its placement, unless separately requested.

References examined: [Aesop skin finder](https://www.aesop.com/skin-finder/), [Glossier skincare](https://www.glossier.com/pages/skincare), [Glossier routine builder](https://www.glossier.com/a/pages/custom-skincare-set?parent_collection=skincare). These support concern-led navigation, clear product benefits and guided routine building; their animation behaviour was not evaluated through text retrieval.

## Design direction

Create the feeling of a contemporary skincare atelier: tactile product photography, direct advice, generous image scale and a precise shopping interface. The signature interaction should be a buildable daily ritual, connecting concern → product → routine → bag. Keep the surrounding shopping controls quiet and legible.

Palette: porcelain #FAF9F6, white #FFFFFF, ink #0F0F10, botanical olive #263127, muted gold #997A2E, pale gold #FBF5E8. Use olive for the local-partner panel, gold for selected accents, ink for primary purchasing actions. Verify contrast rather than assuming gold is readable on every background.

Typography: Manrope 700 for the hero, 600 for section and product headings; Segoe UI 400 for prose, 500 for supporting labels and 600 for controls. Body 16–18px, card support text 13–14px, generous line height. Existing global `!important` family/weight overrides must be removed or narrowed before those roles can work. Segoe UI needs a system fallback on non-Windows devices.

## Highest-priority corrections

1. Product detail currently prints `shownReviews.length + 482` as verified reviews (`Screen07ProductDetails.tsx:316`). Replace the fixed increment with an authoritative published count. Verification labels must reflect actual purchase verification.
2. The home review component requires authentication before showing any reviews (`AuthenticReviewsSection.tsx:15–24`). Subject to the intended access policy, expose approved public reviews to visitors; retain sign-in for submitting reviews. Guests need purchase confidence before creating an account.
3. Scan results show Glow Index and chart headings despite the current qualitative response having no measured score (`Screen14AISkinScan.tsx`). Show observations and limitations, then explain why each real product was selected.
4. Routine labels hardcode three steps while the underlying configuration is dynamic (`DailyRitualShowcase.tsx`). Derive step counts and totals from the configured, available products.
5. Clarify customer language: product category, benefit, texture, suitability, how to use and delivery should be easy to locate. Avoid unsupported clinical, certification or performance claims.

## UI components worth adding or upgrading

| Component | Proposed experience | What it improves |
| --- | --- | --- |
| Shop by concern | Four to six selectable concerns below the hero or near categories; selection filters real products and remains visible | Helps visitors who know their concern but not ingredient names |
| Sensory product gallery | Bottle, texture swatch, scale-in-hand and application imagery; short optional muted video with controls | Communicates texture and finish before purchase |
| Daily ritual builder | Cleanse / moisturise / protect with AM/PM context, replaceable products, size selection and accurate bundle total | Creates a distinctive guided shopping experience |
| Ingredient spotlight | One ingredient photograph, a plain-language benefit and links to relevant products | Connects education with shopping; avoid claiming suitability beyond available data |
| Product suitability summary | Small structured rows: intended skin types, texture, finish and use timing | Makes product comparison easier |
| Mobile purchase bar | Selected size, price and Add to bag; appears only when the original purchase controls leave view | Keeps buying reachable without obscuring content |
| Local partner finder | Olive panel with city selector, verified availability and compact partner results | Turns a long strip into a useful local shopping tool |
| Customer stories | Approved reviews with texture/application photographs and disclosed skin type where provided | Gives useful context beyond star ratings |
| Product comparison | Compare two or three products on texture, size, price and intended use | Supports decisions without adding another promotional carousel |
| AI recommendation cards | Product, current price/stock, match reason, view details, choose size and add action | Makes AI advice actionable and inspectable |

Use actual product assets and catalogue metadata. Build empty states for unavailable metadata rather than inventing attributes. These components do not all belong on the landing page: comparison and detailed suitability belong primarily in discovery/product detail.

## Seven motion opportunities

Shared curves: OUT = cubic-bezier(0.23, 1, 0.32, 1); MOVE = cubic-bezier(0.77, 0, 0.175, 1); DRAWER = cubic-bezier(0.32, 0.72, 0, 1). Animate transform and opacity; motion must not block interaction or defer successful cart updates. Keyboard focus changes remain immediate.

| Priority / surface | Current evidence | Purpose / frequency | Proposed recipe |
| --- | --- | --- | --- |
| 1. Product → bag | ProductCard add controls and AddToCartSheet lack a shared source-to-destination story | Feedback and spatial consistency; occasional | After confirmed success, move a small duplicate thumbnail from the selected control to the visible cart in 280ms OUT, scale 1 → .35, rotate 0 → 12deg, fade at destination. Badge pulse 1 → 1.12 → 1 in 160ms OUT. Announce the confirmed quantity immediately. Respect concurrent additions and server failures. |
| 2. Daily ritual selection | DailyRitualShowcase.tsx:40–44 remounts an image using a key; a transition class alone does not crossfade two states | State indication; occasional | Crossfade old/new imagery in 200ms OUT; selected marker translates between steps in 200ms MOVE. Keep text stationary. Same image dimensions prevent layout jumps. |
| 3. Product texture preview | ProductCard currently scales its image on hover | Explanation of the physical product; occasional browsing | With real alternate assets, crossfade bottle → texture/application image in 180ms OUT. Provide explicit image selection for touch and keyboard. No hover-only information. |
| 4. Ingredient discovery | Existing ingredients live in the product-detail accordion | State indication; occasional | A selected ingredient opens an anchored explanation with opacity 0 → 1 and scale .98 → 1 in 180ms OUT; origin at its trigger. Escape dismisses and returns focus. |
| 5. Bag / product sheet | Existing add-to-cart sheet provides the relevant interaction surface | Spatial consistency; occasional | Translate from its opening edge to rest in 250ms DRAWER; backdrop opacity 0 → 1 in 180ms OUT. Exit along the same path. Support interrupted close/open. |
| 6. One hero introduction | EditorialHero already has slideshow controls, but images switch using hidden | Explanation and preventing abrupt changes; first arrival / occasional slide change | First arrival: headline opacity and translateY(12px → 0) in 450ms OUT, CTA starts 60ms later. Subsequent slides crossfade imagery only in 250ms OUT. Never delay CTA availability. Keep pause, focus pause and hidden-tab handling. |
| 7. Skin-scan stages | Scan intro, capture, processing and results are distinct views | State indication; occasional | Crossfade stages in 180ms OUT. While waiting, show an indeterminate opacity pulse 0.55 → 1 over 1200ms ease-in-out, plus honest status text. No percentage, fabricated measurements or simulated detection. Results become interactive immediately. |

Reduced motion: replace travel/rotation/scale with a 150ms opacity change; retain clear status text. Gate hover previews using `(hover: hover) and (pointer: fine)`. Animate only visible surfaces; no full-page mouse-driven effects. Preload only the next necessary image, not every large asset. Validate on a midrange phone and slower connection.

## Deliberately rejected

- Constant skew/tilt across product grids: browsing is frequent and text/price readability matters. If skew is explored, reserve a maximum 2-degree decorative treatment for one editorial image, never reading surfaces.
- Automatically rotating every product/category image: competing movement makes the page hard to scan. Existing RotatingTileImage uses an 8-second timer and 1-second fades; prefer explicit browsing for product choice.
- Replaying every section entrance on upward/downward scroll: repetitive delay with no new explanation.
- Animated dashboard balances, fake scan scores and decorative progress percentages: functional data should be stable and truthful.

## Gemini findings and work

Confirmed locally: backend GEMINI_API_KEY is empty; configured chat model is gemini-2.0-flash, vision defaults to gemini-2.5-flash. Configuration presence is not a successful provider check. No key or private provider response has been printed.

Backend changes: chat deadline reduced from 25s to 15s so the provider deadline fits inside the existing 20s production proxy; explicit structured reply/vision schemas; safe errors for upstream/network/empty/malformed chat output; removed a vision thinking setting tied to particular models; added `npm run ai:check` and optional `-- --live` checks. Google documents schema-constrained generation at https://ai.google.dev/gemini-api/docs/structured-output .

From backend/, configure the key in .env.local or the hosting environment, choose supported text/image models for the account, restart, then run `npm run ai:check -- --live`. This makes two small provider calls using a text prompt and a generated non-face image; it uses quota but no customer photo. It does not prove database access, public routing, real face assessment quality or in-stock recommendation rendering. Verify those through the running application afterward.

Remaining improvement: guest chat currently sends only the latest turn, and catalogue grounding matches keywords against product name/subcategory. Concern-led queries can therefore find no products despite available stock. Add bounded conversation context and test concern-to-catalogue retrieval with real published inventory before claiming recommendation quality.

## Delivery order

1. Restore live AI configuration and verify chat, consented scan, catalogue matching and failure recovery.
2. Correct review counts, scan presentation and typography hierarchy.
3. Deliver cart flight and accurate routine interaction as the signature commerce work.
4. Add richer photography, concern discovery and product information.
5. Polish hero, sheet transitions and local partner finder; test visually on mobile and desktop.

Ambassador follow-up: reuse the partner shell for overview, campaigns, submissions, referral links, earnings, resources and support. Current shell accepts creator/distributor only; preserve ambassador-specific approval and agreement checks when extending it.
