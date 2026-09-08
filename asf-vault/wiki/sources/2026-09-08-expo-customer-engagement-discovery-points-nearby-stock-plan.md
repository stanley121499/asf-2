---
title: "Expo customer engagement — discovery points + nearby stock plan 2026-09-08"
type: source
updated: 2026-09-08
sources: 1
tags: [asf-2, expo, customer-app, points, wishlist, notifications, store-locations, ceremony]
---

# Expo customer engagement — discovery points + nearby stock plan 2026-09-08

**Raw:** [2026-09-08-expo-customer-engagement-discovery-points-nearby-stock-plan.md](../../raw/sources/2026-09-08-expo-customer-engagement-discovery-points-nearby-stock-plan.md)  
**Prompts:** [2026-09-08-expo-customer-engagement-discovery-points-nearby-stock-agent-prompts.md](../../raw/sources/2026-09-08-expo-customer-engagement-discovery-points-nearby-stock-agent-prompts.md) · [[wiki/sources/2026-09-08-expo-customer-engagement-discovery-points-nearby-stock-agent-prompts]]

## Summary

Approved dual-feature program for **Expo customer first**: (A) first-view **discovery points** for product PDP + post/promo linked-products opens, admin-editable amount under Rewards settings, strong in-app 仪式感; (B) **nearby wishlist stock** push via existing Expo notifications when within 1.5 km of a `store_locations` row with new per-color/size `store_product_stock`, 7-day cooldown, Background Always location, **no** in-app ceremony. Includes demo inbox seed so notifications aren’t empty.

## Key claims

- Guests never earn; server-side award only; default 1 point configurable
- Post/promo trigger = linked-products open from Home/Highlights (not new detail routes)
- `products.stock_place` is **not** store stock — new `store_product_stock` required
- Nearby = OS push + inbox only; ceremony reserved for discovery points
- **7 agents** sized for ~200k context

## Related

- [[wiki/sources/2026-07-28-expo-customer-notifications-plan]]
- [[wiki/concepts/expo-customer-ceremony-motion-asf-2]]
- [[wiki/concepts/store-locations-feature-asf-2]]
- [[wiki/concepts/mobile-app-architecture-asf-2]]
- [[wiki/entities/asf-2]]

## Open questions

- None material for kickoff (Rewards settings path + cron host left to implementers within plan guidance)
