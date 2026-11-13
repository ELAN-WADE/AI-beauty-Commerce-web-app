# Social profile links and partner integration direction

## Implemented profile-link workflow

Approved creators can save, edit and remove TikTok/Instagram profile URLs in the
existing content editor. Profile buttons open the official HTTPS profile in a
new tab with opener isolation. The server accepts only the appropriate platform
host and profile path, removes tracking parameters, and scopes records to the
signed-in approved creator. No API credentials, passwords or social tokens are
collected. A saved link is explicitly unverified and supplies no follower counts.

Campaigns already accept published social-post links. Creators publish on the
platform itself, paste the post URL into the existing campaign submission, and
DESLA reviews the deliverable. Wording no longer promises automatic provider
verification or bank payments. Existing contracts and payout review still apply.

Coloured SVG icons replace the letter placeholders. The layout is retained.
Saving errors retain the entered URL; the dialog supports Escape, keyboard focus
containment and focus return. Removing a profile link does not revoke or delete
any previously stored OAuth authorization. OAuth implementation is retained as
an optional future integration but is not used by this UI flow.

Persistence uses existing workspace records (`SOCIAL_PROFILE_LINK`) rather than
a schema change. No sample records, public profile directory or financial credit
is created. Publication to GitHub is authorized; deployment follows the hosting configuration.

## Proposed shared partner integration — existing dashboards first

Do not restore the separate black-and-gold shared portal that was reverted.
Keep the storefront and the creator/distributor dashboards in their current
visual system. Use one identity and preserve all existing approvals.

A small programme selector in the existing workspace header/sidebar can expose
only the programmes already approved for that account. Unapproved programmes
belong in the existing application flow, with pending/declined states. Switching
programme changes available actions and data scope, not credentials or accounts.

Suggested capability mapping:

- Creative Collective: content editor, library, briefs and reviewed deliverables.
- Influence Circle: campaign participation, published links, referral performance.
- Trade Network: the existing distributor inventory, fulfilment and restock tools.
- Inner Circle: assigned ambassador campaigns, agreements and deliverables.
- Referral Partners: attributable referral links and eligible earnings records.

Admin should review these within the existing Partner Applications tab, with
programme-specific approval, recorded agreements, verification and revocation.
Server checks must enforce each capability; hiding sidebar entries is insufficient.
Do not silently reclassify current creators as influencers, grant stock permissions
through ambassador approval, or unlock payouts merely for registering.

Before implementing financial or programme-specific automation, define eligibility,
commission/fee rules, agreement requirements and the payment provider. Referral
attribution and accepted deliverables must feed the existing audited ledger,
with idempotent booking, reversals and explicit payout states. No new programme
roles, memberships, portal or automatic payouts are introduced in this change.
