---
title: "Expo customer engagement QC notes 2026-09-08"
type: source
updated: 2026-09-28
sources: 1
tags: [asf-2, expo, customer-app, discovery-points, nearby-stock, qc]
---

# Expo customer engagement QC notes 2026-09-08

**Raw:** [2026-09-08-expo-customer-engagement-qc-notes.md](../../raw/sources/2026-09-08-expo-customer-engagement-qc-notes.md)  
**Plan:** [[wiki/sources/2026-09-08-expo-customer-engagement-discovery-points-nearby-stock-plan]]  
**Later runtime status:** [[wiki/sources/2026-09-28-expo-customer-apk-crash-ui-polish-mid-record]] (prior: [[wiki/sources/2026-09-14-expo-customer-perf-engagement-mid-record]])

## Summary

Agent 7 QC against plan §13. Static + Supabase evidence: **11 PASS / 1 FAIL / 5 SKIP**. Ceremony only on awarded content-view; `stock_place` unused as store stock. Demo inbox seeded (6 rows) for `f94dfdc6-1212-4893-8617-b248ba26ab8c`. **P0: none.** P2: Highlights does not open linked-products; some demo deep links non-UUID; nearby E2E needs native Always + cron. Post-QC (2026-09-14): nearby default-disabled via kill-switch after APK crash correlation.

## Related

- [[wiki/sources/2026-09-08-expo-customer-engagement-discovery-points-nearby-stock-plan]]
- [[wiki/sources/2026-09-28-expo-customer-apk-crash-ui-polish-mid-record]]
- [[wiki/sources/2026-09-14-expo-customer-perf-engagement-mid-record]]
- [[wiki/concepts/expo-customer-ceremony-motion-asf-2]]
- [[wiki/concepts/mobile-app-architecture-asf-2]]
