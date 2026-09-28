# Glowly Backend (owned) — Next.js + PostgreSQL + Drizzle + Zod

Modular monolith (S0 auth/users; catalog in S2). Supabase is prototype-only;
this is the production path you own: database, credentials, schema, migrations,
backups, secrets.

## Quickstart (no Docker needed for checks)

```bash
cd backend
npm install
npm run typecheck   # tsc --noEmit
npm test            # vitest (unit, DB-free)
npm run db:generate # emit drizzle/ migration from schema (review before commit)
```

## With Docker (staging/VPS or any machine with Docker)

```bash
# repo root
docker compose up -d postgres redis minio mailhog
cd backend && cp .env.example .env
npm run db:migrate && npm run db:seed
npm run dev  # :3001; frontend proxies /api/* here (same-origin cookies)
```

## Auth contract (S1)

| Endpoint | Body → Response |
|---|---|
| POST `/api/auth/register` | `{email,password}` → 201 `{ok,email}` (+session cookie; `_dev*Token` only in dev) |
| POST `/api/auth/login` | same → 200 `{ok}` + cookie. Failures: one generic message |
| POST `/api/auth/logout` | — → revokes server session, clears cookie |
| GET `/api/auth/me` | — → `{id,email,emailVerified,roles,profile}` |
| POST `/api/auth/verify-email` | `{token}` → `{ok}` |
| POST `/api/auth/request-password-reset` | `{email}` → always 200 (no enumeration) |
| POST `/api/auth/reset-password` | `{token,newPassword}` → `{ok}`, kills all sessions |
| GET/PATCH `/api/me/profile`, GET/POST `/api/me/addresses`, PATCH/DELETE `/api/me/addresses/[id]` | owner-scoped (BOLA by construction) |

Sessions: scrypt-hashed passwords, SHA-256 token hashes, HttpOnly + Lax cookies
(Secure in prod), 5-fail lockout, reset revokes all sessions.

## Conventions (enforced, not suggested)

- Routes: parse → Zod `.strict()` → rate-limit → service. Never import `db/` from
  components; services never trust client prices/ids (S3+ pattern).
- Errors: `api()` wrapper; unexpected → generic 500 + server log. No stacks/SQL to clients.
- Every schema change: `db:generate` → review SQL → test migrate → staging → prod.
