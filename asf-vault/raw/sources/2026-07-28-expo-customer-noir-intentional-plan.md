# Expo Customer App — Noir Intentional Redesign (Round 2) (2026-07-28)

**Project**: ASF-2 Expo customer app (`asf-customer-app/`)  
**Date**: July 28, 2026  
**Status**: Approved for planning → implementation  
**Stakeholder**: Stanley  
**Companion prompts**: deleted after execution (see session SOT [`2026-07-28-expo-customer-theme-skins-session-accomplishment.md`](2026-07-28-expo-customer-theme-skins-session-accomplishment.md))

**Scope**: **Noir theme only** (`themes/noir/**` + minimal shared branches). Do **not** redesign Classic or Atelier.

**Builds on / corrects:**
- Round 1 SSENSE pass — [`2026-07-28-expo-customer-noir-ssense-plan.md`](2026-07-28-expo-customer-noir-ssense-plan.md) (silhouette + wiring shipped; **craft and jobs incomplete**)
- Stanley QA after Round 1:
  1. Home ≈ Shop — same catalog job; grid vs list not enough
  2. Stores looks functionality-only / undesigned
  3. Shop + PDP feel like Classic reskin (col change only)
  4. Some Tier B pages break dark theme (e.g. Rewards: light card + near-invisible muted text)

**Reference:** SSENSE (commerce density) + SNKRS/GOAT (Home drop energy). ≠ Atelier ZARA lookbook. ≠ Classic boutique inverted.

---

## 1. What we are doing

A **second Noir-only pass** that fixes **jobs and craft**, not another grid↔list tweak.

Goals:

1. **Home ≠ Shop by job** — Home curates a short night drop; Shop finds anything in the full catalog.
2. **Shop + PDP feel designed** — intentional inventory UI and immersive buy plate, not Classic structure + dark tokens.
3. **Stores feels composed** — locator with a clear visual system, not a form dump.
4. **Dark-native Tier B** — no inverted light cards / unreadable contrast under Noir (Rewards and siblings).
5. Leave Classic / Atelier alone.

---

## 2. Why Round 1 was not enough

| Shipped in R1 | Still broken |
|---------------|--------------|
| Home drop + 2-col grid of ~24 newest | Same browse job as Shop |
| Shop price-forward list + filter sheet | Reads as unfinished index / reskin |
| PDP spacing + gold sticky Add | Still Classic PDP inverted |
| Locations pack screen + Maps fix | Dense meta rows, no composition |
| Profile hub / Orders / Account shell | Other inners (Rewards…) still Classic recipes |

**Hard rule for this pass:** Do not ship “Home shows catalog subset in a different card.” If Home and Shop still feel like duplicates after crop titles, fail.

---

## 3. Locked decisions

| # | Question | Decision |
|---|----------|----------|
| 1 | Scope | **Noir only** |
| 2 | Home job | **Curate / drop** — what’s on tonight; **≤6–8 SKUs**, large media; optional one story rail (offers *or* journal peek — not both Classic clones) |
| 3 | Shop job | **Find anything** — full catalog + search + Filter sheet + count; tools-first masthead |
| 4 | Home silhouette | Large drop + **large** single-column or asymmetric featured stream (SNKRS/GOAT). **Not** dense 2-col of 24 identical cells matching Shop density |
| 5 | Shop silhouette | Intentional **inventory index** (dense list *or* tight archive) — must not match Home card size/rhythm |
| 6 | PDP | Redesign as immersive night buy plate (media system + second-act type/variants + sticky Add as only loud gold) |
| 7 | Stores | Pick **one** composition and commit: prefer **full-bleed store plates** (hero image + name + distance + one primary Maps CTA, secondary Waze) **or** map-sheet + list — **not** thumb + ADDRESS/PHONE form forever. Default locked: **hero plates** (list of immersive rows) |
| 8 | Cart | Header bag; no FAB |
| 9 | Accent | Gold sparingly — CTAs / selected / saved only |
| 10 | Type | Inter / UI-forward on Noir; avoid Playfair as default (Classic/Atelier) |
| 11 | Tier B dark | No `tokens.text` as card fill with light muted labels; contrast-safe under Noir |
| 12 | Theme access | SUPERADMIN Appearance only |
| 13 | Coding | Double quotes; no `any` / `!` / `as unknown as T`; JSDoc; no npm start; no commit unless asked |

---

## 4. Design briefs

### 4.1 Home — “Tonight’s drop” (curate)

**Job:** Orient + hype a short edit. Not inventory browse.

**First paint:**
- Compact bar: brand + search (→ Shop) + bag
- One strong drop / featured frame
- Then **≤6–8** large product moments (tall or wide featured cards — not Home-as-mini-Shop grid of 24)
- Optional one secondary rail only (chips *or* journal peek)
- Quiet “Shop all →” into Shop — Home ends the drop; Shop is the archive

**Fail if:** Home is still “first N of catalog in a grid.”

### 4.2 Shop — “Catalog machine” (find)

**Job:** Search, filter, scan price, open PDP.

**First paint:**
- Sticky tools: search + filter summary + result count
- Dense intentional index (list preferred if Home goes large featured; if Home is single-col large, Shop may use tighter 2-col archive — **either way silhouettes must diverge**)
- Designed empty / no-results states

**Fail if:** Removing chrome still looks like Home.

### 4.3 PDP — “Immersive buy”

- Full-bleed / edge media system (taller hero, quieter floating chrome)
- Price + name + variants as clear act two on dark panel
- Sticky Add = only primary gold; wishlist/bag don’t fight it
- Not Classic sections with `tokens.bg`

### 4.4 Stores — “Night places” (compose)

**Locked default: hero plates**
- Each store: large image band (or strong panel), name + mall + distance, one short address line, **primary Maps** + secondary Waze as designed pair
- No multi-gallery height chaos; no screaming form labels
- Header: Locator / Stores / count — typographic, intentional

**Fail if:** Looks like a CRM list on black.

### 4.5 Phase 0 — Dark-native Tier B

Priority surfaces (at least):
- `profile/rewards.tsx` (known broken: white-ish card + invisible muted)
- Wishlist, cart chrome if contrast fails under noir
- Any profile inner still using Classic light-card recipes without noir branch

**Pattern:** Prefer `tokens.panel` / `tokens.bg` + `tokens.text` / `tokens.muted` with verified contrast; or `themeId === "noir"` branches. Do not break Classic/Atelier.

---

## 5. Code map

| Area | Path |
|------|------|
| Noir pack | `themes/noir/**` |
| Home / Shop / PDP | `themes/noir/screens/{Home,Shop,ProductDetail}.tsx` |
| Grid/list cards | `themes/noir/components/{NoirGridCard,NoirProductCard}.tsx` |
| Stores | `themes/noir/screens/Locations.tsx` |
| Rewards | `app/(tabs)/profile/rewards.tsx` |
| SubPageHeader | `components/SubPageHeader.tsx` (noir branch exists) |
| Plan R1 | `asf-vault/raw/sources/2026-07-28-expo-customer-noir-ssense-plan.md` |

---

## 6. Agent phases (~200k-sized)

| Agent | Delivers | Depends | Size |
|-------|----------|---------|------|
| **0** | Dark-native Tier B (Rewards + contrast siblings) | — | Medium |
| **1** | Home job rewrite (≤8 large curated; kill catalog dump) | — | Large |
| **2** | Shop intentional catalog machine | Agent 1 (silhouette lock) | Large |
| **3** | PDP immersive buy redesign | Agent 2 preferred | Medium–large |
| **4** | Stores hero-plate composition | — | Medium |

**Serial:** 1 → 2 → 3.  
**Parallel:** 0 ∥ 1 ∥ 4 at start; after 1: 2; after 2: 3.  
**Do not merge** Home+Shop+PDP into one agent (context risk).

---

## 7. Acceptance

1. Home vs Shop: different **job** in &lt;2s (curated drop vs full catalog tools) — not just grid vs list of same N items.
2. Home shows ≤8 curated large moments; Shop owns full inventory + filters.
3. Shop + PDP read as designed night commerce, not Classic reskin.
4. Stores read as composed hero plates (or locked alternate), not CRM dump.
5. Rewards (and audited Tier B) readable on Noir — no invisible text on light cards.
6. Classic/Atelier unchanged; SUPERADMIN Appearance only.
7. Guide anchors safe; reduced motion OK; accent sparse.
8. `tsc --noEmit` clean; no npm start / no commit unless asked.

---

## 8. Out of scope

- Classic / Atelier redesign
- Customer-facing theme picker
- Full claims/collection form redesign
- Reopening Round 1 docs as source of truth for Home job (this doc supersedes Home “24-grid” guidance)
