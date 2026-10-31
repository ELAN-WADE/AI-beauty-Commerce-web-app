# Mobile, community and Google validation

This pass keeps the established storefront and partner/admin designs. It changes the requested mobile controls and connects community publishing/moderation to saved records.

## Mobile changes

- Mobile announcement ticker hidden; hero Shop now CTA; Flex carousel reset removed.
- Actual account avatar/initial without the green presence dot.
- Five external SVG destinations: Home, Shop, Scan, Community, Account. AI uses a right-side floating bar.
- Compact community heading/share controls and a section dropdown for feed, video reels, conversations, shopping, distributor lookup and Creator Studio.
- Search retains its adjacent return button, without a duplicate header back button. Search suggestions come from the actual catalogue; recent searches start empty.
- Scan keeps its original photo/3D interface. Mobile back controls and persistent unavailable banner are hidden; unavailable analysis remains disabled, and action errors are still shown.
- Quick-view labels are text only; location/stock availability stays minimal. Touch inputs use 16px text, with existing safe-area spacing preserved.

## Saved community workflow

Signed-in members can publish entered text without fabricated stock media or a verified-purchase identity. Optional photos/videos use the staged upload endpoint and signed PUT; the server checks stored bytes before publishing. Video reels use actual video controls. Failed publication preserves the draft.

Product tags resolve an active saved product and return its public slug, so routine links lead to the matching product. Creator role names map correctly to the existing UI. Community feeds refresh on entry, foreground focus and a visible-page interval.

The existing admin CMS post composer now includes paginated hidden/visible community posts and reversible Hide/Restore controls. Server permissions and session checks protect moderation. Customer purchase badges require a real paid, non-cancelled order; moderation alone does not fabricate purchase proof.

## Google sign-in and search

OAuth regression tests cover customer, creator and distributor intent, PKCE/state handling, correct returns and the separate admin email restriction. An application intent does not grant a partner role; administrator approval remains required. No new Google consent session or external verification email is sent by these checks.

Public product routes provide server metadata, canonical links and Product JSON-LD using saved prices, variants, images and actual review counts. Absolute image URLs stay intact and embedded JSON escapes script delimiters. The main storefront now has a dedicated public product route with the requested product seeded into its existing interface.

Dynamic robots and sitemap routes replace the old static robots files that conflicted with Next.js. Private account, login, checkout and role workspaces send noindex headers. The private admin entry is excluded from published sitemap URLs. Backend missing-product pages may stream HTTP 200 before rendering Next.js not-found; they include noindex metadata. The main storefront returns 404 for an unknown product.

Set PUBLIC_SITE_URL to the real production HTTPS storefront origin before the production build and deployment. Canonicals/sitemaps must not advertise localhost, credentials or a path as the site origin. Google Search Console ownership/submission and live indexing are separate deployment checks. Meta keywords are intentionally omitted: [Google does not use them for ranking](https://developers.google.com/search/docs/crawling-indexing/special-tags).

## Verification and limits

The auth, workspace, publication, catalogue, media and user-journey batch passed 97 tests; the corrected isolated community/review suite passed another five, and five SEO tests passed (107 total). Both production builds and TypeScript checks passed. Chrome captured-response checks passed on both ports for mobile navigation, floating AI, text-only routine publication, no horizontal overflow and chat input. Admin CMS editing/reordering/publication, post publication and Hide/Restore passed with no browser errors. SEO HTTP/helper checks passed on both ports. Further mobile checks confirmed one search return control, empty fresh search history and the preserved scan interface without mobile back controls or the persistent alert banner.

Browser fixtures do not create live accounts, posts, purchases or email. Chrome mobile emulation is not a physical iPhone/Android acceptance test; Safari keyboard, camera and hardware safe-area behaviour still need device testing. These checks do not certify live social publishing, payments, Gemini analysis or SMTP inbox placement.
