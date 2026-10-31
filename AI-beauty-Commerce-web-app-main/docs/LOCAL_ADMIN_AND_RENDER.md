# Local admin and Render handoff

The Flex carousel is the default hero. Bundled editorial photos keep it visible before any CMS uploads exist. Saved active uploads replace those default images. Slideshow takes over only when explicitly selected and a published image exists.

## Local setup

The existing PostgreSQL database on port 5433 and backend on port 3005 were stopped; both were restarted. Readiness now returns 200 through ports 3000 and 3005. Anonymous /api/auth/me correctly returns 401 rather than an unreachable-service 503.

From backend, run npm run db:local -- start and npm run dev. From the repository frontend folder, run npm run dev in another terminal. Keep both services running. Existing accounts/data were preserved; no database or credentials were reset.

Open the configured ADMIN_ENTRY_PATH on localhost:3000, sign in using your existing administrator account, and open CMS. Under Hero presentation choose Flex carousel, upload JPEG/PNG/WebP images, reorder/remove images as needed, then Publish editorial changes. The storefront will receive the published update. Do not use public /admin as the private entry.

Local uploads can use the existing development filesystem fallback. Production uploads require durable object storage; Render's temporary web-service filesystem is not a durable media library.

## Other restored UI

The scan back control is removed on all sizes. The temporary-analysis notice stays visible. Customer reviews remains on the landing page when no approved reviews exist, with an honest empty state. Signed-out account/community prompts now show shaded vector avatars above their headings. No customer identities, reviews or business records were fabricated.

## Render corrections and remaining configuration

The blueprint referenced missing scripts/render-build.mjs and scripts/render-start.mjs. Those scripts now exist. Build runs installation, a separate TypeScript check and Next build. Start validates the backend environment before launching Next on Render's PORT. The deployment command now migrates, seeds RBAC permissions and optionally bootstraps the configured admin; it no longer automatically inserts sample catalogue or partner records.

The checked-in blueprint is currently a development/staging setup: RENDER_DEV/DEV_DEPLOY, ALLOW_LOG_EMAIL and SKIP_PREFLIGHT are enabled, payments are disabled, and the email worker is commented out. It must not be described as a fully configured production deployment. Configure HTTPS site/OAuth callback URLs, SMTP and an auth-email worker, durable media storage, the private admin entry and administrator bootstrap settings in Render. For a production launch disable the development bypass/log-email flags.

AUTH_EMAIL_ENCRYPTION_KEY and MFA_ENCRYPTION_KEY must each be 64 hexadecimal characters. Render generateValue must not be assumed to produce this format. Use securely generated keys in the deployment secret settings, share the email key with the email worker, and retain any existing encryption keys when migrating encrypted records. Never put secrets into client code or documentation.

Production provider settings and live Google consent/email delivery still require deployment acceptance; no Render service was deployed or purchased in this pass.

## Production template follow-up

The separate render.production.yaml proposes a paid web service and auth-email worker using an existing database supplied through secret settings. It is not deployed. Repository-relative rootDir values match the current outer Git checkout; change them if deploying from a different repository layout. Development bypasses/log-email are off, automatic commit deployment is off, and worker configuration references the web service so encryption and SMTP settings stay aligned. Supply all sync:false values in Render before deploying, preserving existing encryption keys.

Render build now runs next typegen before the independent TypeScript gate. Production admin uploads skip temporary filesystem copies and require a successful durable object-store write; development retains local uploads. Runtime uploads are ignored by Git without deleting any files. The corrected isolated upload suite passed all three durability cases; carousel default tests passed all three cases. Partner-upload (6), saved catalogue (3) and workspace (12) checks also passed. Backend TypeScript passed. No additional live posts, purchases or email were created for these checks.

## Validation

46 isolated carousel-default, saved catalogue, workspace, OAuth and auth-proxy tests passed. Both frontend and backend TypeScript checks passed. Captured-response admin checks passed CMS publication, community publication, Hide/Restore and sidebar behavior. Mobile browser checks passed account/community illustrations, visible scan notice and absent scan back buttons, with no browser errors. These browser checks do not certify physical-device behavior or external provider acceptance.
