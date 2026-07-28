---
title: "Expo Customer Theme Skins Session Accomplishment — ASF-2"
type: source
updated: 2026-07-28
sources: 1
tags: [asf-2, expo, customer-app, themes, atelier, noir, classic, ssense, zara]
---

# Expo Customer Theme Skins Session Accomplishment — ASF-2

**Raw:** [`raw/sources/2026-07-28-expo-customer-theme-skins-session-accomplishment.md`](../../raw/sources/2026-07-28-expo-customer-theme-skins-session-accomplishment.md)

## Summary

Session source of truth for **theme layout skins** on `asf-customer-app`: three packs (`classic` / `atelier` / `noir`), SUPERADMIN-only Appearance, Atelier ZARA lookbook pass, Noir SSENSE Round 1 + intentional Round 2 (Home curate vs Shop find). Agent prompt files were **deleted** after execution and must not be re-ingested.

## Outline

1. Goals — three intentional personalities, not CSS-only
2. Locked decisions — access, Home≠Shop, references (ZARA / SSENSE), cart chrome rules
3. Architecture — ThemeContext, registry, packs, thin routes
4. Plans kept vs prompts deleted
5. What landed per theme (Classic / Atelier / Noir R1+R2)
6. Remaining gaps
7. Code map + QA checklist

## Wikilinks

- Concept: [[wiki/concepts/expo-customer-theme-skins-asf-2]]
- Architecture: [[wiki/concepts/mobile-app-architecture-asf-2]]
- Entity: [[wiki/entities/asf-2]]
- Plans (raw): theme-skins-plan, polish-plan, atelier-editorial-plan, noir-ssense-plan, noir-intentional-plan

## Open questions

- When (if ever) to open theme picking beyond SUPERADMIN
- How much remaining Tier B profile form skinning is worth before Classic stays default forever
