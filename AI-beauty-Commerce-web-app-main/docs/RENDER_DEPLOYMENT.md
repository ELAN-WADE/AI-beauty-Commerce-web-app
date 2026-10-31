# Render deployment handoff

Repository: https://github.com/ELAN-WADE/AI-beauty-Commerce-web-app.git

## Choose the production blueprint

Use AI-beauty-Commerce-web-app-main/render.production.yaml as the Blueprint path in this repository. The Git repository contains the application in a nested folder, so both service rootDir values are AI-beauty-Commerce-web-app-main/backend. The legacy render.yaml files describe development/staging settings; do not use them as the production configuration.

The production proposal contains a starter web service and starter auth-email worker. Importing/deploying it creates paid resources. No resources were created by preparing this source. DATABASE_URL points to an existing PostgreSQL database supplied by you. Automatic commit deploys are disabled in this template.

## Build and startup

Node 22 is selected. Render build installs all build dependencies, validates production settings, runs versioned migrations and the idempotent RBAC seed, generates Next route types, checks TypeScript, then builds ISR pages. Schema preparation precedes ISR reads to avoid building empty pages against a fresh schema. Use backward-compatible migrations because the existing service can still be serving requests while a replacement build runs. Preview services must use a separate database.

Pre-deploy repeats safe migrations/RBAC seeding and provisions the configured admin if requested. No sample catalogue or partner seeding is automatic. Native Render uses normal Next output/start; Docker retains standalone output. Startup validates environment settings, binds 0.0.0.0 on Render's PORT, and readiness checks actual SQL connectivity at /api/ready.

## Values to supply in Render

- DATABASE_URL and its TLS settings for the existing production database.
- APP_URL, FRONTEND_URL and PUBLIC_SITE_URL: the same actual HTTPS web-service/custom-domain origin for this full-stack deployment, without an appended path. Configure before building so sitemap/canonical metadata uses the correct domain.
- AUTH_EMAIL_ENCRYPTION_KEY and MFA_ENCRYPTION_KEY: independent 64-character hexadecimal keys. Preserve established keys when migrating encrypted records. The worker references the web service's values. Do not paste secrets into source or chat.
- ADMIN_ENTRY_PATH: a private operations path; ADMIN_BOOTSTRAP_EMAIL/password for first provisioning; ADMIN_GOOGLE_EMAIL for the administrator OAuth allowlist. Existing account passwords are not reset automatically.
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI. Register the exact HTTPS origin plus /api/auth/oauth/google/callback in Google Cloud. Customer, creator and distributor intent never grants an approved role by itself.
- SMTP_HOST/PORT/FROM/USER/PASS. Verify the sender/domain in Brevo. The dedicated worker sends verification/reset, account-access and partner-approval messages; SMTP settings alone do not run the dispatcher.
- Durable storage access/secret keys, region, buckets and COMMUNITY_MEDIA_BASE_URL. Scans use a private bucket. Product/community media uses a publicly readable URL with private writes. For R2/MinIO/custom S3 providers, add S3_ENDPOINT to both services; the optional endpoint is not prefilled in the template.

Payments remain disabled pending the separate payment integration acceptance. Do not enable development bypass/log-email flags to work around missing production configuration.

## First-deployment acceptance

After configuring and deploying both services, require /api/ready to return 200. Confirm the worker logs ready, request one new verification link, follow it, and sign in. Perform a fresh Google round trip for each intended role. Submit a creator/distributor application, approve it in admin, and confirm the same account receives its approved role and notification. Upload real hero/product media, publish it, and check the public storefront and a new browser session. Then check actual checkout/provider flows before enabling paid checkout.

The local audit passed configured admin password/session checks, Google-start routes, SMTP authentication, and customer/distributor browser journeys. That does not certify the hosted callback registration, delivery/inbox placement, production bucket permissions or payment settlement. Local .env files, runtime uploads, logs and test databases are excluded from this push.

Release validation: 67 targeted auth, email, hero, upload, catalogue and workspace tests passed. Optimized builds passed for Docker-compatible standalone mode and native Render mode with TypeScript checks enabled. The production YAML parsed successfully and its repository paths, disabled development bypasses, manual secret fields and disabled automatic deployments passed structural checks. This is local validation, not a hosted Render deployment or provider acceptance test.

## If the server starts but every catalogue/partner query fails

An SQL wrapper saying Failed query does not identify the cause. The API now logs recognized nested database/network error codes without SQL parameter values. Codes 42P01/42703 indicate missing tables/columns, 28P01 indicates rejected credentials, 3D000 indicates a missing database, and connection/DNS/TLS codes indicate transport configuration. Read the databaseCode/databaseHint fields rather than guessing from the query text.

Render startup now runs the read-only database/schema/integrity check before launching Next. An empty or outdated database must fail startup instead of showing a Ready web process whose routes all fail. Build performs the committed migrations and RBAC seed before ISR generation. In Render Shell, npm run db:check gives a read-only check; npm run db:migrate and npm run db:seed apply schema updates and roles to the configured DATABASE_URL. Confirm the database target before running mutations; never paste its credentials into logs or chat.

Logs showing the old Target directory/Launching server from startup messages or next start with standalone output indicate a different artifact than the current native Render configuration. Select the intended latest main commit, verify rootDir and commands against the production blueprint, then Clear build cache & deploy. Use the Render internal database URL for same-region services and DATABASE_SSL_MODE=require. The local checks do not establish the cloud database's state; a public service URL and fresh deployment logs are needed to verify the hosted result.

Diagnostic follow-up validation: 32 tests passed, including nested database codes/redaction plus auth-proxy and persisted catalogue regressions. Backend TypeScript and launcher syntax checks passed. No database rows, credentials, UI or cloud settings were changed in that follow-up.

## Root-wrapper and type-isolation correction

Render can invoke scripts/render-build.mjs from the outer Git root when Root Directory is unset. Those outer wrappers now delegate to the nested backend pipeline, as do the outer package build/start commands. The outer .node-version selects Node 22 even when Render starts from that directory. The old wrapper's Resolved target directory/Installing dependencies log wording is no longer emitted.

Backend production TypeScript now includes runtime source and generated route types, rather than tests and deployment-tool sources. Cross-app integration tests imported the frontend proxy and its separate next/server installation, which caused the reported Linux build failure. The verified type graph no longer includes frontend runtime code or frontend Next dependencies; dependency-free shared data/types remain available. Tests still run separately with Vitest. The native Render-mode optimized build and TypeScript validation passed, as did 32 focused regression tests.

The dependency audit was checked without changing versions: current production dependencies reported zero critical, one high (zod) and one moderate advisory. The high advisory proposes a major-version upgrade, so npm audit fix --force was not applied automatically. Dependency security work is still required before describing the application as fully hardened; these results address the build failure, not hosted provider acceptance or every audit finding.
