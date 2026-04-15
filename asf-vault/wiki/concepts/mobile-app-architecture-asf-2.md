---
title: "Mobile App Architecture — ASF-2"
type: concept
updated: 2026-04-13
sources: 2
tags: [asf-2, mobile, expo, react-native, rbac, push-notifications]
---

# Mobile App Architecture — ASF-2

Two mobile apps planned for ASF-2: a customer app and a staff/boss app. Both use Expo + React Native and share the same Supabase backend and Next.js API routes.

---

## Technology Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Expo (React Native) | Same TypeScript as web; same Supabase package; no rewrite of 35+ contexts |
| Navigation | `expo-router` | File-based routing, mirrors Next.js mental model |
| Styling | NativeWind | Tailwind class names, mirrors web design system |
| State | React Context (copied from web) | Zero rewrite; same providers |
| Payments | `@stripe/stripe-react-native` | Same Stripe API endpoint as web |
| Push | Expo Push Notification Service | No Firebase required; handles iOS + Android |
| Build/Deploy | EAS Build + EAS Update | Cloud builds; OTA JS updates without App Store review |

**Flutter was evaluated and rejected** due to: Dart language barrier, BLoC complexity (prior abandonment), no CSS/Tailwind transfer, full rewrite of all TypeScript contexts required.

---

## Push Notifications

Expo Push Notification Service (EPS) routes to APNs (iOS) and FCM (Android) through a single API call. No Firebase project or `google-services.json` needed.

**Flow:**
1. App calls `expo-notifications.getExpoPushTokenAsync()` on startup
2. Token saved to `push_tokens` Supabase table
3. Event fires (order shipped, low stock, etc.)
4. Supabase Edge Function or Next.js webhook handler reads token → POST to `https://exp.host/--/api/v2/push/send`
5. OS displays on lock screen (app does not need to be running)

**Malaysian OEM caveat:** Xiaomi, OPPO, vivo, Huawei apply aggressive battery optimization that can delay notifications. Users must whitelist the app in battery settings.

---

## Staff App (`asf-staff-app`)

**Start:** Immediately after DB migrations. Does not depend on Stripe or Delyva.

**RBAC model:**
- `staff_roles` Supabase table: `{ user_id, role }`
- Roles: `owner`, `manager`, `staff`, `warehouse`, `support`
- App reads role on login → renders role-appropriate bottom tabs
- Supabase RLS enforces access server-side (not just UI)

**Tab sets by role:**

| Role | Tabs |
|---|---|
| `owner` | Dashboard, Orders, Products, Analytics, Settings |
| `manager` | Orders, Products, Stock, Posts, Settings |
| `staff` | Orders, Stock, Settings |
| `warehouse` | Stock, Settings |
| `support` | Orders, Support, Settings |

**Key screens:** Orders (list + detail + status update + ship button), Stock (variant-level add/return), Analytics (owner — real DB data), Dashboard (KPI cards).

**Push triggers:** New order → owner+manager; low stock → warehouse+manager; new support ticket → support role.

---

## Customer App (`asf-customer-app`)

**Start:** Build screens in parallel with web Steps 1–3; checkout blocked until Stripe API routes (Step 2) complete.

**Screens:** Home, product section/browse, product details (swipeable gallery + variant selector), cart (port of web cart), checkout (Stripe `PaymentSheet`), wishlist, order history + detail (Delyva tracking timeline), rewards, profile/settings.

**Same backend:** Calls `https://yourapp.vercel.app/api/stripe/create-payment-intent` — identical endpoint to web checkout. No additional backend code for mobile.

---

## Shared Infrastructure

Both apps share:
- Supabase project (same DB, same Auth)
- Next.js API routes (`asf-2-next/src/app/api/`)
- `database.types.ts` (copy from `asf-2-next`)
- Context provider files (copy from `asf-2-next/src/context/`)
- `push_tokens` table in Supabase
- Expo Push Notification Service

---

## Related

- [[wiki/entities/asf-2]]
- [[wiki/concepts/production-readiness-asf-2]]
- [[wiki/sources/2026-04-13-mobile-app-strategy]]
- [[wiki/sources/2026-04-13-production-roadmap]]
- [[wiki/concepts/context-provider-architecture-asf-2]]
