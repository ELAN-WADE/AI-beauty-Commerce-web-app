# Hero CMS and creator connections

Updated 31 October 2026. Applies to both storefront implementations.

## Hero publishing

In Admin → Editorial CMS → Hero, select Flex carousel or Full-width slideshow.
Upload JPEG, PNG or WebP images, reorder them, and enable or disable each image.
Uploads use the existing authenticated administrator media endpoint. A later
upload failure retains images already added to the draft.

Flex uses one heading (48 characters maximum), one short body (100 characters),
and the selected CTA above a shorter carousel. There is no lower caption or
separate caption editor. Slideshow uses the same uploaded images at full width,
with optional text and CTA per slide. Blank slide text uses the global defaults.
Switching modes retains the other mode's saved slide settings.

Use **Publish editorial changes** to persist the complete configuration through
PUT /api/admin/storefront. Public reads use GET /api/storefront. Saved versions
prevent stale administrator edits from overwriting a newer publication.
Public synchronization preserves an editor's unsaved draft. Publication
invalidates storefront caches after the database transaction commits.

Slides advance automatically at the configured interval. Manual navigation and
pause are available. Automatic motion stops for reduced-motion preferences,
hidden browser tabs, hover and keyboard focus.

## Social account workflow

Social connection is separate from signing into Desla with Google or email.
The creator must already have a verified session, the CREATOR role and an
approved linked creator profile. Connecting a channel never grants a role.

1. Open the existing Creator Content Editor social modal.
2. Authorize in the provider popup. Desla never asks for a social password.
3. The callback exchanges the authorization code on the server.
4. When Facebook returns multiple linked Instagram accounts, select the account
   in the existing editor modal. No account is chosen silently.
5. The editor displays provider-returned identity and follower counts. Missing
   counts remain unavailable. Expired connections require reauthorization.

OAuth popups preserve the editor's in-memory draft. Parent polling reads only
the signed-in creator's connection; it does not depend on a cross-origin popup
opener remaining available. A cancelled provider dialog can be closed and retried.
“Stop waiting” stops local polling; it does not claim to revoke provider consent.

### Setup still required

No developer credentials were present when this integration was prepared.
It therefore reports setup as unavailable rather than simulating authorization.

Set these values in backend environment settings, then restart the backend:

| Setting | Value required |
| --- | --- |
| SOCIAL_TOKEN_ENCRYPTION_KEY | 32 random bytes encoded as 64 hexadecimal characters; no default |
| TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET | TikTok Login Kit web application |
| TIKTOK_REDIRECT_URI | Exact public HTTPS URL ending /api/creator/social/tiktok/callback |
| META_APP_ID / META_APP_SECRET | Meta application with Facebook Login and Instagram access |
| META_GRAPH_VERSION | Supported version pinned in your Meta application, in vNN.0 format |
| INSTAGRAM_REDIRECT_URI | Exact public HTTPS URL ending /api/creator/social/instagram/callback |

Use the same site origin for the editor and callbacks. For local testing, use
a registered HTTPS development domain or tunnel; the TikTok web callback requires
HTTPS. Do not place app secrets or the encryption key in NEXT_PUBLIC variables.
Apply migration 0024_creator_social through the normal reviewed deployment
migration process. It adds dedicated private tables, not workspace records.
No live business records are seeded, reset or purged by this migration.

TikTok requests user.info.basic, user.info.profile and user.info.stats. Additional
scopes need the provider's app approval. Instagram uses Facebook Login with
public_profile, pages_show_list, pages_read_engagement and instagram_basic.
It requires a professional Instagram account connected to a Facebook Page.
See the primary [TikTok Login Kit](https://developers.tiktok.com/docs/en/login-kit-web),
[TikTok profile fields](https://developers.tiktok.com/docs/en/tiktok-api-v2-get-user-info)
and [Meta Page-token discovery](https://www.postman.com/meta/instagram/request/0vuw3vk/get-access-tokens-of-pages-you-manage)
documentation.

### Endpoint contract

| Endpoint | Request | Result |
| --- | --- | --- |
| GET /api/creator/social | Verified creator cookie | Config readiness, owned public profiles and pending account choices |
| POST /api/creator/social | action: connect, provider: tiktok or instagram | Official authorization URL and HttpOnly browser proof cookie |
| Provider callback GET | Provider-issued code, one-use state, original session and proof cookie | Server exchange; connected account or pending Instagram choices |
| POST /api/creator/social | action: select, provider, grant, accountId | Connects only an account returned in that creator/session's authorization |
| POST /api/creator/social | action: disconnect, provider | Deletes the owned local connection and pending requests |

All responses are private/no-store. Invalid, expired and replayed callbacks fail.
State expires in ten minutes and binds creator, session, provider and browser.
Tokens use AES-256-GCM encryption with owner/provider authenticated data. Raw
provider response bodies, tokens, secrets and browser proofs are not returned by
the connection status endpoint. An account cannot be linked to two creators.
POSTs use the existing origin checks and shared request quotas.

Disconnect removes Desla's stored connection. The user can also remove consent
in their TikTok/Meta account settings; local disconnection does not claim remote
revocation. This implementation reads profile data. External social publishing,
insights, commission attribution and payouts are not inferred from connection.
Desla content still follows the existing administrator moderation workflow.
Provider publishing permissions and audited posting flows require separate
implementation and live acceptance before any “published to TikTok/Instagram”
confirmation can be shown.

## Scan readiness

The original scan UI is restored. Capture/upload and explicit consent feed
POST /api/skin-scan. GEMINI_API_KEY and optional GEMINI_VISION_MODEL are
server-only. Without a key the interface shows unavailable; it never fabricates
a result. Photos are normalized, size-limited and forwarded to Gemini only with
consent; Desla does not save the photo. A single photo does not yield validated
hydration measurements, clinical accuracy percentages or medical diagnoses.
The existing result cards display qualitative observations and unavailable
measurements honestly.
