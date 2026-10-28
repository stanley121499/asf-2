# Expo Customer Home — Noir Differentiation Round 5 — Plan (2026-08-12)

**Project**: ASF-2 — `asf-customer-app/` (Expo) **Noir Home only**  
**Date**: August 12, 2026  
**Status**: Approved for implementation (awaiting agent pass)  
**Stakeholder**: Stanley  
**Companion prompts**: `2026-08-12-expo-customer-home-noir-diff-r5-agent-prompts.md`

**Context:** Round 4 made Classic + Noir share the same IA (cover → stacked banners → 2-col grid → journal lead+grid → chips). Classic is **good enough — do not change**. Noir feels like a recolor; restore **curate** silhouette (SSENSE / SNKRS-GOAT Home ≠ Shop).

**Keep from R2/R4 on Noir:**
- No MODEL MATCH wordmark (search + bag)
- Tall cover focal point (`frame1CoverMediaHeight`)
- Overlay commerce plate inside cover OK
- No horizontal peek snap for products
- Home ≠ Shop (few large moments, not catalog)
- `saveHeart` + ceremony

**Out of scope:** Classic Home, Atelier, Shop/PDP, backend, global tenantBrand.

---

## 1. Locked decisions (Stanley 2026-08-12)

| # | Decision |
|---|----------|
| 1 | Classic Home **unchanged** |
| 2 | Rest of Noir variation — **agent/plan owner decides** |

### Decisions taken (this plan)

| Band | Noir Round 5 |
|------|----------------|
| Cover | Keep tall drop + overlay plate (already distinct) |
| Offers | **Compact chip rail** (bring back Noir chips pattern) — not `HomePromoBannerStack` |
| Products | **Single-column** large equal 3:4 cards stacked (~**6–7** after cover; cover SKU excluded from stream). Optional ordinals `01`… |
| Journal | **Minimal:** 1–2 full-bleed posts only — **no** 2-col post grid mirroring Classic |
| Categories | **Omit** on Noir Home (curate, not browse aids) |

---

## 2. Why

Classic = boutique **edit grid**. Noir should = night **drop stream**. Same content jobs (product / promo / posts), different silhouette and density. Vertical length on Noir comes from **tall stacked cards**, not many small grid rows.

Theme concept reminder: Noir Home = curate (≤8 large moments); Shop = find.

---

## 3. Target Noir IA

1. In-flow top bar — search + bag only  
2. **Cover** — newest product, full usable cover height, overlay plate + CTA (+ optional thin promo cue if fits)  
3. **Offers** — chip rail if flag + active promos; equal chip height; horizontal scroll **without cutting chips mid-glyph** (pad/snap whole chips or wrap — prefer horizontal with full chips visible + no half-chip peek; if conflict, single-row scroll with padding so first chips complete)  
4. **Tonight / New stream** — 1-col stack, `HOME_ASPECT.productCard` (3:4), full width minus page padding (16), gap `HOME_SPACE.md`, cap 7 excluding cover product; `saveHeart` on first stream card; ordinals optional  
5. **Journal** — section title + up to **2** full-width posts (same aspect or slightly taller editorial 4:5 if still tidy — prefer **same 3:4** for tidy); skip if no posts  
6. Optional calm “Shop all” text link at end  
7. **No** category chips, **no** `HomeProductGrid` 2-col, **no** `HomePromoBannerStack`, **no** `HomeSnapSection` for products

---

## 4. Implementation notes

- Prefer pack-local Noir components (`NoirFeaturedCard` may be revived/adapted for 1-col width via props, or inline in Home)  
- Reuse `filterActivePromotions` / chip UI from earlier Noir `NoirOffersChips` if still in file history — recreate cleanly if removed  
- Do not import Classic Playfair  
- i18n: reuse `home.noir*` / `arrivalsSubline` sparingly; “Tonight” already exists if keyed — check locales before adding  
- Coding standards: double quotes; no `any` / `!` / `as unknown as T`; JSDoc on new helpers

---

## 5. Success criteria

- [ ] Classic Home file(s) **untouched**
- [ ] Noir clearly different silhouette: 1-col large stream vs Classic 2-col grid
- [ ] Promos = chips, not stacked Classic-style banners
- [ ] Journal = ≤2 full-bleed, no product-like 2-col post grid
- [ ] No categories on Noir Home
- [ ] Cover still strong focal point; no wordmark; saveHeart works
- [ ] Home≠Shop: stream capped (~6–7 + cover)

---

## 6. Agent pack

**One** agent (Noir Home only) — sized for ~200k; Classic frozen.

See companion prompts.
