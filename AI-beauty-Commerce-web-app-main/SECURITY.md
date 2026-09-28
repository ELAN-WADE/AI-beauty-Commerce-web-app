# Desla!™ Security Policy — keeping the storefront unhackable (practical baseline)

Threat model: Vite SPA (public) + Supabase (Postgres/Auth/Storage) + Upstash Redis
(cache) + Paystack/Flutterwave money flow. Attackers get the JS bundle and the anon
key — the design assumes that and still holds.

## 1. What was found in this repo (honest audit)

| # | Finding | Severity | Fix |
|---|---|---|---|
| 1 | `Screen11Payment.tsx:48-52` — live test card + PIN **hardcoded**; `:89-116` payment "processing" is `setTimeout`, order created client-side with zero verification | **Critical** | checkout-init + `paystack-webhook` Edge Function + `payments` table (scaffolded: `supabase/functions/paystack-webhook`, `migrations/002`). Delete test card data before any staging deploy |
| 2 | No auth — every user is hardcoded `initialUserProfile`; RLS owner-policies unenforceable until login exists | **Critical** | Supabase Auth email-OTP → `profiles`; guest checkout via `session_id` only |
| 3 | No admin area; no roles | High | `profiles.app_role` claim; Dashboard for Phase-1 ops |
| 4 | No VCS (`git rev-parse` fails) — no history, no rollback, no reviewable deploys | High | `git init`, first commit, branch protection (see CI) |
| 5 | Secrets discipline currently fine (only anon-key-shaped `VITE_*`) — keep it that way | Medium | Rule below: service_role / Paystack secret / Upstash token **never** `VITE_*`, never committed |
| 6 | `index.html:6` disables pinch-zoom (`user-scalable=no`) — a11y + UX smell | Low | Allow scaling; keep `viewport-fit=cover` |
| 7 | AI scan uses live camera (`Screen14AISkinScan.tsx:37`) with no consent record, no retention rule | High (Phase 2 blocker) | Consent checkbox → consent row; private bucket, signed URLs, 30-day auto-delete |

## 2. Defence layers (each layer independent — one failure must not cascade)

1. **Edge / transport:** HTTPS only (HSTS), security headers at reverse proxy
   (`Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `frame-ancestors 'self'`,
   `Referrer-Policy: strict-origin-when-cross-origin`), WAF/rate-limit login + webhook.
2. **AuthN/Z:** Supabase Auth (OTP, breached-password protection on); **RLS is the
   enforcement point** — browser gets anon key; owner-policies on orders/payments/carts;
   admin via signed `app_role` JWT claim, never a client flag.
3. **Money path:** browser → checkout-init (Idempotency-Key) → Paystack → signed webhook
   → ledger upsert on `UNIQUE(reference)` → fulfil. Browser can never set `paid`.
4. **Data:** least-privilege policies (public-read catalogue only); PII (address/phone)
   encrypted in transit + at rest (managed); backups + PITR on prod project.
5. **Cache:** Redis holds public catalogue only — no PII, no sessions, short TTLs;
   cache poisoning bounded by TTL + key namespacing per env.
6. **Supply chain:** lockfile commits, `npm audit` in CI, Dependabot, least-permission CI tokens.

## 3. OWASP Top-10 mapping (web snapshot)

- **A01 Broken Access Control** → RLS on every table; deny-by-default; test each policy as anon + owner + stranger.
- **A02 Crypto Failures** → TLS everywhere; no card data touches our servers (Paystack fields only); secrets in Edge Function secrets/CI secrets.
- **A03 Injection** → PostgREST parameterised; Edge Function validates shapes; never interpolate input into SQL.
- **A07 AuthN failures** → OTP + rate-limited login; session via Supabase (httpOnly cookies where SSR later); logout revokes.
- **A08 Data/software integrity** → webhook HMAC verify **before** parse-trust; lockfile + CI provenance; signed deploy artefacts.
- **A09 Logging failures** → structured logs with `request_id` on every function; alert on webhook 4xx spike, RLS denials, idempotency replays.
- **A10 SSRF** → Edge Functions allowlist outbound hosts (Paystack API, Upstash); no user-supplied URLs fetched.

## 4. Rate limiting (Redis-backed, cheap and effective)

- Login/OTP: 5 attempts / 15 min / IP+email → 429 + `Retry-After`.
- Webhook: 60 req/min/IP (Paystack retries with backoff — idempotent, so safe).
- Catalogue reads: cache-first; origin shielded by 3600s TTL.
- AI endpoints (Phase 2): per-user daily quota + consent check first.

## 5. AI image privacy rules (Phase 2 gate — do not launch AI without these)

Explicit in-app consent (proposal §6/§7) → consent event row; uploads to **private**
bucket via signed URL; EXIF stripped; auto-delete original ≤ 30 days; structured
result only; recommendations filtered `in_stock=true` from catalogue query
(prompt text is never the filter). Minors: no face scans without guardian consent.

## 6. Incident basics

Security contact in footer + `SECURITY.md` pointer; on suspected breach: rotate
Paystack secret + service_role, revoke sessions, freeze fulfilment, diff `payments`
ledger vs Paystack dashboard (ledger is append-mostly — tampering is visible),
notify affected users within 72h. Quarterly: re-run this checklist + dependency audit.
