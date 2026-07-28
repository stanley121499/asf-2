# Expo Customer App — Atelier Editorial Redesign (Bold Pass) (2026-07-28)

**Project**: ASF-2 Expo customer app (`asf-customer-app/`)  
**Date**: July 28, 2026  
**Status**: Approved for implementation (awaiting agent passes)  
**Stakeholder**: Stanley  
**Companion prompts**: deleted after execution (see session SOT [`2026-07-28-expo-customer-theme-skins-session-accomplishment.md`](2026-07-28-expo-customer-theme-skins-session-accomplishment.md))  

**Scope**: **Atelier theme only** (`themes/atelier/**` + shared hooks only if required). Do **not** redesign Classic or Noir in this program.

**Builds on / corrects:**
- Theme packs already exist — [`2026-07-27-expo-customer-theme-skins-plan.md`](2026-07-27-expo-customer-theme-skins-plan.md)
- Polish pass — [`2026-07-27-expo-customer-theme-skins-polish-plan.md`](2026-07-27-expo-customer-theme-skins-polish-plan.md) (access = SUPERADMIN-only Appearance — **keep**)
- Stanley QA: Home ≈ Shop confusion; Atelier not bold enough; Stores + profile inners never got real Atelier layouts (Tier B tokens only)

---

## 1. What we are doing

A **bold Atelier-only editorial redesign** so the theme reads as a **lookbook / seasonal edit** (ZARA-adjacent: show & atmosphere first, not sales-optimization chrome).

Goals:

1. **Home ≠ Shop** — different silhouette and job on first paint (kill “wrong tab” confusion).
2. **Bolder Home** — optional chrome-free first viewport; richer once-per-session entrance motion (not a second splash).
3. **Shop = archive** — toolful (search + filter sheet), denser cards than Home chapters.
4. **Extend Atelier beyond hub screens** — **Stores** gets a real Atelier skin; high-traffic **profile inners** get Atelier chrome/shell (not Classic structure with paper paint only).
5. Leave Classic / Noir alone.

**Metaphor:** magazine edit — Home = cover + curated spreads; Shop = back catalog index; PDP = plate; Highlights = journal; Stores = places in the same paper language; Profile = colophon.

---

## 2. Why

| Feedback | Response |
|----------|----------|
| Home feels like product list on load | Home chapters use same tall product stack language as Shop lookbook list |
| Editorial should be bolder (ZARA / for-show) | Home may drop persistent top nav; more intentional load-in motion |
| Stores / profile inners untouched | Plan had them Tier B only — incomplete for a real theme |
| Fix themes one-by-one | This program = **Atelier only** |

---

## 3. Locked decisions

| # | Question | Decision |
|---|----------|----------|
| 1 | Scope | **Atelier only** |
| 2 | Direction | **Editorial / lookbook / show-first** (ZARA-adjacent), not conversion-max grid |
| 3 | Home vs Shop | **Must not share card silhouette.** Home = few curated chapters; Shop = denser archive list + tools |
| 4 | Home top nav | **No persistent top app bar on first paint.** Brand/search may reveal on scroll, or search lives primarily on Shop; keep guide anchors resolvable (deferred chrome or invisible targets) |
| 5 | Home motion | **Richer once-per-session entrance** (stagger type + chapters); respect `useReducedMotion`; total presence ~1–1.5s feel, not multi-second blocker |
| 6 | Shop chrome | **Keep** search + one Filter & sort → sheet (already); denser cards than Home |
| 7 | FAB | Keep Atelier FAB; **hide on PDP** (existing rule); align above tab bar |
| 8 | Stores | **Tier A Atelier Locations skin** (new screen in pack / registry) |
| 9 | Profile inners | **Atelier shell** for high-traffic: at least **Orders list**, **Account**; others may stay token shell this pass if time — prefer Orders + Account + shared Atelier `SubPage` header treatment |
| 10 | Theme access | Unchanged: **SUPERADMIN-only** Appearance |
| 11 | Classic / Noir | **Do not edit** layouts (except unavoidable shared components — prefer atelier-local wrappers) |
| 12 | Coding standards | Double quotes; strict TS; no `any`; no `!`; no `as unknown as T`; JSDoc; no npm start; no commit unless asked |

---

## 4. Design brief — Atelier screens

### 4.1 Home — “This season’s edit” (theater)

**Job:** Orient + inspire. Not full catalog browse.

**First paint:**
- Full editorial: large type and/or **one** hero story frame — **no sticky brand/search bar** competing with the cover.
- Then **2–3** product **chapters** max (editorial caption / chapter label — not identical to Shop cards).
- Optional secondary: slim horizontal “Shop the edit” thumbs **or** text category index → Shop (not another tall product feed).

**Motion:** Once per JS session (reuse/extend home ceremony patterns); stagger intro → chapters; reduced motion = instant/static.

**Chrome:** Scroll-reveal minimal bar (brand + search) **or** no search on Home (search icon only after reveal / Shop tab). Document choice in code comments. Guide: `home.search` / `home.bag` / `home.saveHeart` must not hard-crash — no-op or late register OK.

### 4.2 Shop — “Archive / lookbook index”

**Job:** Find any product.

**First paint must read as inventory:**
- Visible search + Filter & sort control.
- Eyebrow e.g. “Archive” / All shoes + optional count.
- **Denser** cards than Home (shorter crop, smaller type, tighter gaps) — **fail the test** if removing Shop chrome still looks like Home.

### 4.3 PDP — “Plate”

Tall portrait, quiet Add, text-index variants; FAB hidden. Polish only if needed after Home/Shop split.

### 4.4 Highlights — “Journal”

Editorial frames / captions — not product-card clones. Align motion lightly with Home paper language.

### 4.5 Stores — “Places” (new Atelier skin)

**Job:** Find physical stores in the same magazine language.

- Paper ground, Playfair/section titles, quieter list or map chrome.
- Not Classic locator with tokens swapped only.
- Register `pack.screens.Locations` for atelier; thin `app/(tabs)/locations.tsx` to mount pack screen when present (fallback: current token shell for classic/noir).

### 4.6 Profile hub — “Colophon” (keep direction)

Text-index hub already started — ensure consistent with bold Home paper language; SUPERADMIN Appearance only.

### 4.7 Profile inners — Atelier shell

**Orders list + Account** at minimum:
- Atelier header treatment (hairline, uppercase eyebrow, paper bg) — via atelier-specific header component or themed `SubPageHeader` variant when `themeId === "atelier"`.
- List rows as text-index where feasible; avoid Classic heavy white cards if easy wins exist.
- Deep claim/collection forms can remain mostly token shell this pass.

### 4.8 Colors (keep)

Paper `#F6F1E8`, panel `#EDE6DA`, accent `#8B7355`, ink `#2C2416`. Playfair for story; Inter for tools.

---

## 5. Code map

| Area | Path |
|------|------|
| Atelier pack | `themes/atelier/**` |
| Registry | `themes/registry.ts`, `themes/types.ts` (`Locations?`) |
| Thin locations | `app/(tabs)/locations.tsx` |
| Profile inners | `app/(tabs)/profile/orders/**`, `account.tsx`, `SubPageHeader.tsx` |
| Home ceremony | `components/home/HomeArrivalCeremony.tsx`, `lib/motion.ts` |
| FAB | `themes/atelier/CartChrome.tsx` |
| Theme gate | Profile Appearance SUPERADMIN-only (do not reopen to customers) |

---

## 6. Agent phases (~200k-sized)

| Agent | Delivers | Depends on |
|-------|----------|------------|
| **1** | Home ≠ Shop split: redesign Home (chrome-free first paint + curated chapters) + densify Shop cards / archive chrome | — |
| **2** | Home entrance motion + scroll-reveal chrome / guide-safe search | Agent 1 |
| **3** | Atelier Stores (Locations) skin + wire thin route/registry | Agent 1 preferred |
| **4** | Profile inners Atelier shell (Orders + Account + header) + hub consistency pass | Agent 1 optional |

**Serial:** 1 → 2 → 3 → 4.  
**Parallel after 1:** 2 ∥ 3 ∥ 4 if they don’t collide on Home.tsx.

---

## 7. Acceptance

1. On Atelier, user can tell Home from Shop in **under 2 seconds** (silhouette + chrome).
2. Home first paint has **no persistent** Classic-style top nav; entrance motion feels intentional once/session.
3. Shop keeps search + filter sheet; cards denser than Home chapters.
4. Stores under Atelier looks editorial (not token-only Classic).
5. Orders + Account feel paper/colophon under Atelier.
6. Classic/Noir unchanged in behavior/layout.
7. SUPERADMIN theme switching still works; normals have no Appearance.
8. Guide/ceremony don’t crash; reduced motion respected.
9. `tsc --noEmit` clean; no npm start / no commit unless asked.

---

## 8. Out of scope

- Classic / Noir redesign
- Customer-facing theme picker
- 4th theme
- Full redesign of every profile sub-route (claims forms, etc.)
- Screenshot-dependent microcopy (Stanley may follow up with shots)
