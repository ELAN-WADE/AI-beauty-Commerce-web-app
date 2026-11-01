# Render availability incident — 2 November 2026

## Confirmed failures

Render Events reported that the 512 MB Free web instance ran out of memory at
23:33, 23:39, and 23:56 on 1 November (Africa/Lagos). The application subsequently
restarted. Its startup checks and Next startup took about 40 seconds during the
supplied restarts. Requests during an unavailable interval can receive a gateway
502. The supplied evidence does not indicate an IP restriction.

A separate browser failure is reproducible: when WebGL is unavailable, the OGL
renderer used by the flex carousel dereferences a missing graphics context and
the homepage is replaced by Next's client-exception page.

## Changes

- `AUTH_EMAIL_WORKER_MODE=embedded` now runs the account-email dispatcher inside
  the Next server via its instrumentation hook. It shares the existing bounded
  database pool, removing a second long-lived Node/tsx/schema runtime. It still
  processes the same durable account-email outbox and validates queued proofs.
- Standalone `npm run worker:auth` remains available for external-worker hosting.
  The existing environment setting `AUTH_EMAIL_WORKER_MODE=external` opts out of
  embedded delivery. Do not enable both modes for the same intended deployment.
- Only the actual Render web launcher sets `DESLA_EMBEDDED_AUTH_EMAIL=1`.
  Builds and static-generation workers do not start email dispatchers. Do not add
  this internal marker to a shared Render environment group.
- Public live-update streams release their listener and heartbeat on request
  abort and stream cancellation. Slow consumers are disconnected instead of
  accumulating an unlimited queue. Reconnecting browsers refresh saved content.
- Hidden/offline tabs close their stream. Failures use capped exponential
  backoff with jitter rather than synchronized five-second retry loops.
- The flex carousel uses its existing images in a native scrolling fallback
  when WebGL2 is unavailable, its creation fails, or the graphics context is
  lost. The normal graphics-supported carousel and storefront UI are unchanged.
- Page/global error boundaries offer retry/reload after other page exceptions.
- Web exit logs include code, signal and uptime. Embedded deployments log
  `web-memory` RSS, heap and external allocations at startup and every five
  minutes. These numbers cover the Next process, not its launcher or all native
  resources reported by Render's instance-wide memory metric.

## Deploying to the existing service

Deploy the commit containing these changes. Keep the current secrets, database,
Google callback, email transport and `AUTH_EMAIL_WORKER_MODE=embedded` setting.
No new public environment variable, migration or account reset is required.

Confirm logs contain both `auth-email-supervisor` with `runtime: in-process` and
`auth-email-worker` with `status: ready`. A `web-memory` sample reports the Next
process's memory. Compare Render Metrics and Events after representative use;
local fixtures cannot establish a production concurrency guarantee.

The local Windows production fixture completed 192 read-only page/API requests
at concurrency four and 120 live-stream connect/cancel cycles, using a new
temporary PostgreSQL database and a stubbed email provider. The Next process
peaked at 289 MB RSS in that run; no external email was sent. This excludes the
launcher processes and does not substitute for Render's Linux memory metric or
a representative production traffic benchmark. The production build and four
graphics-failure browser cases passed, along with focused account-email,
stream-lifetime, reconnect and administrator-session regressions.

For production, select a web-service compute plan with memory headroom. The
proposed production Blueprint specifies `1c-2g` (2 GB, legacy Standard). The
paid `0.5c-512mb` (legacy Starter) still has the same 512 MB memory ceiling as
Free. Changing only to that plan removes idle spin-down but does not add RAM.
No paid resource is created or upgraded by this code change.

Free services can sleep after 15 minutes of inactivity, take about a minute to
wake, and be restarted by the platform. These limits remain after the fixes.

Sources: [Render compute plans](https://render.com/docs/compute-plans),
[Free limits](https://render.com/docs/free),
[Memory exhaustion troubleshooting](https://render.com/docs/troubleshooting-deploys#memory-exhaustion),
[Next instrumentation](https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation).
