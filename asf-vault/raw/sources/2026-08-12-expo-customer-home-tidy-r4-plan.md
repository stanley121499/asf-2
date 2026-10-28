# Expo Customer Home — Cover + Editorial Body Round 4 (Classic + Noir) — Plan (2026-08-12)

**Project**: ASF-2 — `asf-customer-app/` (Expo) only  
**Date**: August 12, 2026  
**Status**: Approved for implementation (awaiting agent passes)  
**Stakeholder**: Stanley (Simon: tidy + useful; Stanley: not empty, not short, restore hierarchy)  
**Companion prompts**: `2026-08-12-expo-customer-home-tidy-r4-agent-prompts.md`

**Supersedes (composition / density):**  
Round 3 `raw/sources/2026-08-12-expo-customer-home-tidy-r3-plan.md` — R3 shrunk Frame 1 to pack promo + products above the fold; that **killed the focal point** and still left a **short vertical scroll** (content stuck in horizontal snap pages).

**Keep from Round 2 tidy grammar:**
- No MODEL MATCH wordmark on Home (search + bag only)
- No half-card **horizontal peek**
- Fixed-height promo banners (not variable text cards)
- Push-down / calm Frame 1 (no stacked dark scrims)
- Categories as quiet equal chips
- Product + promo + posts must remain
- Home ≠ Shop (capped grid, not full catalog dump)
- `HomeSnapSection` may remain for rare paged use; **products/posts leave horizontal snap**

**Builds on:** `lib/homeLayout.ts`, promo banner primitives, theme packs, i18n.

**Out of scope:** Atelier Home; Shop/PDP; backend; restoring Home wordmark; peek carousels for products/posts.

---

## 1. What we are building

**Round 4 — separate cover from edit body:**

1. **Frame 1 = cover again** — strong focal point / visual hierarchy; roughly **one full first viewport** (in-flow chrome + featured product media + commerce). Complete onload; no cutoff; **do not squish** to fit promo/products on the same screen.
2. **Below the fold = long editorial body** — vertical scroll meat:
   - Stacked full-width promo banners (same height)
   - **2-column product grid** (several rows) — main scroll length
   - Journal: full-width lead post + 2-up grid (or 2-up grid only if lead is risky)
   - Quiet category chips
3. **Purpose per band** — cover = drop; offers = act; grid = shop the edit; journal = look/read — not three anonymous carousels.
4. **Kill product/post horizontal snap** as the primary pattern (scrolling the page is the affordance).

---

## 2. Why Round 3 failed (device feedback)

| Stanley said | Cause |
|--------------|--------|
| Scroll a little and that’s it | Caps lived in **horizontal** snap pages → vertical page still ~2 screens |
| Still pointless / both short + thin | Same three strips; no editorial body length |
| Squishing first image lost focal point / hierarchy | `getHomeAboveFoldBudget` forced Frame 1 ~42–52% so promo + 2 cards fit onload |

**Data is fine** (20 products, 6 posts, 4 active promos) — composition was wrong.

---

## 3. Locked decisions (Stanley 2026-08-12)

| # | Decision |
|---|----------|
| 1 | Problems are **both** short scroll **and** weak purpose |
| 2 | Restore **tall Frame 1 cover** ≈ full first viewport (hierarchy back) |
| 3 | **Do not** force promo + products onto first screen |
| 4 | Products = **vertical 2-column grid** (main scroll) |
| 5 | Promos = **stacked** fixed banners (vertical) |
| 6 | Stronger journal beat (lead + grid preferred) |
| 7 | Kill product/post horizontal snap as primary UX |
| 8 | Keep R2 tidy: no wordmark, no peek, no scrim stack, Home≠Shop |
| 9 | Tone: editorial storefront |
| 10 | Classic + Noir only |

**Cutoff nuance:** Full cover complete onload. In a vertical grid, the **next row** may sit below the fold (normal scroll). Do **not** bisect cards in a horizontal peek strip.

---

## 4. Target IA

### Frame 1 — Cover (onload only)
- In-flow top bar: search + bag (no wordmark)
- Featured newest product — media dominant
- Commerce: name, price, one CTA (push-down Classic; Noir may overlay plate **inside** the cover height)
- Optional thin promo cue **only if** it fits without shrinking the cover into a banner
- Height: target **~85–100% of usable** below the in-flow bar (full first screen composition). Revert R3 fraction-capping as the primary driver; `getHomeAboveFoldBudget` must **not** reserve promo + product row inside Frame 1 anymore for Home.

### Below fold — Editorial body (order)
1. **Offers** — if flag + active promos: stack `HomePromoBanner` (or vertical list), identical height, `HOME_SPACE.md` between; no horizontal promo pager required (pager OK only if single visible — prefer stack for length + purpose)
2. **The edit / New arrivals** — 2-col grid, equal `HOME_ASPECT.productCard`, gap `HOME_SPACE.sm`, horizontal page padding 16. Cap **10–14** (Home≠Shop). Section title + short editorial subline. `saveHeart` on first tile.
3. **Journal / Latest posts** — (a) one full-width lead post, fixed aspect, complete box; (b) remaining posts in 2-col grid same aspect as products. If &lt;2 posts, lead-only or grid-only. Cap ≥6 available.
4. **Categories** — quiet equal chips (wrap or single horizontal row without mid-chip peek; wrap preferred for vertical calm)

---

## 5. Shared layout changes

Update `lib/homeLayout.ts` (+ optional `HomeProductGrid` / `HomePostGrid` components):

| Piece | Intent |
|-------|--------|
| Cover height | `frame1CoverHeight(usableHeight, commerceChrome)` ≈ usable − small breathing **or** usable (full cover). Document: R4 cover ≠ R3 above-fold pack |
| Deprecate Home use of | Forcing promo+product into first viewport via `getHomeAboveFoldBudget` |
| Grid metrics | `getHomeGridMetrics({ windowWidth, padding, gap, columns: 2 })` → `cardWidth` |
| Keep | `HOME_SPACE`, `HOME_ASPECT`, promo banner height, usable height helpers |
| New UI | `HomeProductGrid` / post grid presentational helpers optional but preferred for Classic+Noir parity |

Remove or stop using `HomeSnapSection` for products/posts on Home (may keep file for other use).

---

## 6. Theme skins

### Classic
- Playfair editorial; tall push-down cover; warm grid body

### Noir
- Same IA; dark Inter/uppercase; tall cover with overlay plate OK; same grid body

---

## 7. i18n

Reuse `arrivalsSubline`, `postsSubline`, `offersSubline`, section titles. Add keys only if cover/journal labels change. Update en / zh-CN / ms together.

---

## 8. Success criteria

- [ ] First screen feels like a **cover** (clear focal point), not a squashed strip
- [ ] Vertical scroll has real length (multi-row product grid + stacked promos + journal)
- [ ] No horizontal product/post snap as primary
- [ ] No wordmark; no peek; no scrim stack
- [ ] Product + promo + posts when data exists
- [ ] Guide saveHeart works
- [ ] Classic + Noir; Atelier untouched

---

## 9. Agent pack

| Agent | Slice |
|-------|--------|
| 1 | Shared cover height + 2-col grid metrics/components; promo stack helper if needed |
| 2 | Classic Home Round 4 |
| 3 | Noir Home Round 4 |

---

## 10. Anti-patterns

- Do not re-apply R3 “pack everything above the fold”
- Do not bring back product/post peek snap to fake density
- Do not dump full Shop catalog
- Do not commit / push / expo start unless Stanley asks
