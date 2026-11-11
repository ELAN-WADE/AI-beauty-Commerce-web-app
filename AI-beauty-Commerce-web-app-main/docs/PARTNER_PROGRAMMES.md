# DESLA partner programme workflow

The supplied five reference images define a shared partner portal at `/partners`.
The existing creator and distributor dashboard layouts are preserved. The creator
editor's TT/IG initials are replaced with local brand SVGs. Existing homepage card
copy and layout are preserved; creator/distributor entries lead to programme
selection. The new portal follows the black, charcoal, gold and two-column cards
in the references, with Referral Partners spanning both columns.

## Programmes and independent roles

- Creative Collective: `PARTNER_CREATIVE`, content production.
- Influence Circle: `PARTNER_INFLUENCE`, campaigns and affiliate activity.
- Trade Network: `PARTNER_TRADE`, trade programme activity.
- Inner Circle: `PARTNER_AMBASSADOR`, selected brand ambassadors.
- Referral Partners: `PARTNER_REFERRAL`, referral programme activity.

One verified account can apply to several programmes. Each application remains
pending until a reviewer with `partners:review` records a decision. Approval
requires completed verification and agreement references. Application review,
role grant, audit event and notification enqueue are atomic. The server checks
both the approved membership and role before allowing activity submission.
Existing creator/distributor approvals are preserved and are not silently
reclassified or revoked. These new programme roles grant no administrator,
legacy wallet, commission, inventory or payment permissions.

## Operation

1. Open `/partners`, choose a programme and sign in with the existing account.
2. Submit the application. Repeated submission returns the original record.
3. Admin opens Partner Applications. The new programme queue appears above
   existing creator/distributor applications, and contributes to pending badges.
4. Review eligibility and required documents outside the form; record their
   references, then approve or reject with a note.
5. The existing account-email worker delivers the persisted decision and portal
   link. It discards stale decisions, wrong recipients and unverified accounts.
6. The partner refreshes status or returns to the portal with the same account.
7. Approved partners submit programme activities with an idempotency key.
   Admin can accept/reject activities with feedback. Acceptance does not publish
   them automatically to the public community or create a financial credit.

Storage uses existing `workspace_records`, `roles`, `user_roles`, audit and email
outbox tables. No new migration or sample business data is required. New
programme roles are created transactionally only when approved.

## Remaining external and commercial setup

This release provides applications, programme access, submitted activities,
moderation and decision emails. Existing operational creator/distributor tools
remain available under their existing approvals. It does not complete all
programme-specific commercial workflows. Commission rates, eligible conversion
rules, ambassador contracts, trade setup and referral attribution must be defined
before activating new programme earnings. Select and configure the payout
provider before automatic transfers; no successful payout is simulated.

TikTok and Meta account connections already have OAuth endpoints. No local
TikTok/Meta credentials were present during this change. Configure app IDs,
secrets, registered callbacks, supported graph version and token encryption key
in the backend secret store. Content publishing requires its own approved API
permissions; login/profile access alone does not authorize cross-posting.
