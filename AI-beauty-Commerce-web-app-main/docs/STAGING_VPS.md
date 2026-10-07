# Staging on a single VPS (concrete setup)

Companion to `STAGING.md` (the acceptance suite). This file is the machine setup:
one Ubuntu 22.04/24.04 VPS, Docker for API + worker + staging Postgres,
Caddy for automatic TLS, static storefront. Staging only — production wants
managed Postgres, backups with PITR, and separate secrets management.

## 0. VPS + DNS (one time)

- Size: 2 vCPU / 4 GB RAM minimum (Next.js build + Postgres + worker).
- DNS: `staging.<domain>` → VPS public IP. Wait for propagation (`dig staging.<domain>`).
- Firewall: allow 22 (your IP only), 80, 443. Deny everything else, including 3001 and 5432.

```bash
sudo apt update && sudo apt upgrade -y
sudo ufw allow 22/tcp && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
sudo ufw --force enable && sudo ufw status
```

## 1. Docker + Caddy

```bash
# Docker (official repo)
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Caddy (automatic HTTPS, reverse proxy)
sudo apt install -y caddy
```

`/etc/caddy/Caddyfile` (replace the domain; API stays localhost-only):

```text
staging.<domain> {
  encode gzip
  header Strict-Transport-Security "max-age=63072000; includeSubDomains"
  header X-Content-Type-Options nosniff
  header X-Frame-Options DENY
  header Referrer-Policy strict-origin-when-cross-origin

  handle /api/* {
    reverse_proxy 127.0.0.1:3001
  }
  handle {
    root * /var/www/glowly-storefront
    try_files {path} /index.html
    file_server
  }
}
```

> The app also ships `backend/nginx.production.conf.example` with edge rate
> limits (`auth 10r/m`, `webhooks`, `api`). If you use nginx instead of Caddy,
> apply that file and set `EDGE_RATE_LIMIT_ENABLED=true` only once the proxy
> enforces them. Caddy alone does not rate-limit: keep this staging host
> unlisted and rotate it before production.

```bash
sudo systemctl reload caddy
```

## 2. Staging Postgres (container, volume-backed)

Staging tolerates a containerized database; production must not. Data lives in
a named volume; nightly `pg_dump` leaves the machine (see §5).

```bash
docker volume create glowly-staging-pg
openssl rand -hex 32  # staging DB password — store in your secret manager
# Localhost-only port (host-side migrate/seed) + compose-network name (api/worker).
docker run -d --name glowly-staging-pg --restart unless-stopped \
  -e POSTGRES_USER=glowly -e POSTGRES_PASSWORD='<staging-db-password>' \
  -e POSTGRES_DB=glowly_staging \
  -p 127.0.0.1:5432:5432 \
  -v glowly-staging-pg:/var/lib/postgresql/data \
  postgres:16-alpine
```

## 3. App checkout + secrets (never in git)

```bash
sudo mkdir -p /opt/glowly && sudo chown $USER:$USER /opt/glowly
git clone <repo-url> /opt/glowly/app
cd /opt/glowly/app/backend
cp .env.example .env.production && chmod 600 .env.production
```

Fill `.env.production` (see `STAGING.md §2` for the full list):

```env
NODE_ENV=production
# Host 'glowly-staging-pg' resolves inside compose (§4 joins that network).
DATABASE_URL=postgres://glowly:<staging-db-password>@glowly-staging-pg:5432/glowly_staging
APP_URL=https://staging.<domain>
FRONTEND_URL=https://staging.<domain>
SMTP_HOST=<smtp-host>
SMTP_PORT=587
SMTP_FROM=Glowly <hello@<domain>>
SMTP_USER=<smtp-user>
SMTP_PASS=<smtp-password>
AUTH_EMAIL_ENCRYPTION_KEY=<64-hex-chars>
CLIENT_IP_HEADER=x-verified-client-ip
EDGE_RATE_LIMIT_ENABLED=false
PAYSTACK_SECRET_KEY=<sk_test_…>
FLW_SECRET_KEY=<FLWSECK_TEST-…>
FLW_SECRET_HASH=<random-staging-secret>
BANK_NAME=<business-bank>
BANK_ACCOUNT_NUMBER=<…>
BANK_ACCOUNT_NAME=<…>
CONTENT_REWARD_BPS=200
```

Generate the email key on the VPS (never reuse dev keys):

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

The API and worker share this file, so they share the key (required for
sealed email links).

## 4. Migrate, seed, start

```bash
cd /opt/glowly/app/backend
npm ci
# Migrate/seed run from the host → override the host part to localhost only for these commands.
export DATABASE_URL=postgres://glowly:<staging-db-password>@127.0.0.1:5432/glowly_staging
npm run db:migrate   # 0000 → 0015; confirm 127.0.0.1 STAGING (never prod) first
npm run db:seed && npm run db:seed:catalog && npm run db:seed:partners
unset DATABASE_URL
# Start api+worker, then join the database container to their network.
docker compose -f compose.production.yml up -d --build
docker network connect backend_default glowly-staging-pg || true  # idempotent on redeploys
curl -s localhost:3001/api/health && curl -s localhost:3001/api/ready
docker compose -f compose.production.yml logs worker --tail 20  # outbox/settlement passes
```

Register the first user normally, then grant SUPER_ADMIN via psql (see
`STAGING.md §4`). Register provider test webhook URLs pointing at
`https://staging.<domain>/api/webhooks/<paystack|flutterwave|opay>`.

## 5. Backups (staging-grade)

```bash
# Nightly dump (crontab), retained 7 days, copied off-machine.
0 2 * * * docker exec glowly-staging-pg pg_dump -U glowly glowly_staging | gzip > /opt/glowly/backups/glowly-staging-$(date +\%F).sql.gz && find /opt/glowly/backups -mtime +7 -delete
```

Prove one restore to a scratch database before sign-off. Production needs
managed PITR instead of this.

## 6. Storefront build + deploy

Build with the staging API baked in, then sync `dist/`:

```bash
# on your machine (or CI)
VITE_API_URL=https://staging.<domain> npm run build
rsync -avz --delete dist/ <user>@<vps>:/var/www/glowly-storefront/
```

The build fails closed without an HTTPS `VITE_API_URL` in production mode.

## 7. Validate

Run `STAGING.md §6` items 1–14 (now includes auth email round-trip, pending
payment recovery, content-reward settle/release/reversal, worker recovery).
Record order numbers, references, and DB evidence per test — screenshots of
success banners are not acceptance.
