---
title: "Expo customer APK crash + UI polish mid-record 2026-09-28"
type: source
updated: 2026-09-28
sources: 1
tags: [asf-2, expo, customer-app, apk-crash, task-manager, nearby-stock, guest-browse, ui-polish, mid-record]
---

# Expo customer APK crash + UI polish mid-record 2026-09-28

**Raw (SOT):** [2026-09-28-expo-customer-apk-crash-ui-polish-mid-record.md](../../raw/sources/2026-09-28-expo-customer-apk-crash-ui-polish-mid-record.md)

## Summary

Mid-session checkpoint superseding [[wiki/sources/2026-09-14-expo-customer-perf-engagement-mid-record]] for **runtime / crash / kill-switch / UI polish** status. Instant APK close was **not** SDK 57 alone (Sep 5 `2f931d4d` / `7ce176d` already SDK 57 and opened); cause was `expo-task-manager` autolink + Always/FGS from nearby (`7c34ef3`+). JS kill-switches insufficient — remove package + strip plugins. Task-manager accidentally restored by `expo install --fix` then removed again; do not reinstall casually. Working APK after removal. Nearby + push remain OFF by default. Guest browse fixed (tabs/`NavigationSync`); checkout still gated. Home hero below chrome; category rail chevron toggle; Highlights 查看全部 removed; discovery +1 quiet side banner hold 1275ms. Vault-wide `*agent-prompts*` deleted — do not re-ingest. Verify git before next EAS.

## Key claims

- Crash ≠ SDK 57 alone; = TaskManager autolink + Always/FGS location
- `EXPO_PUBLIC_NEARBY_STOCK_ALERTS_ENABLED` / `EXPO_PUBLIC_PUSH_NOTIFICATIONS_ENABLED` must be `"true"` to enable; default off
- Do not reinstall `expo-task-manager` for APK until safe cold-start path
- EAS uploads local tree; dirty `*` commit; fingerprint must change for native fixes
- No Vercel MCP; EAS `stanley12149` / `asf-customer-app`

## Related

- [[wiki/sources/2026-09-14-expo-customer-perf-engagement-mid-record]] — prior mid-record (perf + engagement; still true for locked product decisions / perf backlog)
- [[wiki/sources/2026-09-08-expo-customer-engagement-discovery-points-nearby-stock-plan]]
- [[wiki/sources/2026-09-08-expo-customer-engagement-qc-notes]]
- [[wiki/concepts/expo-customer-ceremony-motion-asf-2]]
- [[wiki/concepts/mobile-app-architecture-asf-2]]
- [[wiki/entities/asf-2]]

## Contradictions / open tension

- Prefer **this 2026-09-28 mid-record** over Sep 14 / Sep 16 wiki addendum for crash root-cause and “what not to reinstall.”
- Sep 14 still authoritative for locked engagement product decisions and perf P0–P2 inventory; this page only summarizes deltas + still-true enablement.
