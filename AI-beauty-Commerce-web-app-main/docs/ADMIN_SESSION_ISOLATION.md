# Separate administrator and storefront sessions

The private administrator portal and public storefront have independent session cookies. In production these are `__Host-desla_admin_sid` and `__Host-desla_sid`, both Secure, HttpOnly and SameSite=Lax. The server also stores `ADMIN` or `CUSTOMER` on each session row; moving a token into the other cookie or sending a different context header does not change its scope.

Administrator email/password sign-in issues only the administrator cookie. Google admin intent persists the administrator scope on its one-time grant and issues the same separate cookie at exchange. Customer, creator and distributor sign-ins issue only the storefront cookie. Each Google flow has its own administrator/storefront browser-binding cookie, preserving simultaneous flows across the two portals.

`/api/auth/me` and logout select the active portal context. The client marks requests from the private operations path as administrator requests; the local Next proxy forwards that selection. Every staff permission gate explicitly selects the administrator cookie and still checks role, permission and fresh MFA. Invalid or expired admin credentials do not become a customer identity. Staff accounts are directed to the private sign-in page when used in ordinary password/Google sign-in; signing in as an administrator does not add the CUSTOMER role. A shopper uses their own registered customer account.

Signing out of the admin portal revokes and clears only its session. Signing out of the storefront leaves an active administrator session intact. Expiry is checked independently. Cart, checkout and customer order reads explicitly require the storefront scope, so the admin cookie cannot serve as a shopper login. Password resets and explicit account-wide security revocation retain their normal account-wide effect.

Migration `0025_admin_session_scope` adds the scope columns and an index for active per-user/per-scope session lookup. Existing staff sessions are classified ADMIN so old shared cookies stop identifying staff on the storefront. After deployment, sign in through the private portal once to receive its new cookie. Existing passwords, authenticator factors, recovery codes and customer accounts are preserved.

Sessions live in PostgreSQL; there is no in-memory global user limit or dedicated database connection per signed-in user. The existing ten-session cap applies per account and scope, not across the application. Existing expiration settings remain in force. The isolated regression inserts 20,000 session records for different accounts, validates lookup and cap isolation, and does not represent a 20,000-concurrent-user HTTP performance benchmark.

Validation covers real API handlers with an isolated database, customer/admin cookie swapping, independent logout and expiry, Google grant scope, role checks, MFA, and two tabs sharing a single browser cookie jar. No test accounts or sample products are inserted into production.
