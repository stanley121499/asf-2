# Expo Customer Home — Tidy + Useful Revamp (Classic + Noir) — Plan (2026-08-12)

**Project**: ASF-2 — `asf-customer-app/` (Expo) only  
**Date**: August 12, 2026  
**Status**: Approved for implementation (awaiting agent passes)  
**Stakeholder**: Stanley (feedback source: Simon)  
**Companion prompts**: `2026-08-12-expo-customer-home-tidy-revamp-agent-prompts.md`

**Builds on / must respect**:
- Theme packs — wiki `wiki/concepts/expo-customer-theme-skins-asf-2.md`
- Ceremony / motion — wiki `wiki/concepts/expo-customer-ceremony-motion-asf-2.md`
- Prior Home work — `wiki/syntheses/2026-07-17-expo-customer-home-catalog-revamp-session-accomplishment.md`
- Noir curate-vs-find — `raw/sources/2026-07-28-expo-customer-noir-intentional-plan.md` (**Home ≠ Shop** still holds)
- Customer i18n — locales `zh-CN` | `en` | `ms`

**Out of scope**:
- Atelier Home (do not change unless a shared helper forces a tiny import fix)
- Shop / PDP / Highlights / Profile screens
- Theme registry / Appearance admin
- Backend / Supabase schema
- New feature flags (reuse existing `promotions` flag)

---

## 1. What we are building

A **second-pass Home revamp for Classic and Noir** that fixes Simon’s feedback:

1. **Tidy visual rhythm** — equal image sizes within a section; one spacing scale (no mixed 28/32/40 “random” gaps)
2. **Strict viewport discipline** — on load, Frame 1 fits fully inside the usable screen (no half-cut hero/image). When scrolling, each major block is sized so its primary media + title + CTA land as a complete unit (no accidental mid-crop of the important content)
3. **Useful content** — amplify newest products, promotions, and newest posts; demote categories; cut “filler” feel

**Surfaces**:
- `asf-customer-app/themes/classic/screens/Home.tsx`
- `asf-customer-app/themes/noir/screens/Home.tsx`
- Shared helpers / offer strip / tokens as needed under `components/home/` and/or `lib/`

**Product rule preserved**: Home ≠ Shop for Noir (and Classic remains boutique landing, not full catalog).

---

## 2. Why (Simon feedback → product interpretation)

| Simon said (approx.) | Interpretation |
|----------------------|----------------|
| Classic still liked more | Keep Classic’s boutique warmth as a first-class choice; do not force Noir-only |
| “Not tidy” — some images small, some big; “no equal spacing” | Uneven card heights + uneven section margins; no shared aspect/gap system |
| Pet peeve: things should load fully within the screen; no image cut halfway (even though user can scroll); scroll should also fit content nicely | **Strict frame model**: Frame 1 complete on first paint; later frames also sized to usable height |
| Home content feels useless | Hero/mood without clear “what’s new / what’s on offer”; too much weak chrome (e.g. categories) |

**Core outcome:** After this pass, opening Home on Classic or Noir shows one complete, useful first screen (product-forward, promo-aware), then tidy equal-sized blocks for offers → new products → latest posts, with categories demoted. Simon can still choose Classic vs Noir by taste; both share the same useful map.

---

## 3. Locked decisions (Stanley 2026-08-12)

| # | Question | Decision |
|---|----------|----------|
| 1 | Frame 1 primary content | **Newest product** as main media (not newest post). Optional thin promo cue **inside Frame 1 only if** an active promo exists |
| 2 | Viewport standard | **Strict** — nothing important cropped on first paint; major scroll blocks sized to usable screen |
| 3 | Categories (Classic) | **Demote** — compact / end of scroll / low visual weight; not a primary band |
| 4 | Sacred CTAs | **None** — Shop / Highlights labels may be simplified or retitled for clarity |
| 5 | Themes in scope | **Classic + Noir only** (Atelier untouched) |
| 6 | Content order after Frame 1 | Offers (if any) → New products → Latest posts → Demoted categories (Classic; optional omit on Noir if too crowded — prefer include a short posts beat on Noir so it is not catalog-only) |
| 7 | Empty offers | **Do not reserve empty space** — mount offers UI only when flag on **and** active promos exist (Noir already does this; Classic must match) |
| 8 | Coding standards | Double quotes; strict TS; no `any`; no `!`; no `as unknown as T`; JSDoc on new modules/functions |

---

## 4. Current state (verified in repo ~2026-08-12)

### Classic (`themes/classic/screens/Home.tsx`)
- Overlay navbar + ceremony
- Hero ≈ `window.height * 0.42` from **newest post**
- Offers via `HomeOffersStrip` (flag-gated; strip returns null if empty, but section may still mount)
- New arrivals horizontal row (~`width * 0.44` cards)
- Categories pills
- Featured posts strip
- Section margins uneven: offers ~28, arrivals ~32, categories/posts ~40

### Noir (`themes/noir/screens/Home.tsx`)
- Solid in-flow top bar (~48px) + ceremony
- Drop hero ≈ `window.height * 0.55` from **newest product** — with bar + safe area, **drop bottom often cuts on first paint** (direct conflict with Simon’s pet peeve)
- Optional `NoirOffersChips` only when promos exist
- Curated stream ≤7 more products (`HOME_STREAM_CAP = 7`)
- **No posts** on Home today

### Shared
- `components/home/HomeArrivalCeremony.tsx`
- `components/home/HomeOffersStrip.tsx`
- Route: `app/(tabs)/index.tsx` → `pack.screens.Home`
- Guide anchors: `ANCHORS.home.saveHeart` on first Classic arrivals heart — preserve or re-home carefully

---

## 5. Target information architecture (both themes)

Same **jobs**, different **skin**.

### Frame 1 — onload (must fit usable height)
Usable height = window height − top safe area − bottom safe area − tab bar (and for Noir, the **in-flow** top bar is part of Frame 1 budget).

Contents:
1. Top chrome (Classic overlay counts against hero budget; Noir solid bar is in-flow)
2. **Main media: newest product** (cover, single aspect, full uncut)
3. Minimal commerce copy (name / price as theme allows)
4. One primary CTA (open that product or Shop new)
5. Optional **thin** promo cue (one chip / one line) — only if active promo exists; must still fit inside Frame 1

**Not in Frame 1:** full offers gallery, category pills, long post feed, multi-product carousels.

### Frame 2+ — scroll (each major block complete)
1. **Offers** — equal cards/chips, shared gap; skip entirely if none
2. **New products** — equal aspect ratio + equal gap within the section; capped (not Shop dump). Classic: horizontal tidy row OK. Noir: keep curated feel (few large equal cards), still Home≠Shop
3. **Latest posts** — equal cards; Classic keeps editorial warmth; Noir gets a short posts beat
4. **Categories (demoted)** — Classic: compact end section. Noir: omit unless it fits without clutter

---

## 6. Layout system (the “tidy” fix)

Introduce a small shared module (name up to implementer, e.g. `lib/homeLayout.ts` or `components/home/homeLayout.ts`) used by Classic + Noir:

| Token | Intent |
|-------|--------|
| `getHomeUsableHeight(...)` | Window − safe insets − tab bar (− in-flow header if any) |
| `HOME_SPACE` | Single vertical scale, e.g. `xs/sm/md/lg` only — **no ad-hoc 28/32/40 mix** |
| `HOME_ASPECT` | Per-slot aspects: Frame1 hero, product card, post card, offer card — **constant within a section** |
| Frame1 height | Derived from usable height so Frame1 media + chrome + CTA fit **strictly** |

**Rules**:
- Within one section, all primary images share the same width recipe and aspect ratio
- Section top padding/margin comes only from `HOME_SPACE`
- Prefer `contentFit="cover"` only inside fixed aspect boxes (cropping inside the box is OK; **cutting the box at the screen edge is not**)

---

## 7. Theme skins (choices for Simon)

### Classic
- Keep: Playfair + light boutique, overlay nav, arrival ceremony, warmth
- Change: Frame1 = product (not post); equal rhythm; demote categories; offers only when real; posts as a clear “Latest” band after products

### Noir
- Keep: dark tokens, uppercase tracking, product-drop energy, header bag, Home≠Shop cap on SKUs
- Change: Frame1 height from **usable** height (fix cut-off); same content map; add short latest-posts beat; offers remain chips or equal dark cards; stream cards one aspect + one gap

---

## 8. i18n

- Reuse existing `home.*` keys where possible (`newArrivals`, `offers`, `featured`, etc.)
- Add keys only when copy truly changes; update **en + zh-CN + ms** together
- No hardcoded user-facing English in JSX

---

## 9. Guide / ceremony constraints

- Keep `HomeArrivalCeremony` / `CeremonySection` patterns unless a section is removed
- Preserve `TourAnchor` for `ANCHORS.home.saveHeart` on a stable first product-card heart (Classic). If arrivals UI moves, re-attach to the new first product card
- First-launch guide trigger logic on Home must keep working

---

## 10. Explicit non-goals / anti-patterns

- Do **not** turn Home into Shop (filters, full catalog, infinite grid)
- Do **not** use raw `Dimensions.get("window").height * 0.55` without subtracting chrome
- Do **not** leave empty offers ceremony slots
- Do **not** mix card heights in the same row/column “for interest”
- Do **not** put detached promo stickers / floating badges on the hero (keep Frame1 calm)
- Do **not** commit, push, or merge unless Stanley asks
- Do **not** run `npm start` / `expo start` / production builds (dev may already be running)

---

## 11. Success criteria

- [ ] Classic Frame1: newest product + chrome fully visible on common phone heights (no half-cut)
- [ ] Noir Frame1: same, with in-flow top bar included in budget
- [ ] Offers / products / posts sections use equal media sizes + shared spacing tokens
- [ ] Categories demoted on Classic; not competing with promo/product/post
- [ ] Noir includes a short latest-posts moment
- [ ] Empty promos → no empty gap
- [ ] Home≠Shop preserved on Noir (SKU cap / curated)
- [ ] Guide save-heart anchor still works on Classic
- [ ] i18n: en / zh-CN / ms updated if copy changed
- [ ] Atelier Home unchanged

---

## 12. Agent pack overview

Three sequential agents (sized for ~200k context — shared foundation first, then one theme per pass):

| Agent | Slice |
|-------|--------|
| 1 | Shared home layout helpers + offer-strip empty-space fix + spacing/aspect tokens |
| 2 | Classic Home full IA + tidy Frame model |
| 3 | Noir Home full IA + tidy Frame model + posts beat |

See companion prompts file for copy-paste briefs.

---

## 13. Open notes for implementers

- Tab bar height: use the app’s existing pattern (safe area + known tab bar constant if one exists; do not guess wildly — search `tabBar` / `BottomTab` styles)
- If newest product has no media, fall back gracefully (placeholder or next product with media) — never a half-empty broken Frame1
- Promo cue in Frame1 is **thin**; full offers band remains Frame 2+
- Prefer editing pack-local Home screens; share only true layout primitives
