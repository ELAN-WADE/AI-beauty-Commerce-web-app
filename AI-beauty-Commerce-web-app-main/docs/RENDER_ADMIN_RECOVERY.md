# Administrator login recovery on Render

If password sign-in succeeds but the authenticator step sends you back to login, see [ADMIN_MFA_SESSION_FIX.md](ADMIN_MFA_SESSION_FIX.md). Password recovery and the MFA session transition are separate concerns.

Administrator access requires a verified database user, the configured administrator email, a staff role, the correct password, and no active login lockout. The private URL alone does not create the account. MFA remains a separate step after password authentication.

Two deployment gaps were corrected: native Render startup now runs the optional administrator bootstrap (without depending on a pre-deploy hook), and existing-account password recovery is explicitly supported. Previously bootstrap granted roles but silently retained the old password.

Set these server-only environment variables on the existing web service:

```dotenv
ADMIN_GOOGLE_EMAIL=your-administrator@example.com
ADMIN_BOOTSTRAP_EMAIL=your-administrator@example.com
ADMIN_BOOTSTRAP_PASSWORD=your-intended-password
ADMIN_BOOTSTRAP_SYNC_PASSWORD=true
ADMIN_ENTRY_PATH=/ops-your-existing-private-path
```

Use the same real administrator email for both settings. The path must match the private URL you want to open. Do not copy the placeholder values above. The local working copy has a private, Git-ignored backend/.local/render-admin.env prepared with the credentials and path requested in this conversation.

Import that file through Render Environment → Add from .env, retain unrelated database/encryption/storage settings, and choose Save, rebuild, and deploy on the latest main commit. Credentials remain in environment settings; they are never hardcoded in application source or returned to the browser.

Startup logs report `scope=admin-bootstrap`, `status=ready`, and whether the account was created or its password changed. Recovery validates the single-email allowlist, assigns required roles, verifies the account, and clears login lockout. A changed password revokes existing sessions and unused password-reset proofs. Existing authenticator setup and recovery codes are preserved.

After successful sign-in, set ADMIN_BOOTSTRAP_SYNC_PASSWORD=false and save/deploy again. Normal deployments preserve existing account passwords. Leaving synchronization enabled deliberately makes the configured bootstrap password authoritative at each startup. Repeated startup with the same password does not rehash it or revoke sessions.

If neither bootstrap credential is configured, provisioning is skipped. Partial credentials or a mismatched allowlist fail startup with a configuration error. LOCAL_ADMIN_* values are never used as a production fallback. No customer, creator, distributor, order, payment, or storefront records are purged by this recovery.

This change does not weaken runtime login limits or MFA requirements. If sign-in reaches an authenticator prompt after password recovery, the password step succeeded; complete the account's existing authenticator flow.

Validation: 52 focused administrator recovery, private-route, auth-proxy, and account-workflow tests passed, along with backend TypeScript. Tests use isolated databases and do not alter the hosted account. Actual hosted password authentication remains pending applying the configured recovery and completing sign-in.
