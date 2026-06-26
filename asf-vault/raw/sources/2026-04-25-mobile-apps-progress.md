# Mobile Apps Progress — ASF-2 (April 13 → April 25, 2026)

**Date**: 2026-04-25  
**Context**: This document records the development work completed on both Expo React Native mobile apps for ASF-2 between the production-planning session (2026-04-13) and today. It covers architecture decisions, completed features, known issues, and current state.

---

## 1. Overview

Both mobile apps have been built from scratch using Expo SDK 54, expo-router v6, and React Native with NativeWind + inline styles. They are tested via **Expo Go on iOS and Android** (iPhone for staff app; Android APK for customer app).

| App | Codebase | Status |
|-----|----------|--------|
| Customer | `asf-customer-app/` | Functionally complete, APK built, tested on Android |
| Staff | `asf-staff-app/` | Feature-complete, tested via Expo Go on iPhone |

---

## 2. Customer App (`asf-customer-app`)

### 2.1 Tech Choices
- **Stripe**: Native `@stripe/stripe-react-native` PaymentSheet (not webview)
- **UI/UX**: 100% match to existing `asf-2-next` Next.js customer web app (mobile-first design that the client approved)
- **Navigation**: Expo Router v6, tab-based with 3 main tabs (home, highlights, profile)
- **Push notifications**: Deferred

### 2.2 Screens Implemented
| Screen | Route | Notes |
|--------|-------|-------|
| Home | `(tabs)/index.tsx` | Hero banner, categories, products feed |
| Browse | `browse.tsx` | Category filtering, product grid |
| Highlights | `(tabs)/highlights.tsx` | Social posts/promotions feed |
| Product Detail | `product/[id].tsx` | Image gallery, variant picker, add to cart |
| Cart | `cart.tsx` | Stack screen (not a tab) |
| Checkout | `checkout.tsx` | Stripe PaymentSheet integration |
| Wishlist | `(tabs)/wishlist.tsx` (or similar) | Saved products |
| Profile / Settings | `(tabs)/profile.tsx` + sub-pages | Account, orders, membership |
| Order Detail | `order/[id].tsx` | Order status, items |

### 2.3 Notable Implementation Details
- `ProductContext` uses direct `supabase.from("products").select(...)` — NOT the RPC `fetch_products_with_computed_attributes` (that RPC caused crashes)
- `AsyncStorage v2.2.0` for session persistence
- `react-native-reanimated` + `react-native-worklets@~0.4.0` for animations; Babel plugin uses `"react-native-worklets/plugin"`
- `npm install --legacy-peer-deps` required; `.npmrc` has `legacy-peer-deps=true`
- EAS build: Android keystore auto-generated; `.easignore` excludes vault and docs

### 2.4 EAS Build
- Platform: Android (APK)
- Build profile: `preview` (APK, not AAB)
- App icon: set up in `app.json` (transparent background supported)
- Environment vars: all `EXPO_PUBLIC_*` in `.env`

---

## 3. Staff App (`asf-staff-app`)

### 3.1 Tech Choices
- **Design system**: Black (#000000) + off-white (#FAF9F6); inline styles throughout (NativeWind broken in Expo Go for some styles)
- **Navigation**: Expo Router v6 tab-based with role-based visibility
- **Fonts**: Playfair Display + Inter (via `useFonts`)
- **Icons**: Ionicons from `@expo/vector-icons`

### 3.2 Role System
Roles: `owner`, `manager`, `staff`, `warehouse`, `support`  
Role → allowed tabs mapping in `constants/roles.ts` via `ROLE_TAB_ORDER`:

```
owner:     dashboard, orders, products, analytics, chat
manager:   orders, products, posts, analytics, chat
staff:     orders, stocks, chat
warehouse: products, stocks, chat
support:   orders, chat
```

Tab visibility enforced in `app/(app)/(tabs)/_layout.tsx` via `roleAllowsTab()` + `tabBarButton: () => null` for hidden tabs.

### 3.3 Tab Structure (left → right for Owner)
1. **Home** (dashboard) — house icon
2. **Orders** — receipt icon
3. **Chat** — chatbubbles icon
4. **Products** — cube icon
5. **Analytics** — stats-chart icon

Posts, Stocks: shown for roles that need them (manager, warehouse).  
**Settings**: moved OUT of `(tabs)/` to `app/(app)/settings/` — accessed via gear icon on Dashboard header.  
**Support**: accessible via Chat stack push — never a bottom tab.

### 3.4 Screens Implemented

#### Dashboard (`(tabs)/dashboard/`)
- Welcome message + role badge
- Revenue today, pending orders, low-stock count, new customers
- Quick-access tiles: Orders, Products, Stocks, Analytics, Chat
- Gear icon (top-right) → Settings

#### Orders (`(tabs)/orders/`)
- Order list with status badges
- Order detail: items, customer info, status update

#### Products (`(tabs)/products/`)
- Product list with search
- Product detail/edit (`[productId]/index.tsx`):
  - Image upload/delete (expo-image-picker + Supabase Storage)
  - Status toggle (Published/Draft)
  - Color/Size chips + stock quick-view
  - ManageRow tiles → navigate to Colors, Sizes, Stock sub-screens
- Create product (`products/create.tsx`)
- Colors manager, Sizes manager, Stock manager (separate sub-screens)

#### Posts (`(tabs)/posts/`)
- Post list, create, edit
- Post media management

#### Stocks (`(tabs)/stocks/`)
- Stock overview per product
- Add Stock / Adjust Stock modals with KeyboardAvoidingView fix
- Purchase orders sub-section
- Reports sub-section
- **Critical fix**: DB column is `count` not `quantity` in `product_stock`

#### Analytics (`(tabs)/analytics/`)
- Revenue over time (bar chart using View components, no external chart lib)
- Orders breakdown, top products, customer metrics
- Uses `getDateRange` utility (copied from web app)
- Custom components: StatCard, SectionCard, ListRows, TimeBarChart, HBarChart

#### Chat (`(tabs)/chat/`)
- Hub: segmented Team Chat / Support Tickets tabs (WhatsApp-style flat list)
- Team conversation screen (`[conversationId].tsx`): WhatsApp-style chat, inverted FlatList
- Ticket detail screen (`ticket/[ticketId].tsx`): inside chat stack (fixes back-navigation bug), resolve button
- `ChatWindow` component: loads historical messages on mount via `listMessagesByConversationId`

#### Settings (`app/(app)/settings/`)
- Account info, preferences
- Accessible from dashboard gear icon only

### 3.5 Context Architecture (35+ contexts)
All contexts from the web app are mirrored in the mobile app:
- `AuthContext`, `StaffRoleContext`, `AlertContext`
- `ProductContext`, `CategoryContext`, `BrandContext`
- `OrderContext`, `CartContext`, `WishlistContext`
- `ConversationContext`, `TicketContext`
- `PostContext`, `PostMediaContext`
- `ProductColorContext`, `ProductSizeContext`, `ProductStockContext`, `ProductMediaContext`
- `AnalyticsContext`, `NotificationContext`, `PromotionContext`, `AnnouncementContext`
- (and more — see `CONTEXTS.md`)

### 3.6 Key Bugs Fixed During Development
| Bug | Fix |
|-----|-----|
| AsyncStorage `Native module is null` | Upgraded to `@react-native-async-storage/async-storage@^2.2.0` |
| Realtime channel collision `"groups"` | Renamed to `"community-groups"` in `CommunityContext.tsx` |
| Realtime collision `"conversation_participants"` | Renamed to `"conv-ctx-participants"` |
| Double headers (tab + stack) | `headerShown: false` on `screenOptions` in tabs layout |
| Add Stock modal keyboard blocking + stuck | `KeyboardAvoidingView` + tappable backdrop; fixed DB field `count` vs `quantity` |
| `href` + `tabBarButton` conflict | Never use `href` and `tabBarButton` together on same Tabs.Screen |
| Settings tab persisting after move | Deleted `(tabs)/settings/` folder; moved to `(app)/settings/` |
| Dashboard appearing last in tab bar (wrong icon/label) | Added `dashboard/_layout.tsx` (Stack) — all tab dirs must have `_layout.tsx` to create consistent route node shape for expo-router `useSortedScreens` matching |
| Chat keyboard blocking input | `SafeAreaView` for header, `KeyboardAvoidingView` for chat body; removed `gap` in favour of `marginRight` |
| No send button visible | Replaced `Pressable` (function-style style prop) with `TouchableOpacity` + static style object |
| Messages not loading (lazy) | Added `useEffect` calling `listMessagesByConversationId` on mount in `ChatWindow` |
| Back button on ticket → Orders (wrong) | Created `chat/ticket/[ticketId].tsx` inside chat stack (not support stack) |

### 3.7 Known Pending Issues
- Bottom nav: `dashboard` tab **still broken** (appears last with wrong icon "▼" and label "dash..." instead of first with house icon "Home") — root cause partially identified (dashboard/_layout.tsx was just added; still investigating expo-router route-node matching); user requested another agent fix this
- `useRoleGuard.ts` previously redirected to `(app)/(tabs)/settings` (now fixed to `(app)/settings`)

---

## 4. Supabase Realtime (Mobile)

- Channel naming must be unique project-wide — avoid using table names as channel names
- `ConversationContext` uses `"conv-ctx-participants"` for the conversation_participants realtime subscription
- `CommunityContext` uses `"community-groups"` for the groups subscription

---

## 5. Database Schema Corrections vs. Docs

The `DATABASE.md` doc has some outdated information. True schema from `database.types.ts`:

| Table | Doc says | Actual |
|-------|----------|--------|
| `products` | `active: boolean` | `status: string` ('Published'/'Draft') |
| `product_stock` | `quantity: integer` | `count: number` |
| `product_stock_logs` | `quantity`, `action_type` | `amount`, `type` |
| `posts` | no `name`, no `active` | has `name: string`, `active: boolean` |
| `promotions` | no `code`, no `max_uses` | has `code`, `max_uses`, `uses_count` |

New tables not in `DATABASE.md`:
- `announcements`: `id, title, message, image_url, cta_label, cta_url, type, active, starts_at, ends_at, created_at`
- `promotion_products`: `promotion_id, product_id` (junction, no `id` column)

---

## 6. Environment Setup

### Staff App `.env` keys
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=
EXPO_PUBLIC_API_URL=          # Next.js API base URL
EXPO_PUBLIC_APP_URL=
```

### Running locally
```powershell
# Staff app
cd asf-staff-app
npx expo start --lan

# Customer app
cd asf-customer-app
npx expo start --lan
```

Scan QR code in Expo Go on device. Use `--clear` flag to clear Metro cache.

---

## 7. Next Priorities (as of 2026-04-25)

1. Fix staff app bottom nav dashboard tab (another agent task)
2. **Demo data**: populate Supabase with realistic Malaysia minimart data (KK Mart / 99 Speed Mart style) — products, categories, brands, posts, orders, announcements, promotions — so the app looks full when shown to stakeholders
3. EAS build for staff app (iOS distribution)
4. Production deployment (Vercel + Supabase production tier)
