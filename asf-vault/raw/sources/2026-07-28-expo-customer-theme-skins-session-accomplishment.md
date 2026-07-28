# Expo Customer App — Theme Skins / Atelier / Noir Session Accomplishment (2026-07-27 → 2026-07-28)

**Date**: Foundation + polish planned/shipped ~2026-07-27; Atelier editorial + Noir SSENSE + Noir intentional Round 2 through 2026-07-28  
**Project**: ASF-2  
**Primary delivery**: `asf-customer-app` (Expo + React Native) — multi-theme **layout skins** (not colors-only)  
**Stakeholder**: Stanley  
**Git**: No commit, push, or merge was performed in these sessions  
**Status**: Implemented and iteratively QA’d on device under SUPERADMIN Appearance switching. Treat **this file** as the wiki source of truth for what landed and what was decided.

---

## 1. What we set out to do

Ship **three intentional theme packs** so staff can QA distinct shopping personalities without rewriting the whole app:

| Theme id | Metaphor / reference | Cart chrome |
|----------|----------------------|-------------|
| `classic` | Boutique landing (baseline) | Header bag |
| `atelier` | **ZARA-adjacent** lookbook / seasonal edit | FAB (hide on PDP + Highlights) |
| `noir` | **SSENSE-adjacent** night commerce (+ SNKRS/GOAT Home energy) | Header bag |

**Not** “Classic + CSS variables.” Each pack owns Tier A screens (Home, Shop, PDP, Highlights, Profile hub, later Stores) plus tokens + tab bar + cart chrome.

**Access (locked):** Themes are **SUPERADMIN / staff QA only** via Profile → Appearance. Default for everyone else: **Classic**. Normals do not pick themes.

---

## 2. Decisions (locked)

| Decision | Choice |
|----------|--------|
| Theme count | Exactly **3**: `classic` \| `atelier` \| `noir` |
| Persistence | AsyncStorage key `asf_theme` |
| Default | `classic` |
| Who can switch | **`user_detail.role === "SUPERADMIN"`** only (Appearance screen) |
| Fix order | Themes **one by one** — Atelier first, then Noir (Classic = baseline) |
| Home ≠ Shop | Hard rule for Atelier **and** Noir — different **job** and silhouette, not only card density |
| Atelier direction | Lookbook / show-first; Home = theater (cover + few chapters); Shop = archive tools |
| Noir direction | Night commerce; Home = **curate / drop**; Shop = **find / inventory**; not Classic inverted |
| Noir Round 1 mistake | Home ≈ Shop when Home dumped ~24 catalog grid cells — **superseded** by Round 2 (≤8 large curated moments) |
| Cart | Classic/Noir = header bag; Atelier = FAB above tab bar; FAB hidden on PDP / Highlights |
| Accent (Noir) | Gold `#B89A6A` sparingly (CTA / selected / saved only) |
| Type | Atelier: Playfair story + Inter tools; Noir: Inter / UI-forward (avoid Playfair as default) |
| Coding | Double quotes; no `any` / `!` / `as unknown as T`; no `npm start` during agent work; no commit unless asked |
| Shared pitfalls | `PressableScale`: put `flexDirection: "row"` on an **inner View** (outer style does not layout children). Direction buttons: put accent fill on **inner View**, not Pressable alone (Maps “vanished” on dark Noir) |

### Triangle check (Home first paint)

| Classic | Atelier | Noir |
|---------|---------|------|
| Boutique landing / sections | Season cover + editorial chapters | Compact bar + curated drop (not Shop twin) |

---

## 3. Architecture shipped

| Piece | Path / note |
|-------|-------------|
| Theme context | `context/ThemeContext.tsx` — hydrate/write `asf_theme`; `useTheme` / `useThemeTokens` / `setTheme` |
| Registry | `themes/registry.ts`, `themes/types.ts` (`ThemePack`, optional `Locations`) |
| Packs | `themes/{classic,atelier,noir}/**` — tokens, tabBar, screens, CartChrome |
| Thin routes | Tab/browse/profile routes mount `pack.screens.*` |
| Appearance | `app/(tabs)/profile/appearance.tsx` — SUPERADMIN gate |
| Circular import | ThemeContext **lazy-requires** registry (avoid Stores crash: `useTheme` missing) |

---

## 4. Plans kept (raw) — agent prompts deleted

| Raw plan | Role |
|----------|------|
| `raw/sources/2026-07-27-expo-customer-theme-skins-plan.md` | Foundation: 3 packs, cart rules, Tier A/B |
| `raw/sources/2026-07-27-expo-customer-theme-skins-polish-plan.md` | Intent polish; SUPERADMIN-only access correction |
| `raw/sources/2026-07-28-expo-customer-atelier-editorial-plan.md` | Atelier ZARA bold pass |
| `raw/sources/2026-07-28-expo-customer-noir-ssense-plan.md` | Noir Round 1 SSENSE pass |
| `raw/sources/2026-07-28-expo-customer-noir-intentional-plan.md` | Noir Round 2 jobs + craft (supersedes R1 Home 24-grid) |
| **This file** | **Session outcome SOT** |

**Agent prompt files were deleted after execution** (vault cleanup; do not re-ingest into wiki):

- `2026-07-27-expo-customer-theme-skins-agent-prompts.md`
- `2026-07-27-expo-customer-theme-skins-polish-agent-prompts.md`
- `2026-07-28-expo-customer-atelier-editorial-agent-prompts.md`
- `2026-07-28-expo-customer-noir-ssense-agent-prompts.md`
- `2026-07-28-expo-customer-noir-intentional-agent-prompts.md`

Plan docs may still mention companion prompt filenames historically; prefer this accomplishment for delivery status.

---

## 5. What landed — by theme

### 5.1 Classic

- Baseline boutique pack extracted into `themes/classic/**`.
- Remains default; not redesigned in Atelier/Noir programs.

### 5.2 Atelier (ZARA lookbook)

- **Home:** Cover (“THIS SEASON” / edit), chrome-free first paint + scroll-reveal brand/search; ≤3 tall chapters with captions; text category index; once-per-session entrance (~1–1.5s); later home enrich: unequal chapter layouts, bridge, offers Insert, journal teaser, archive CTA.
- **Shop:** Sticky Archive masthead + 2-col 3:4 lookbook grid + Filter sheet; heart/layout fixes.
- **PDP:** Tall plate; FAB hidden; slim Add bar.
- **Highlights:** Vertical snap chapters; FAB hidden.
- **Stores:** Atelier Locations / Places skin; Maps/Waze via `lib/openStoreMaps.ts`.
- **Profile:** Colophon hub; Orders/Account Atelier shell via `SubPageHeader` when `themeId === "atelier"`.

### 5.3 Noir Round 1 (SSENSE silhouette + wiring)

- Home: bar + drop + (initially) dense grid; Shop: price-forward list + filter sheet; PDP/Highlights polish; Locations pack screen; Profile hub + Orders/Account noir shell.
- **Hotfixes:** Shop `PressableScale` row layout (thumb/price/heart full-width); Stores densify then Maps visibility (accent on inner View); Google Maps restored beside Waze.

### 5.4 Noir Round 2 (intentional — jobs + craft)

| Agent | Delivery |
|-------|----------|
| 0 | Dark-native Tier B: Rewards contrast fix; StampGrid tokens; light Wishlist/Claims noir branches |
| 1 | Home = curated “tonight’s drop”: ≤8 large `NoirFeaturedCard` moments (not 24-grid Shop twin) |
| 2 | Shop = tools-first Inventory masthead + dense list ≠ Home |
| 3 | PDP = immersive buy plate (~70% media, glass chrome, gold sticky Add only) |
| 4 | Stores = hero-plate “night places” (full-bleed bands; Maps+Waze pair) |

---

## 6. Known remaining gaps / honesty

- Not every profile deep form is Noir- or Atelier-skinned (claims/collection forms largely token shell).
- Further craft polish may still be needed after device QA (Stanley: “kinda okay for now”).
- Classic remains the production-facing default until themes are opened beyond SUPERADMIN.
- `app.json` LSApplicationQueriesSchemes updates for Maps/Waze may need a native rebuild to fully query schemes on device.

---

## 7. Code map (quick)

```
asf-customer-app/
  context/ThemeContext.tsx
  themes/{classic,atelier,noir}/
  themes/registry.ts
  themes/types.ts
  app/(tabs)/profile/appearance.tsx
  components/SubPageHeader.tsx          # atelier + noir branches
  components/cart/{CartButton,CartChromeHost}.tsx
  lib/openStoreMaps.ts
```

---

## 8. Acceptance checklist (staff QA)

1. SUPERADMIN Appearance cycles Classic / Atelier / Noir; normals have no Appearance (or no switch).
2. Atelier: Home ≠ Shop in &lt;2s (cover/chapters vs archive grid + tools).
3. Noir: Home ≠ Shop by **job** (curated drop ≤8 vs full inventory tools).
4. Noir Rewards: no white card with invisible muted text.
5. Noir Stores: hero plates; **GOOGLE MAPS** + **WAZE** both visible when available.
6. Atelier FAB / Noir header bag behave per theme; FAB not on Atelier PDP.
7. Classic layouts unchanged when switched back.
8. Guide anchors do not hard-crash when chrome deferred.

---

## 9. Suggested commits (only if Stanley asks)

Historical agent commit suggestions were never applied in-session. If committing later, prefer theme-scoped commits (foundation → atelier → noir R1 → noir R2) rather than one mega-commit.
