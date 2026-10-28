---
title: "Expo customer Home tidy revamp plan 2026-08-12"
type: source
updated: 2026-08-12
tags: [asf-2, expo, customer-app, home, classic, noir, simon]
---

# Expo customer Home tidy revamp plan 2026-08-12 (Round 1)

**Status:** Historical — tidy grammar **superseded** by [[wiki/sources/2026-08-12-expo-customer-home-tidy-r2-plan]]. Round 1 helpers (`lib/homeLayout.ts`) remain useful; device audit found Round 1 not tidy enough.

**Raw:** [2026-08-12-expo-customer-home-tidy-revamp-plan.md](../../raw/sources/2026-08-12-expo-customer-home-tidy-revamp-plan.md)  
**Companion prompts:** [2026-08-12-expo-customer-home-tidy-revamp-agent-prompts.md](../../raw/sources/2026-08-12-expo-customer-home-tidy-revamp-agent-prompts.md) (historical)

## Summary

Round 1 plan for **Classic + Noir** Home: equal media/spacing tokens, viewport frames, useful content (newest product Frame 1, then offers → products → posts). **Shipped but failed tidy on device** — implement Round 2 instead.

## Locked decisions (abbrev)

| # | Choice |
|---|--------|
| Frame 1 | Newest **product** (+ optional thin promo cue if active) |
| Viewport | Strict full-frame fit |
| Categories | Demote |
| Sacred CTAs | None |
| Themes | Classic + Noir only |

## Agent pack

**Three** sequential agents: (1) shared layout helpers + offers empty-gap (2) Classic Home (3) Noir Home + posts beat. Sized for ~200k context.

## Related

- [[wiki/concepts/expo-customer-theme-skins-asf-2]]
- [[wiki/concepts/expo-customer-ceremony-motion-asf-2]]
- [[wiki/syntheses/2026-07-17-expo-customer-home-catalog-revamp-session-accomplishment]]
- [[wiki/entities/asf-2]]
