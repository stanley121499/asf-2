# Expo Customer App — Noir SSENSE Bold Pass (2026-07-28)

**Project**: ASF-2 Expo customer app (`asf-customer-app/`)  
**Date**: July 28, 2026  
**Status**: Approved for implementation (awaiting agent passes)  
**Stakeholder**: Stanley  
**Companion prompts**: deleted after execution (see session SOT [`2026-07-28-expo-customer-theme-skins-session-accomplishment.md`](2026-07-28-expo-customer-theme-skins-session-accomplishment.md))

**Scope**: **Noir theme only** (`themes/noir/**` + shared hooks only if required). Do **not** redesign Classic or Atelier in this program.

**Builds on / corrects:**
- Theme packs — [`2026-07-27-expo-customer-theme-skins-plan.md`](2026-07-27-expo-customer-theme-skins-plan.md)
- Polish pass “Night commerce feed” — [`2026-07-27-expo-customer-theme-skins-polish-plan.md`](2026-07-27-expo-customer-theme-skins-polish-plan.md) §4.3 (partial; Home still list-like; Stores/profile inners incomplete)
- Atelier editorial complete (ZARA lookbook) — [`2026-07-28-expo-customer-atelier-editorial-plan.md`](2026-07-28-expo-customer-atelier-editorial-plan.md) — **leave alone**; use only as contrast
- Access: **SUPERADMIN-only** Appearance — **keep**

---

## 1. What we are doing

A **bold Noir-only redesign** so the theme reads as **SSENSE-adjacent night commerce** — dark-native, dense, scan → tap → buy — **not** Classic boutique with inverted colors, and **not** Atelier magazine theater.

Goals:

1. **Home ≠ Shop** — different silhouette and job on first paint.
2. **Home = after-hours feed** — optional drop hero + dense product stream (prefer **2-col grid**); compact always-on bar (brand + search + bag).
3. **Shop = inventory machine** — **price-forward list** (or denser toolful archive if grid already on Home) + search + one Filter → sheet + header bag.
4. **Full surface set** (same breadth as Atelier pass): Home, Shop, PDP, Highlights, **Stores**, Profile hub + high-traffic **Orders + Account** shell.
5. Leave Classic / Atelier alone.

**Reference:** **SSENSE** (primary). Optional density cues from **Nike SNKRS / GOAT** for Home feed scan — not TikTok Shop / Shein spam.

**Metaphor:** night commerce app — Home = For you / drop stream; Shop = catalog tools; PDP = immersive buy; Highlights = media night feed; Stores = dark locator; Profile = dense settings.

**Triangle check (Home):** Classic = boutique landing · Atelier = season cover/edit · Noir = dark app bar + dense stream. If Noir looks like Classic painted black → fail.

---

## 2. Why

| Feedback / gap | Response |
|----------------|----------|
| Noir risked “Classic dark” | Rebuild IA + silhouettes; tokens already OK |
| Atelier now strong lookbook | Noir must be opposite pole: commerce-app density |
| Current Noir Home = price list rows | Still spreadsheet-ish vs SSENSE visual grid — upgrade stream |
| Stores / profile inners | Same gap as pre-Atelier: Tier B / missing Locations pack screen |
| Fix themes one-by-one | This program = **Noir only** |

---

## 3. Locked decisions

| # | Question | Decision |
|---|----------|----------|
| 1 | Scope | **Noir only** |
| 2 | Direction | **SSENSE-adjacent night commerce** — rebuild IA, not recolor Classic |
| 3 | Home vs Shop | **Must not share card silhouette.** Home = **2-col dense grid** (+ optional one drop hero). Shop = **price-forward list** + tools |
| 4 | Home top nav | **Always-on** compact solid bar: brand + search + bag (≠ Atelier chrome-free cover) |
| 5 | Home secondary | **At most one** strip: offer chips when flag + promos. No category pills, no posts carousel, no Classic section stack |
| 6 | Home motion | **Snappy** settle (~300–500ms feel); shorten/skip long arrival ceremony. `useReducedMotion` → instant. Atelier owns long editorial ceremony |
| 7 | Shop chrome | Search + **one** Filter & sort → sheet; header bag; inventory eyebrow/count |
| 8 | Cart | **Header bag** everywhere Noir headers (pack `CartChrome` stays no-op / no FAB) |
| 9 | Accent | Gold `#B89A6A` **sparingly** — CTAs / selected / saved only |
| 10 | Colors | Keep: bg `#0A0A0A`, panel `#161616`, text `#F2F2F0`, muted `#9CA3AF`, border `#2A2A2A` |
| 11 | Type | Inter / UI-forward; price early. **No Playfair editorial hero** (that’s Atelier) |
| 12 | Stores | **Tier A Noir Locations skin** + register `pack.screens.Locations` |
| 13 | Profile inners | **Noir shell** for **Orders list + Account** (header + dense rows); deep forms may stay token shell |
| 14 | Theme access | Unchanged: **SUPERADMIN-only** Appearance |
| 15 | Classic / Atelier | **Do not edit** layouts (shared files: minimal `themeId === "noir"` branches only) |
| 16 | Coding standards | Double quotes; strict TS; no `any`; no `!`; no `as unknown as T`; JSDoc; no npm start; no commit unless asked |

---

## 4. Design brief — Noir screens

### 4.1 Home — “For you / after hours” (feed)

**Job:** Fast discovery. Scan → open PDP or jump to Shop.

**First paint:**
1. Compact solid top bar (brand + search + bag) — always visible.
2. Optional **one** drop hero (~50–60% viewport): product/post image, price + name under or lightly overlaid — commerce drop, not magazine essay.
3. Optional offer **chips** strip (only if promos).
4. Masthead: small-caps **For you** / **New** + quiet Shop all → (cut boutique “arrivals” soft copy where possible).
5. Primary: **2-col dense grid** (3:4 or square thumbs, price under image, muted name, corner heart). Cap ~24 items — feed is the product; no category text-index closer.

**Motion:** Short once-per-session settle OK; do not block for 1–1.5s Atelier-style presence.

**Guide:** Keep `home.search` / `home.bag` / `home.saveHeart` resolvable (first grid heart).

**Fail if:** Home is still only left-thumb list rows identical to Shop list, or Home becomes Atelier chapters.

### 4.2 Shop — “Inventory / catalog”

**Job:** Find any product.

**First paint must read as tools + inventory:**
- Header: search affordance + bag; eyebrow e.g. Catalog / All + count.
- **Price-forward list** (`NoirProductCard` or successor) — distinct from Home grid.
- One Filter & sort → dark sheet (no Classic double pill highway).

**Fail if:** Removing Shop chrome still looks like Home grid.

### 4.3 PDP — “Immersive buy”

Keep dark media-first + strong sticky Add (already closest to intentional). Tighten spacing; header bag must not fight floating controls; accent on Add only. Polish, not greenfield.

### 4.4 Highlights — “Night media feed”

Media-first dark frames; captions secondary. Not product-card clones, not Atelier snap-journal copy. Align density with Home night language.

### 4.5 Stores — “Dark locator” (new Noir skin)

**Job:** Find physical stores in Noir chrome.

- Near-black ground, compact list/map, muted meta, accent sparingly on primary actions (e.g. directions).
- Not Classic locator + dark tokens only.
- Register `pack.screens.Locations`; thin `app/(tabs)/locations.tsx` mounts pack screen when present (Atelier already does this pattern — extend for noir).

### 4.6 Profile hub — “Dense settings”

Compact list rows, hairline separators, header bag if pattern exists. SUPERADMIN Appearance only. Polish hub to match night commerce density (not Classic card stack painted black).

### 4.7 Profile inners — Noir shell

**Orders list + Account** at minimum:
- Noir header treatment via `SubPageHeader` when `themeId === "noir"` (Atelier already branches — add parallel noir branch carefully).
- Dense dark rows; avoid cream/white Classic cards under noir.
- Order detail light touch; claims/collection forms out of deep redesign.

### 4.8 Contrast reminder

| | Classic | Atelier | Noir |
|--|---------|---------|------|
| Metaphor | Boutique landing | ZARA lookbook | SSENSE night commerce |
| Home | Sections / ceremony | Cover + chapters | Bar + drop + **grid** |
| Shop | Boutique browse | Archive lookbook grid | **List** + filters |
| Cart | Header bag | FAB | Header bag |
| Motion | Ceremony | Long editorial | Snappy |

---

## 5. Code map

| Area | Path |
|------|------|
| Noir pack | `themes/noir/**` |
| Home (current list feed) | `themes/noir/screens/Home.tsx` |
| Shop + list card | `themes/noir/screens/Shop.tsx`, `themes/noir/components/NoirProductCard.tsx` |
| PDP / Highlights / ProfileHub | `themes/noir/screens/{ProductDetail,Highlights,ProfileHub}.tsx` |
| Cart | `themes/noir/CartChrome.tsx` (no-op), `components/cart/CartButton.tsx` |
| Registry / types | `themes/registry.ts`, `themes/types.ts` (`Locations?`) |
| Thin locations | `app/(tabs)/locations.tsx` — Atelier Locations exists; add Noir |
| Atelier Locations (pattern only) | `themes/atelier/screens/Locations.tsx` — **do not redesign**; copy patterns sparingly |
| Profile inners | `app/(tabs)/profile/orders/**`, `account.tsx`, `components/SubPageHeader.tsx` |
| Theme gate | Appearance SUPERADMIN-only |
| i18n | `i18n/locales/{en,ms,zh-CN}.json` |

**Current state note:** Noir already cut Classic section stack on Home and has a price-forward Shop list + filter sheet. This pass **raises intentionality to SSENSE** (Home grid + drop, full Stores/Profile shell) — do not regress to Classic clones.

---

## 6. Agent phases (~200k-sized)

| Agent | Delivers | Depends on | Size |
|-------|----------|------------|------|
| **1** | Home ≠ Shop: Home drop + **2-col grid** + snappy motion; Shop **list** + archive chrome/filter polish | — | Large (two screens, one job — do not split mid-silhouette) |
| **2** | PDP tighten + Highlights night media feed | Agent 1 preferred | Medium |
| **3** | Noir Stores (Locations) skin + thin route/registry | Agent 1 preferred | Medium |
| **4** | Profile hub polish + Orders/Account Noir shell (`SubPageHeader`) | Agent 1 optional | Medium |

**Serial:** 1 → 2 → 3 → 4.  
**Parallel after 1:** 2 ∥ 3 ∥ 4 if files don’t collide (`SubPageHeader` = Agent 4 only).

**Context guidance:** Agent 1 is the heaviest — stay inside `themes/noir/**` + i18n; avoid reading entire Atelier Home. Agents 2–4 should not reopen Home/Shop structure.

---

## 7. Acceptance

1. On Noir, user can tell Home from Shop in **under 2 seconds** (grid vs list + chrome).
2. Home first paint = compact bar + (optional drop) + dense **grid** stream — not Classic section stack, not Atelier cover.
3. Shop = search + filter sheet + **price-forward list** + header bag.
4. PDP sticky Add + immersive media; Highlights media-first dark.
5. Stores under Noir looks intentional dark locator (pack Locations).
6. Orders + Account feel dense night settings under Noir.
7. Classic/Atelier unchanged in behavior/layout.
8. SUPERADMIN theme switching still works; normals have no Appearance.
9. Guide anchors don’t crash; reduced motion respected; accent sparse.
10. `tsc --noEmit` clean; no npm start / no commit unless asked.

---

## 8. Out of scope

- Classic / Atelier redesign
- Customer-facing theme picker
- 4th theme
- Full redesign of every profile sub-route (claims, collection forms, etc.)
- Making Noir use FAB or Atelier Playfair chapters
- Screenshot-dependent microcopy (Stanley may follow up with shots)
