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
# repo root = AI-beauty-Commerce-web-app-main/
docker compose up -d postgres redis minio mailhog
docker compose ps   # all healthy
```

## 2. Backend env (staging — secrets live HERE and in CI secrets, never git)

```bash
cd backend && cp .env.example .env   # then fill:
# DATABASE_URL=postgres://glowly:<strong-pw>@postgres:5432/glowly_staging
# APP_URL=https://staging.<domain>  FRONTEND_URL=https://staging.<domain>
# PAYSTACK_SECRET_KEY=sk_test_…  FLW_SECRET_KEY=FLWSECK_TEST-…  FLW_SECRET_HASH=<random>
# OPAY_* (sandbox)  BANK_* (business account)  SMTP_* (real)
```

## 3. Migrate + seed (in order — never ad-hoc SQL on staging)

```bash
npm ci && npm run db:migrate   # 0000 → 0006
npm run db:seed                # roles + permissions matrix
npm run db:seed:catalog        # DES- catalogue from storefront mocks
```

## 4. Bootstrap the first SUPER_ADMIN (psql — there is no self-signup for this)

```sql
-- register normally first, then:
INSERT INTO user_roles (user_id, role_id) VALUES ('<user-uuid>', 'SUPER_ADMIN');
```

## 5. Run backend + worker

```bash
npm run build && npm start &            # :3001 behind nginx (/api/* → :3001, / → storefront dist/)
npm run worker &                        # outbox, sweeps, purge
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

  location /api/auth/    { limit_req zone=auth burst=5 nodelay; proxy_pass http://127.0.0.1:3001; }
  location /api/webhooks/ { limit_req zone=webhook burst=10 nodelay; proxy_pass http://127.0.0.1:3001; }
  location /api/         { limit_req zone=api burst=40 nodelay; proxy_pass http://127.0.0.1:3001; }
  location /             { root /var/www/glowly-storefront; try_files $uri /index.html; }
}
```

## 6. Smoke suite (curl — every stage must pass before sign-off)

1. `POST /api/auth/register` → 201 (+cookie) → `GET /api/auth/me` → roles `[CUSTOMER]`
2. `GET /api/products?limit=5` → seeded DES- items with kobo prices
3. Guest cart: `POST /api/cart/items` (X-Session-Id) → `POST /api/checkout` with `Idempotency-Key` → 201 PENDING order, totals server-computed
4. Replay same `Idempotency-Key` → 200 `replay:true`, no duplicate order
5. `POST /api/payments/init` (provider `transfer`) → bank details → `POST /api/payments/transfer-claim` → admin `POST …/confirm` → order PAID, loyalty credited
6. Paystack/Flutterwave test flow → hosted page (test card) → webhook → `GET /api/payments/status` → `settled:true`
7. Replay a webhook payload → `replay:true`, single `payments` row
8. Tampered webhook signature → 401, nothing written
9. Cross-user order fetch → 404-shaped 403 envelope; admin without `orders:read:all` → 403
10. `POST /api/checkout` with `totalKobo` in body → 422 (client money rejected)

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
drill. Keep the hardcoded demo card in `Screen11Payment` — delete it now.
