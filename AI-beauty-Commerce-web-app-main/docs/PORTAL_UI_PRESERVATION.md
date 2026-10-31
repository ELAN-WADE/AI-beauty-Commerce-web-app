# Portal UI and journey contract

The AI scan preserves its original photographic reference, 3D face, camera
framing, processing view and results cards. Wire real analysis behind those
screens. Consent, service status and honest result labels can be updated;
do not replace the screen with a redesigned scanner.

The Creator, Distributor, and Admin portals use their existing designed screens.
Backend integration must replace data sources and action handlers, not substitute
the portals with `LiveWorkspace`, `PartnerLivePanel`, or `LiveAdminConsole`.

## Distinct entry points

| Entry | Destination | Interface |
| --- | --- | --- |
| Creator / Join Creator Studio | `/creators` | `PartnerPortal` with kind `CREATOR` |
| Distributor / Join Distributor Hub | `/distributor` | `PartnerPortal` with kind `DISTRIBUTOR` |
| Admin Portal / Admin Operations | Server-configured `ADMIN_ENTRY_PATH` | `ScreenAdminConsole` |

Each entry records its own sign-in destination. Normal access uses the existing
authentication and partner approval gates. The selected portal is not inferred
from another portal's open tab, workspace selection, or mock role.

Creator and Distributor retain their photographic tiles, Matrix/Bento controls,
filters, telemetry drawers, floating rails, section screens, and mobile navigation.
Their floating shortcuts open settings/support in the same portal. Admin retains
its icon dock, vault overview, catalogue, editorial CMS, orders, press room,
customer intelligence, inventory, network management, claims, and audit screens.
Administrative management of creators/distributors is distinct from displaying
those partners' dashboards inside Admin.

## Temporary local previews

Run the root storefront in development and append `preview=design`:

- `/?screen=creators&preview=design`
- `/?screen=distributor-portal&preview=design`
- `/?screen=home&preview=design` to exercise the storefront entry cards.

The optional backend storefront supports the same flag at `/creators`,
`/distributor` and `/`. Admin always requires its private entry and authenticated permissions; design preview does not bypass it. Preview works only on localhost in development.
It shows empty layouts, blocks API transport, and creates no session or role.
Production authentication and API permissions remain enforced.

## Live-data integration rule

Preserve screen components, layout, styles, assets, tabs, forms, and interaction
structure. Introduce typed data adapters/hooks and wire existing controls to the
server. Clearly handle loading, empty, failed, and saved states. A preview or a
restored mock interaction does not establish that an operation was persisted,
that an external social account was authorized, or that a payment occurred.
Several restored screens still contain prototype data/actions; they must be
integrated and verified individually before they are described as fully live.
