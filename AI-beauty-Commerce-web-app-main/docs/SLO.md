# Service objectives & production posture (Part X)

Targets are proposals until measured on staging (Part XI). Do not quote them
to customers until a month of `/api/admin/metrics` history backs them.

## Objectives (trailing 30 days, staging → production)

| Signal | Objective | Source |
|---|---|---|
| Checkout success (order created → PAID, excl. user Abandons) | ≥ 98% | `orders` + `payments` ledger |
| Storefront availability (`/api/ready`) | ≥ 99.5% | edge health checks |
| Catalogue p95 | ≤ 400 ms | budgets in `PERF-BUDGETS.md` |
| Checkout p95 (server time) | ≤ 2.5 s | metrics `db.roundtripMs` + spans |
| Webhook settle lag (event → PAID) | ≤ 5 min | `payment_events` vs `payments` |
| Worker backlog (`pending` outbox older than 15 min) | 0 sustained | metrics `outbox24h` |

## Error budget policy

- Budget burn on checkout/payment paths freezes non-critical deploys (AI,
  community, editorial) until recovered.
- Bulkhead 503s (AI/reco/skin saturation) never consume the checkout budget —
  they are the system working as designed (Part V).

## Recovery targets

- Provider outage: flip the `stripe` (or equivalent) feature flag; transfer +
  remaining rails keep selling. No redeploy.
- Bad deploy: redeploy previous container tag (stateless app + worker;
  migrations are expand-only — safe to roll code back).
- Database: point-in-time restore is the **managed Postgres provider's**
  responsibility — record the provider, retention window and last restore
  drill here before launch: _TBD (staging task)._

## Region / latency posture (Part V + "keep infra close")

- App compute, worker and PostgreSQL must live in the same region
  (Lagos/Johannesburg-facing EU region at minimum; same-provider private
  networking). Cross-region DB roundtrips multiply every checkout transaction.
- Object storage bucket in the same region as compute.
- Verify with `db.roundtripMs` from `/api/admin/metrics` after deploy:
  same-region p50 is single-digit ms; anything consistently >50 ms means the
  app and DB are not actually close — fix placement, not code.
