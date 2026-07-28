---
title: "Expo Customer Theme Skins — ASF-2"
type: concept
updated: 2026-07-28
sources: 1
tags: [asf-2, expo, customer-app, themes, atelier, noir, classic]
---

# Expo Customer Theme Skins — ASF-2

`asf-customer-app` supports **three layout theme packs** (not color-only skins). Staff switch themes for QA; customers stay on **Classic** by default.

## Themes

| Id | Intent | Reference | Cart |
|----|--------|-----------|------|
| `classic` | Boutique landing (default) | Baseline ASF boutique | Header bag |
| `atelier` | Lookbook / seasonal edit | ZARA-adjacent | FAB (hide PDP + Highlights) |
| `noir` | Night commerce | SSENSE + SNKRS/GOAT Home | Header bag |

## Access

- Persist: AsyncStorage `asf_theme`
- UI: Profile → **Appearance** — **`SUPERADMIN` only**
- Default: `classic`

## Hard product rules

- **Home ≠ Shop** for Atelier and Noir (different job + silhouette).
- Atelier Home = theater/cover + few chapters; Shop = archive + tools.
- Noir Home = **curate** (≤8 large drop moments); Shop = **find** (full catalog + filters). Round 1’s ~24 Home grid was wrong and superseded.
- Prefer pack-local screens under `themes/{id}/**`; thin routes mount `pack.screens.*`.

## Implementation anchors

- `context/ThemeContext.tsx`, `themes/registry.ts`, `themes/types.ts`
- Packs: `themes/classic|atelier|noir/**`
- `app/(tabs)/profile/appearance.tsx`
- `components/SubPageHeader.tsx` (atelier + noir branches)
- `lib/openStoreMaps.ts` (Stores directions)

## Pitfalls

- `PressableScale`: multi-child rows need an **inner** `flexDirection: "row"` View.
- Accent-filled buttons on dark: paint fill on an **inner View** (Pressable-only fill can hide labels — Noir Maps regression).

## Source of truth

Session delivery + decisions: [[wiki/sources/2026-07-28-expo-customer-theme-skins-session-accomplishment]]  
Raw: `raw/sources/2026-07-28-expo-customer-theme-skins-session-accomplishment.md`

Related plans (kept; agent prompts deleted): theme-skins + polish (2026-07-27), atelier-editorial, noir-ssense, noir-intentional (2026-07-28).

## See also

- [[wiki/concepts/mobile-app-architecture-asf-2]]
- [[wiki/concepts/expo-customer-ceremony-motion-asf-2]]
- [[wiki/entities/asf-2]]
