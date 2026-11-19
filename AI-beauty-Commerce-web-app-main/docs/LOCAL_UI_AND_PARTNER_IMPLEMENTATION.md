# Local UI and partner programme implementation

Implemented 18 November 2026. Changes are local; no GitHub push or deployment was performed.

## Storefront

- Manrope heading roles and Segoe UI body/system fallback; removed the universal font coercion and restored meaningful weight values.
- Hero entrance and slideshow crossfade, existing pause/reduced-motion handling retained.
- Concern-led discovery uses available catalogue products; honest empty states when no matching inventory is loaded.
- Product comparison uses published sizes, prices, skin types, ingredients and usage metadata, with explicit missing-data labels.
- Alternate product imagery appears on precise-pointer hover or keyboard focus; the product-detail gallery retains explicit image controls.
- Product-to-bag flight waits for a successful cart save, cancels on failure/account change and respects reduced motion. Integrated with cards, quick view, product details and routine bundle controls.
- Routine transitions, dynamic step count and total; removed the fixed ₦54,000 total.
- Mobile purchase bar appears after the primary product purchase control scrolls above the viewport.
- Olive local-partner callout links to the existing city/availability finder.
- Scan stage transitions, no fabricated Glow Index display, and an empty recommendation state.
- Product review count uses the catalogue aggregate rather than an added fixed 482. Existing review-read access policy is preserved.
- Sign-in and Client Sanctuary content/navigation remain intact.

## Partner programmes

- Creator and distributor application submission queues an acknowledgement in the same database transaction. A duplicate pending submission returns the existing application without another email.
- Influencer/ambassador submission uses its own submitted-email template, separate from decision updates.
- Decision emails are built from committed account-owned records and suppress stale status/version updates. Existing creator/distributor approval delivery hooks are retained.
- Submission emails explain that the application is under review and the reference is not an approved partner ID. Approval emails include the existing approved creator/distributor UUID.
- Admin review notes remain visible in application status, decision emails and ambassador deliverable reviews.
- Delsla replaces legacy Glowly/Glowy email copy and legacy sender display names for SMTP/Brevo. Sender addresses and credentials are not changed.
- Influencer/ambassador workspace navigation: overview, campaigns, submissions, earnings, resources and support. Approval, verified-role and current-agreement checks remain enforced by the backend.
- Versioned, downloadable interim draft contracts for creators, distributors and influencers/ambassadors appear on application/workspace screens. The admin agreement field starts with an editable draft when no agreement exists.

Draft text covers accurate applications, scope, honest advertising, content rights, privacy, sales/refund eligibility, commercial schedules, suspension and dispute handling. It does not invent compensation amounts, grant perpetual content rights, replace final commercial schedules or waive mandatory rights. The legal entity, effective date, notice details, governing law and signatures must be completed before execution. References consulted: [FCCPC consumer rights](https://fccpc.gov.ng/consumers/consumer-rights-responsibilities/rights-responsibilities/) and [ARCON advertising vetting](https://www.advertcouncil.gov.ng/_adverts_vetting.php).

## AI

Existing provider fixes include structured output and safer bounded error handling. Guest chat now carries bounded conversation history; concern keywords expand catalogue retrieval. The backend key was absent during the configuration check. Configure GEMINI_API_KEY and supported model IDs in the backend environment, restart, and run `npm run ai:check -- --live` from backend/. This consumes provider quota and tests synthetic non-face image transport without customer photos. Then test a consented real scan and published in-stock recommendations through the application.

## Verification limits

Final checks: 59 tests passed across nine focused suites, backend TypeScript check passed, and `git diff --check` passed. No push, commit or deployment was performed.

Application transactions, duplicate submission behaviour, recipient ownership, stale-message suppression, review notes, approved IDs, role gates, cart and AI clients are covered by focused tests. SMTP/Brevo transport tests use mocked delivery; no real recipient delivery is claimed. Landing page compilation and browser rendering were inspected. The preview had no loaded catalogue products, so signed-in cart-flight behaviour, populated comparison states and real device touch/animation performance still need end-to-end verification against a configured test backend.
