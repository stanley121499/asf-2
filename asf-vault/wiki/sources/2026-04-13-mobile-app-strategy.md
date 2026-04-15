---
title: "ASF-2 Mobile App Strategy 2026-04-13"
type: source
updated: 2026-04-13
tags: [asf-2, mobile, expo, react-native, push-notifications, staff-app, customer-app]
---

# ASF-2 Mobile App Strategy 2026-04-13

**Raw source:** [raw/sources/2026-04-13-mobile-app-strategy.md](../../raw/sources/2026-04-13-mobile-app-strategy.md)  
**Decision:** Expo + React Native for both mobile apps  
**Entity:** [[wiki/entities/asf-2]]

## Summary

Technology decision and architectural plan for both mobile apps. Expo (React Native) chosen over Flutter due to TypeScript alignment, direct Supabase context reuse, and solo developer constraints. Firebase not required — Expo Push Notification Service handles both iOS and Android.

## Technology decision: Expo over Flutter

**Why Expo wins for this project:**
- Same TypeScript as web — no new language
- `@supabase/supabase-js` is identical package — copy context files directly
- 35+ TypeScript context providers → zero rewrite cost
- `expo-router` mirrors Next.js file-based routing (same mental model)
- NativeWind enables Tailwind class name reuse
- EAS Update allows OTA JS fixes without App Store review
- Previous Flutter attempt abandoned due to BLoC architecture complexity

## Push notifications: no Firebase required

Expo Push Notification Service (EPS) is a free relay that accepts a single API call and routes to APNs (iOS) or FCM (Android) automatically. No `google-services.json`, no APNs certificate management.

**Lock screen behaviour:** Works fully. The OS (not the app) displays notifications — phone can be locked or app force-closed.

**Caveat:** Chinese-brand Android phones (Xiaomi, OPPO, vivo, Huawei) apply aggressive battery optimization. Common in Malaysia. Users must whitelist the app. Android OEM issue, not Expo-specific.

**Required DB table:** `push_tokens (id, user_id, token, platform, created_at)` with UNIQUE(user_id, platform).

## Staff app (`asf-staff-app`)

**Start date:** Immediately after Step 1 of [[wiki/sources/2026-04-13-immediate-execution-plan]] (DB migrations). Does not need Stripe or Delyva to be useful.

**RBAC via `staff_roles` table:**
- Roles: `owner`, `manager`, `staff`, `warehouse`, `support`
- `_layout.tsx` renders different bottom tabs per role
- Supabase RLS enforces access server-side

**Role → tab mapping:** owner gets all tabs; manager gets orders/products/stock/posts; staff gets orders/stock; warehouse gets stock only; support gets orders/support.

**Key features per role:**
- Orders: all roles (with varying action permissions)
- Stock: quick add/return per variant, low stock alerts highlighted
- Analytics: owner only, real data from DB
- Push triggers: new order → owner+manager; low stock → warehouse+manager; new ticket → support

## Customer app (`asf-customer-app`)

**Start date:** Build screens in parallel with web Steps 1–3; checkout screen blocked until Stripe (Step 2) complete.

**Stripe in RN:** `@stripe/stripe-react-native`, `usePaymentSheet()`. Calls same `/api/stripe/create-payment-intent` endpoint as web — zero additional backend work.

**Key screens:** Product details (swipeable gallery, variant selector), cart (direct port of well-implemented web cart), checkout (native Stripe UI), order history + detail with Delyva tracking timeline, rewards (real Supabase stamps after Step 11).

## Shared infrastructure

Both apps share: same Supabase project, same Next.js API routes, same `database.types.ts`, same context files (copied), same `push_tokens` table, same Expo Push flow. No per-app backend.

## Related

- [[wiki/entities/asf-2]]
- [[wiki/concepts/mobile-app-architecture-asf-2]]
- [[wiki/sources/2026-04-13-production-roadmap]]
- [[wiki/sources/2026-04-13-immediate-execution-plan]]

## Open questions

- Will both apps be published under the same developer account or separate ones?
- Customer app language: Chinese UI strings visible in existing pages — is this intentional for the target market?
- Is a tablet layout needed for the staff app (bosses might use iPads)?
