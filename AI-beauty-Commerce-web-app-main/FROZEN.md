# FROZEN — Vite SPA (`src/`, root `package.json`)

**Status: frozen since the Next.js unification (Batch-1 audit decision). Do not build features here.**

- The single storefront truth is `backend/src/storefront/` (routes, ISR, Server Actions).
- This Vite app still builds and is still referenced by `vercel.json` + CI **only** so existing deployments keep serving until the hosting cutover is executed on the Vercel dashboard (not runnable from this repo — requires project-settings authorization).
- `src/` and `backend/src/storefront/` have diverged and will diverge further. Every UI change must be made in `backend/` only.
- Cutover checklist (hosting owner): point production domain at the Next.js deployment → verify checkout/webhook URLs (`APP_URL`, Stripe/Flutterwave/Opay dashboard URLs, `FRONTEND_URL`) → remove the Vite build from `vercel.json`/CI → delete this file's exception by deleting this directory's SPA entrypoints.
- Known coupling (do not break): `backend/src/db/seed-*.ts` still imports mock data from root `src/data/*`. Before deleting the SPA, vendor that seed data into `backend/` (copy, then repoint the seed imports).
