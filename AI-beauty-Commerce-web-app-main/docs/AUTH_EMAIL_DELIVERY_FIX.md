# Auth email delivery fix

The missing local dispatcher is now running under a background supervisor. SMTP authentication passed and the worker reported ready in new-requests-only mode. Both supervisor and child process were confirmed alive. No verification/reset/test email was manually requested or sent, and historical failed rows were not retried.

Normal backend npm run dev now launches Next.js together with the dedicated account-email dispatcher. The supervisor retries unexpected worker exits with bounded backoff. npm run worker:auth:local starts just the supervised local dispatcher when the backend is already running.

The initial delivery cutoff is stored in the ignored backend/.local/auth-email-created-after file and passed to restarted workers. Preserve this file: restarting a worker must not advance the cutoff and strand new requests that were queued before that restart. Older messages remain excluded. The dispatcher only handles verification, password reset, verified-account guidance and partner-review notifications; it does not run payment, commerce or marketing jobs.

Current background status output is in backend/.local/auth-email.stdout.log and auth-email.stderr.log. Logs contain status/template codes, not recipients, links, tokens or SMTP credentials. Existing encryption keys were not changed.

The production Render template already defines its dedicated auth-email worker. Local startup does not deploy or pay for that service; its secrets and SMTP settings must be configured and the worker deployed there. The new local cutoff mode is not applied to the normal production worker command.

Delivery remains at-least-once: a provider accepting a message just before a worker crashes can cause a retry of the same valid link. Actual inbox/spam placement and a fresh human Google consent round trip still require live acceptance. Those are distinct from a code/configuration defect.

Validation: existing auth-email database, transport and boundary tests passed (23 cases); the added cutoff/recovery case checks that an old row remains untouched and a new row is recovered using the original cutoff. Backend TypeScript and supervisor syntax checks passed. No UI files were changed in this fix.
