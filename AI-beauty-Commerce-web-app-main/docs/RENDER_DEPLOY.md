# Render Deployment Guide (Dev / Staging / Production)

This guide walks you through deploying the **Desla / Glowly** application to [Render](https://render.com).

The repository includes a ready-to-use **Render Blueprint (`render.yaml`)** that sets up:
1. **Managed PostgreSQL Database** (`glowly-dev-db`)
2. **Full-Stack Web Service** (`glowly-app`) containing the Next.js Storefront, Partner Portals, Admin Console, and REST API
3. Automatic database migrations and seeds on every deploy via `preDeployCommand: npm run render:deploy`

---

## Method 1: Deploy with Render Blueprint (1-Click Recommended)

1. Push your repository to GitHub or GitLab.
2. Log into your [Render Dashboard](https://dashboard.render.com).
3. Click **New +** in the top navigation bar and select **Blueprint**.
4. Connect your GitHub/GitLab repository.
5. Render will detect `render.yaml` automatically and display:
   - **glowly-dev-db** (PostgreSQL)
   - **glowly-app** (Web Service)
6. Click **Apply**.
7. Render will automatically:
   - Provision the PostgreSQL database.
   - Run `npm ci && npm run build`.
   - Run migrations, seed the catalogue, partner hubs, and RBAC matrix.
   - Start the web service and verify health at `/api/ready`.

---

## Method 2: Manual Web Service Setup (Without Blueprint)

If you prefer configuring services manually in the Render dashboard:

### Step 1: Create PostgreSQL Database
1. Go to **New +** -> **PostgreSQL**.
2. **Name**: `glowly-dev-db`
3. **Database**: `glowly_dev`
4. **User**: `glowly`
5. **Plan**: Free (or Starter)
6. Click **Create Database**.
7. Once created, copy the **Internal Database URL** (or **External Database URL** if connecting from outside Render).

### Step 2: Create Web Service
1. Go to **New +** -> **Web Service**.
2. Connect your repository.
3. Configure the service settings:
   - **Name**: `glowly-app`
   - **Language / Runtime**: `Node`
   - **Root Directory**: `backend`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `node scripts/start.mjs`
   - **Health Check Path**: `/api/ready`
4. Under **Environment Variables**, add the following:

| Key | Recommended Value / Source | Description |
|---|---|---|
| `NODE_ENV` | `production` | Production build mode |
| `RENDER_DEV` | `true` | Enables dev deployment mode |
| `DEV_DEPLOY` | `true` | Allows dev defaults for optional 3rd-party services |
| `CLIENT_IP_HEADER` | `x-forwarded-for` | Render edge reverse-proxy IP header |
| `DATABASE_URL` | `<Your Render Database URL>` | Connection string from Step 1 |
| `DATABASE_SSL_MODE` | `require` | Required for external or cloud PostgreSQL |
| `ADMIN_ENTRY_PATH` | `/ops-desla-admin-portal-dev-2026` | Secret path to access Admin console |
| `ADMIN_BOOTSTRAP_EMAIL` | `deslaadmin@gmail.com` | Initial admin account email |
| `ADMIN_BOOTSTRAP_PASSWORD` | `<secure-random-password>` | Initial admin account password |
| `PAYMENTS_ENABLED` | `false` | Set `false` for dev without live payment gateways |
| `ALLOW_LOG_EMAIL` | `true` | Logs email verification tokens to Render console |
| `SKIP_PREFLIGHT` | `true` | Skips strict production-only checks in dev |

5. Under **Advanced Settings**, set **Pre-Deploy Command**:
   ```bash
   npm run render:deploy
   ```
   *(This runs migrations, RBAC seeds, catalogue seed, and boots the admin account automatically).*

6. Click **Create Web Service**.

---

## Verification & Health Check

Once deployment finishes:
- Open `https://<your-service-name>.onrender.com/api/ready`
  - Expected response: `{"ok":true,"db":"up"}`
- Open `https://<your-service-name>.onrender.com/api/health`
  - Expected response: `{"ok":true}`
- Open `https://<your-service-name>.onrender.com/`
  - Your luxury storefront will load with the seeded catalogue, cards, and navigation.

---

## Administrator Access

1. Open the private admin URL:
   `https://<your-service-name>.onrender.com/ops-desla-admin-portal-dev-2026`
   *(Standard `/admin` returns 404 by design for security).*
2. Log in using your configured `ADMIN_BOOTSTRAP_EMAIL` and `ADMIN_BOOTSTRAP_PASSWORD`.
3. Complete MFA authenticator setup when prompted (e.g., using Google Authenticator or Microsoft Authenticator).
4. Save your one-time recovery codes displayed upon MFA confirmation.

---

## Enabling Optional Services in Production

When moving from dev to live production on Render:
- **Real SMTP Emails**: Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, and remove `ALLOW_LOG_EMAIL`.
- **AWS S3 / Cloudflare R2**: Set `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `SCANS_BUCKET`, `COMMUNITY_BUCKET`.
- **Google OAuth**: Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI=https://<your-service-name>.onrender.com/api/auth/oauth/google/callback`.
- **Live Payments**: Set `PAYMENTS_ENABLED=true` with Stripe / Flutterwave credentials.
- **Switch to Strict Preflight**: Remove `RENDER_DEV` and `SKIP_PREFLIGHT` to enforce strict production validation.

