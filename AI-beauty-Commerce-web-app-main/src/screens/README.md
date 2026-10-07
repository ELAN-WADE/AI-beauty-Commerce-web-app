# Screens — grouped by feature

`App.tsx` is the only file that imports from here. Each folder is one user journey.
Numbered filenames are kept for history; folders give the navigation.

| Folder | Journey | Screens |
|---|---|---|
| `catalog/` | Browse + product discovery | Splash, Onboarding, Home, Search, Categories, Catalogue, ProductDetails, DesktopHome |
| `checkout/` | Bag → payment | Cart, Checkout, Payment, OrderConfirmed |
| `orders/` | Track orders | OrdersTracking, GuestOrderLookup |
| `account/` | Identity + loyalty | Rewards, Account, AuthSuite |
| `ai/` | Skin AI + assistant | AISkinScan, AskAI |
| `community/` | Social proof | CommunityChat |
| `partners/` | Distributors + creators | Distributors, DistributorPortal, Creators |
| `admin/` | Operations console | AdminConsole |

Rules:
- New screen → put it in the folder of its journey, never flat in `screens/`.
- Screens read state via `src/context/AppContext.tsx` and server data via `src/lib/owned-api.ts`.
- Prototype fallbacks live in `src/lib/backend.ts` + `src/data/*` (frozen mocks, do not extend).
