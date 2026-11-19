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

## Three partner roles

Customer and Administrator remain separate from these three partner roles:

| Role | Programme names | Responsibilities |
| --- | --- | --- |
| Creator | Creative Collective | Content production, briefs and reviewed content. |
| Influencer / Ambassador | Influence Circle and Inner Circle | Brand promotion, assigned campaigns, ambassador activities and reviewed published links. |
| Distributor | Trade Network | Stock, restocking, orders, fulfilment and sales. |

Influencer and Ambassador are one persisted role, `INFLUENCER`. There is no separate
Ambassador grant, duplicate sign-in or automatic conversion of existing creators.
Referral tracking is a capability, not an additional partner role.

## Account and application journey

Visitors can open the Influencer / Ambassador link alongside the other partner
links, or visit `/partner-programme`. Google and email sign-in use the existing
customer identity and return to that page. Signing in does not grant partner access.

The applicant submits a name, public social profile and partnership proposal.
The request appears under Admin > Partner Applications and contributes to the
pending request count. An administrator with `partners:review` records a review
note, verification reference and the actual programme agreement before approval.

Approval queues a decision email through the existing account-email worker.
The applicant signs in with the same account, reads the agreement and accepts
its current version. Only then does the combined role activate. Declined or revoked
applicants can update their information and submit again for a new review.

## Workspaces and permissions

The existing creator/distributor designs remain in place. Their Programme selector
lists only approved, verified workspaces; other choices lead to application/status
pages. The combined Influencer / Ambassador workspace follows the same visual system.

Admins assign campaign or ambassador briefs to an activated member. That member
submits a published HTTPS link and delivery note. Admin can approve the deliverable
or request changes; resubmission updates the same delivery record. Completed work
and review notes remain visible to its owner. Activity assignment supports safe retries.

Server operations enforce the membership, role, verification, accepted agreement
and resource owner. Revocation removes only the combined role and immediately
blocks its operations, including requests from an existing session. Creator and
distributor approvals, data and permissions are preserved.

Programme records, agreement versions, assignments and deliveries use the existing
workspace records with unique account/programme keys and transactional audit logs.
No schema migration or sample profile is introduced by this role change. Programme
role definitions are provisioned transactionally during administrator review.

## Automatic commission attribution

Administrators set an individual Influencer / Ambassador commission percentage
(0 to 50%, with 0 disabling earnings). Initial approval records the rate with
the agreement. Updating the rate requires a new agreement acceptance; existing
orders retain their original rate snapshots. Creator and Distributor rates remain
unchanged.

An activated partner receives a unique referral code and a shareable catalogue
link. The existing referral capture carries that code through sign-in to checkout.
The server validates role, membership, verification and agreement acceptance,
prevents self-referral commission, and records one immutable attribution per order.
No client can supply the payable rate or amount. Influencer codes do not invent
a customer discount or grant Creator permissions.

Verified paid retail orders credit commission on merchandise after discounts,
excluding delivery fees. Unpaid and wholesale orders do not credit it. Settlement
uses balanced journals with unique order/wallet awards, so retries cannot pay
twice. Delivery and the configured hold period govern release; refunds reverse
pending or cleared commissions through the existing ledger.

The partner workspace displays the real pending and available ledger balances.
Bank disbursements remain subject to payout review; an available ledger balance
is not a claim that a bank transfer has occurred.
