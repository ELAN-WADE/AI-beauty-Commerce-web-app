# Glowly Staging Bring-Up Runbook

Purpose: take the owned backend from "verified locally" to "staging-live" so
Phase-1 acceptance (§14) runs against real infrastructure. Requires a machine
with Docker + a public URL (webhooks need one — Lightsail/QServers VPS).

## 0. Provision (one time)

- VPS per proposal §10 (Lightsail $5 demo or QServers VPS-A). Open 443 (+80 for TLS).
- DNS: `staging.<domain>` → VPS. TLS via Caddy/nginx (compose addition, or
  provider LB terminates TLS).
- Provider test accounts: Paystack test keys, Flutterwave test keys + secret
  hash, Opay sandbox merchant (confirm Cashier paths on the dashboard first).
- MailHog is dev-only; staging needs real SMTP credentials.

## 1. Boot infrastructure

```bash
# Use a private managed PostgreSQL and private S3-compatible bucket. Do not
# run the root development docker-compose.yml on a public VPS (known passwords,
# published ports, MailHog). Start the production API/worker with the dedicated
# backend/compose.production.yml after provisioning secrets and TLS.
```

## 2. Backend env (staging — secrets live HERE and in CI secrets, never git)

```bash
cd backend
# Create a private .env.production from your secret manager (never copy dev .env.example).
# NODE_ENV=production; EDGE_RATE_LIMIT_ENABLED=true; CLIENT_IP_HEADER=x-verified-client-ip
# AUTH_EMAIL_ENCRYPTION_KEY=<64 random hex characters>; SMTP_HOST/USER/PASS/FROM=<TLS SMTP>
# DATABASE_URL=postgres://<user>:<secret>@<private-db-host>:5432/glowly_staging
# APP_URL=https://staging.<domain>  FRONTEND_URL=https://staging.<domain>
# PAYSTACK_SECRET_KEY=sk_test_…  FLW_SECRET_KEY=FLWSECK_TEST-…  FLW_SECRET_HASH=<random>
# OPAY_* (sandbox)  BANK_* (business account)  SMTP_* (real)
# CONTENT_REWARD_BPS=200 (default; 0 pauses the program for settlement testing)
# CONTENT_REWARD_MIN_MERCHANDISE_KOBO=50000  CONTENT_REWARD_HOLD_DAYS=14
```

## 3. Migrate + seed (in order — never ad-hoc SQL on staging)

```bash
npm ci && npm run db:migrate   # 0000 → 0015 (HQ backfill + network permissions + wholesale pools + content rewards)
npm run db:seed                # roles + permissions matrix (idempotent)
npm run db:seed:catalog        # DES- catalogue from storefront mocks
npm run db:seed:partners       # distributors/creators + location-scoped stock (locations start inactive)
```

## 4. Bootstrap the first SUPER_ADMIN (psql — there is no self-signup for this)

```sql
-- register normally first, then:
INSERT INTO user_roles (user_id, role_id) VALUES ('<user-uuid>', 'SUPER_ADMIN');
```

## 5. Run backend + worker

```bash
docker compose -f compose.production.yml up -d --build  # :3001 localhost-only; supervised worker
curl localhost:3001/api/health          # {"ok":true}
curl localhost:3001/api/ready           # {"ok":true,"db":"up"}
```

### Edge security (nginx — the outer wall, complements app controls)

```nginx
limit_req_zone $binary_remote_addr zone=auth:10m rate=10r/m;
limit_req_zone $binary_remote_addr zone=webhook:10m rate=60r/m;
limit_req_zone $binary_remote_addr zone=api:10m rate=120r/m;

server {
  listen 443 ssl;  # + HSTS below; port 80 only redirects to 443
  add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
  add_header X-Content-Type-Options nosniff always;
  add_header X-Frame-Options DENY always;
  add_header Referrer-Policy strict-origin-when-cross-origin always;
  client_max_body_size 1m;   # mirrors the app's 1 MB cap

  proxy_set_header X-Verified-Client-IP $remote_addr; # strip caller's spoofed header
  proxy_set_header X-Forwarded-For $remote_addr;
  location /api/auth/    { limit_req zone=auth burst=5 nodelay; proxy_pass http://127.0.0.1:3001; }
  location /api/webhooks/ { limit_req zone=webhook burst=10 nodelay; proxy_pass http://127.0.0.1:3001; }
  location /api/         { limit_req zone=api burst=40 nodelay; proxy_pass http://127.0.0.1:3001; }
  location /             { root /var/www/glowly-storefront; try_files $uri /index.html; }
}
```

## 6. Smoke suite (curl — every stage must pass before sign-off)

1. `POST /api/auth/register` → 201 (no cookie) → verify email → fresh cookie → `GET /api/auth/me` → roles `[CUSTOMER]`
2. `GET /api/products?limit=5` → seeded DES- items with kobo prices
3. Guest cart: `POST /api/cart/items` (X-Session-Id) → `POST /api/checkout` with `Idempotency-Key` → 201 PENDING order, totals server-computed
4. Replay same `Idempotency-Key` → 200 `replay:true`, no duplicate order
5. `POST /api/payments/init` (provider `transfer`) → bank details → `POST /api/payments/transfer-claim` → admin `POST …/confirm` → order PAID, loyalty credited
6. Paystack/Flutterwave test flow → hosted page (test card) → webhook → `GET /api/payments/status` → `settled:true`
7. Replay a webhook payload → `replay:true`, single `payments` row
8. Tampered webhook signature → 401, nothing written
9. Guest order fetch requires private order token (email alone returns 404); admin without `orders:read:all` → 403
10. `POST /api/checkout` with `totalKobo` in body → 422 (client money rejected)
11. Auth round-trip: register → verification email arrives → link verifies once → login works; reset link works once, revokes sessions, retry fails
12. Provider return with the provider unreachable → 302 back to `?pay=<ref>&pending=1&order=<DES-n>` (never a raw error page); shopper retries from the payment screen and confirms
13. Content rewards: approve a creator post (`rewardEligible`), place a coded test order, run `npm run worker:once` → one `content_rewards` row + PENDING journal; second approved post earns nothing on the same orders; release after hold clears to AVAILABLE; reconciled refund reverses proportionally
14. Worker recovery: stop the worker mid-outbox, restart → claimed work resumes, no duplicate payments/commissions/rewards (UNIQUE + journal eventKeys)

## 7. Frontend (staging)

```bash
cd AI-beauty-Commerce-web-app-main
VITE_API_URL=https://staging.<domain> npm run build   # dist/ served at /
```

Verify: catalogue hydrates (console `[glowly] catalogue live`), guest checkout →
hosted Paystack test page → return lands on confirmation, transfer order shows
proof form under Orders → Track, loyalty accrues after PAID.

## 8. Go-live deltas (staging → production)

New Postgres (PITR on), fresh secrets, `APP_URL/FRONTEND_URL` → prod domain,
provider LIVE keys + live webhook URLs re-registered, `npm run db:migrate`
before traffic switch, nightly `pg_dump` → object storage + quarterly restore
drill. No hardcoded payment card exists in `Screen11Payment` (verified); only
frozen mock display strings remain in `src/data/` — confirm none render in live mode.

## 9. Third-party activation checklist

| Integration | Status in repo | To activate |
|---|---|---|
| Paystack / Flutterwave / Opay | Built + tested (mock HTTP) | Test keys → smoke suite §6 → live keys + webhook URLs |
| Termii SMS/WhatsApp | Built + tested; log-falls-back when unset | `TERMII_API_KEY` (+sender ID); flip a template's outbox channel to `sms`/`whatsapp` |
| Sentry errors | Zero-dep reporter both apps, no-op without DSN | Create project → `SENTRY_DSN` / `VITE_SENTRY_DSN` → confirm first event + alert rule |
| Gemini AI | Seam built, mock default | `GEMINI_API_KEY` → verify analysis + chat responses + billing alert |
| Newsletter (Resend/Brevo) | **Not built** | Needs subscribers table + double opt-in + campaign worker (next build) |
| GIG Logistics API | Manual shipments only | Business account → request API access → implement provider seam |
| DHL / FedEx / UPS | Out of scope until international volume | Business account + developer program when justified |
| Cloudflare | No code needed | DNS → proxy on → WAF managed rules → Turnstile on auth (replaces need for CAPTCHA code) |
| Meta/TikTok pixels | **Not built** | IDs → pixel loader + ViewContent/AddToCart/Purchase events (next build) |
| FIRS e-invoicing | **Not built** | Confirm VAT status with accountant; if liable, invoice API becomes a compliance build |
| Google OAuth login | **Not built** | Cloud console client → callback route → link to users (friction reducer, optional) |
