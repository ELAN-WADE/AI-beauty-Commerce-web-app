# Desla partner network — implementation contract

## Scope

The first release supports one fulfilment location per order, city/state matching,
delivery or pickup, location-scoped partner operations, stock transfers, creator
referrals, an earnings journal and manually reconciled payouts. Distributors
additionally purchase wholesale stock for direct resale under admin-configured
terms, tracked as a separate stock pool. GPS distances, split shipments,
automatic bank disbursements and sales-target bonuses remain subsequent
capabilities. Existing catalogue prices remain brand-controlled.

## Invariants

- `stock_levels` becomes keyed by `(location_id, variant_id, pool)`. This evolves the
  existing authoritative ledger instead of introducing a second stock authority.
  The `PLATFORM` pool fulfils customer orders and earns commission; the
  `WHOLESALE` pool is distributor-owned stock for direct resale. The pools never
  mix: routing, reservations and availability read `PLATFORM` only, and wholesale
  receipt credits `WHOLESALE` only.
- Existing central balances, reservations and movements belong to `HQ-LAGOS`.
  Existing distributor balances are migrated once to inactive partner locations.
  Activate a partner location only after assigning its owner and delivery settings.
  `distributor_stock` is retained as a historical migration source, not a writer.
- Routing considers quantities and every line. A city match must also match state.
  Only HQ provides the nationwide fallback. Pickup must name an eligible location.
  Checkout revalidates and reserves the chosen location in its transaction before
  payment. No automatic mixed-location cart or invented distance/ETA.
- Orders snapshot location, fulfilment method, partner and commission rates.
  A browser location ID is a preference, never authorization or a price quote.
- Expired reservations are re-acquired at the original location before settling a
  late payment. If stock is gone, the payment remains unresolved for reconciliation.
- Partner identity comes from the authenticated account and approved partner row.
  Portal queries and transitions are ownership-scoped on the server.
- Pickup collection requires a paid, ready order and a short-lived, hashed,
  rate-limited code issued to the customer. Partner APIs never expose the code.
- Transfers debit source stock at dispatch and credit destination stock once on
  receipt. Reserved units cannot be transferred. Dispatched stock is in transit.
- Earnings use balanced immutable journal postings in integer NGN kobo. Each
  business event has a unique deduplication key. Balance is derived from postings.
- Commission is based on merchandise after discounts, excluding shipping. Rates
  are snapshotted at checkout. Distributor rates start at zero until configured.
  Creator rates use the existing configured rate; no legacy scalar counters are
  converted into withdrawable money.
- Earnings are pending at verified payment and become available 14 days after
  delivery/collection by default (`COMMISSION_HOLD_DAYS`). Partial refunds reverse
  the proportional commission using cumulative refunded order value; full refunds
  reverse it entirely. Reversal after payout creates a recoverable negative
  available balance and blocks further withdrawal until offset.
- Withdrawal requests hold available funds atomically. The default minimum is
  NGN 10,000 (`MIN_PAYOUT_KOBO`). Bank details require explicit administrative
  verification; this release does not claim provider bank verification. Approval
  does not transfer money. Recording a paid payout requires a unique transfer
  reference and reconciliation evidence. Rejection/failure releases held funds.
- Refunds, pending payouts and out-of-order payment callbacks must not double
  credit, overspend, or strand an unrecorded financial operation.
- Wholesale purchases are `WHOLESALE`-kind orders with snapshotted terms
  (variant, cartons, unit price, minimums, tier, delivery fee). HQ platform
  stock is reserved transactionally at invoice creation; verified online payment
  (Flutterwave only — no manual transfer claims) debits HQ platform
  stock. Distributor receipt credits the `WHOLESALE` pool at their location
  exactly once (replay-safe). Wholesale orders never award retail commission,
  loyalty points, or creator discounts.
- A wholesale refund before dispatch restores HQ platform stock once; after
  dispatch, stock moves only via an explicit physical-return event recorded by
  staff with receipt evidence. Financial refunds use the standard refund
  workflow and never implicitly move stock. Distributor-recorded direct sales
  decrement the `WHOLESALE` pool with an idempotency-keyed event row, so
  retries cannot double-deduct.
- Commission and tier changes apply to future platform orders only; existing
  orders keep their snapshotted rates. Creator display metrics are derived
  from paid attributed orders and the journal (including reversals), never
  from legacy scalar counters.

## Interface additions

- `POST /api/routing/locate-stock`: city, state, method and quantity-bearing lines;
  returns full-cart options, server fees and recommended location.
- `POST /api/checkout`: additive `fulfilmentLocationId` and `fulfilmentMethod`.
- `GET /api/partner?kind=DISTRIBUTOR|CREATOR`: owned operations and wallet data.
- Partner bank accounts, withdrawal requests, stock restock requests and assigned
  order actions use authenticated, validated endpoints. Unsafe creates require an
  `Idempotency-Key`; reuse with different input is rejected.
- Admin network endpoints own location configuration, ownership, stock transfers,
  partner bank verification and payout review. Existing error envelopes apply.
- `GET /api/partner/wholesale`: tier-filtered wholesale catalogue (admin-set
  prices, carton sizes, minimums, HQ availability) plus the caller's invoices.
- `POST /api/partner/wholesale` with `action` `quote` (server-priced quote +
  fingerprint), `checkout` (idempotent invoice + HQ reservation; requires
  `Idempotency-Key` and an unchanged quote fingerprint), `receive` (credit
  owned stock on dispatch confirmation), `cancel` (unpaid invoices only),
  `directSale` (record direct resale against owned stock; idempotent).
- Admin `wholesalePrice` upserts the per-tier price book (existing invoices
  keep their terms); `wholesaleReturn` records a full physical stock return
  with evidence. Wholesale fulfilment (pack → dispatch) reuses the guarded
  order machine; receipt is confirmed by the purchasing distributor.

## Customer and portal UX

The customer chooses delivery or pickup and sees real eligible locations/fees.
Customer copy uses city and store names rather than inventory-node terminology.
Pickup confirmation shows the location snapshot and collection instructions.
Distributor operations prioritize assigned orders and stock; creator operations
prioritize referral links and earnings. Both show pending, available and held
amounts with the journal underneath. Loading, empty and failure states never fall
back to fabricated operational or financial data.
Distributor portals label the two pools explicitly ("Platform allocation" vs
"Wholesale · owned by you"). The wholesale tab shows only admin-configured
terms — no promised margins — with quote review, invoice download, gateway
payment, shipment tracking and receipt confirmation. The customer directory
shows live platform stock per location; off-platform contact is labelled as a
direct-purchase enquiry, and choosing a store carries the preference through
catalogue to checkout, where the full bag is revalidated before payment.
Creator workspaces use the authenticated profile's code, link and configured
rates, with metrics derived from verified sales and the journal.

## Verification

Run frontend build, backend typecheck, existing unit tests and PostgreSQL-engine
integration tests for migration/backfill, stock isolation, rollback, replay,
partner ownership, commission release/reversal and withdrawal holds. Embedded
PostgreSQL tests do not replace multi-connection concurrency tests on staging.
