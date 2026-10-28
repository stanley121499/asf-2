---
title: "Expo customer perf + engagement mid-record 2026-09-14"
type: source
updated: 2026-09-28
sources: 1
tags: [asf-2, expo, customer-app, performance, discovery-points, nearby-stock, mid-record]
---

# Expo customer perf + engagement mid-record 2026-09-14

**Raw:** [2026-09-14-expo-customer-perf-engagement-mid-record.md](../../raw/sources/2026-09-14-expo-customer-perf-engagement-mid-record.md)  
**Current runtime / crash SOT:** [[wiki/sources/2026-09-28-expo-customer-apk-crash-ui-polish-mid-record]]

## Summary

Mid-session checkpoint for Expo customer **engagement** (discovery points + nearby wishlist stock) and **performance** work. Locked product decisions unchanged; **nearby kill-switched OFF by default** after APK crash correlation with TaskManager/background location. Perf: boot/`[prio]` logging, P0–P2 data strategy, idle warm (PRELOAD → images → loadMore → notifications), `scheduleAfterIdle`, `PageLoadingSkeleton`, Storefront feed hero image sizing; bundling box is Expo Go DEV only. Much code may be **local/uncommitted** — verify git before EAS. Agent prompt dumps **deleted** (do not re-ingest).

## Key claims (still true)

- Nearby: `EXPO_PUBLIC_NEARBY_STOCK_ALERTS_ENABLED` must be `"true"` to enable; default off
- Discovery: no guests; 1pt admin-editable; ceremony on award only; posts/promos via linked-products
- Do not use Vercel MCP; EAS `stanley12149` / `asf-customer-app`; API `https://asf-2.vercel.app`
- Perf backlog + measure on release APK still apply

## Update 2026-09-16 (native plugin gate) — superseded detail in 2026-09-28

- SDK myth + native gate notes absorbed into [[wiki/sources/2026-09-28-expo-customer-apk-crash-ui-polish-mid-record]]: crash resolved by removing `expo-task-manager` from deps (not JS kill-switch alone); do not reinstall casually.

## Related

- [[wiki/sources/2026-09-28-expo-customer-apk-crash-ui-polish-mid-record]]
- [[wiki/sources/2026-09-08-expo-customer-engagement-discovery-points-nearby-stock-plan]]
- [[wiki/sources/2026-09-08-expo-customer-engagement-qc-notes]]
- [[wiki/concepts/expo-customer-ceremony-motion-asf-2]]
- [[wiki/concepts/mobile-app-architecture-asf-2]]
- [[wiki/concepts/store-locations-feature-asf-2]]
- [[wiki/entities/asf-2]]

## Contradictions / open tension

- Prefer **2026-09-28 mid-record** for crash root-cause, task-manager hygiene, guest browse, and UI polish.
- This page remains useful for locked engagement decisions and the perf P0–P2 inventory.
