# Expo Customer Home — Editorial Density Round 3 (Classic + Noir) — Plan (2026-08-12)

**Project**: ASF-2 — `asf-customer-app/` (Expo) only  
**Date**: August 12, 2026  
**Status**: Approved for implementation (awaiting agent passes)  
**Stakeholder**: Stanley (Simon feedback continues: tidy + useful; now also **not empty**)  
**Companion prompts**: `2026-08-12-expo-customer-home-tidy-r3-agent-prompts.md`

**Supersedes (Home density / above-fold only):**  
Round 2 plan `raw/sources/2026-08-12-expo-customer-home-tidy-r2-plan.md`. **Keep** Round 2 tidy grammar (no peek, snap 2-up, no wordmark, fixed promo banners, push-down chrome). Round 3 fixes Round 2’s **content-less / thin scroll** feel.

**Builds on**:
- `lib/homeLayout.ts`, `HomeSnapSection`, `HomePromoBannerPager` (Round 1–2)
- Theme skins — Home ≠ Shop
- i18n `zh-CN` | `en` | `ms`

**Out of scope**:
- Atelier Home (except tiny shared imports)
- Shop / PDP / Highlights / backend / schema
- Bringing back half-card peek or MODEL MATCH Home wordmark
- Restoring stacked dark scrims

---

## 1. What we are building

**Round 3 — editorial storefront with density**, without undoing tidy:

1. **Shrink Frame 1** so the first viewport is a **composed edit**, not one lonely full-screen SKU
2. **Above the fold** (strict, no cutoff): in-flow chrome + shortened Frame 1 + promo band (if any) + **first product snap page (2 full cards)** visible onload
3. **Whole scroll denser** — tighter section rhythm, higher useful caps, editorial section voice (not empty mall whitespace)
4. **Tone = editorial storefront** — curated “today’s edit,” not busy catalog, not sparse museum

---

## 2. Why it feels empty (verified)

### Layout (primary cause)
Round 2 made Frame 1 ≈ **full usable height**. Onload = search/bag + one product. Below that, only **2 cards** per snap page with large section gaps → thin scroll even when data exists.

### Data (not the bottleneck)
Live DB check 2026-08-12:

| Entity | Count | Notes |
|--------|------:|-------|
| Products | 20 | All `Published`; media present |
| Posts | 6 | `post_medias` = 6 |
| Promotions | 4 | All `active`, through 2026-12-31 |
| Categories | 4 | |

So Home **has** content; Round 2 **hid** most of it behind a giant hero + sparse 2-up pages. (If promos still missing in UI, also check `promotions` feature flag — data itself is fine.)

---

## 3. Locked decisions (Stanley 2026-08-12)

| # | Question | Decision |
|---|----------|----------|
| 1 | Empty where? | **Whole scroll** feels thin (not only first screen) |
| 2 | Data? | Enough in DB — fix layout density |
| 3 | Shrink Frame 1? | **Yes** — so promo + 2 product cards can fit onload |
| 4 | Tone | **Editorial storefront** |
| 5 | Keep from R2 | No peek, snap 2 full cards/page + Swipe/dots, no Home wordmark, fixed promo banners, categories chip slider, product + promo + posts |

---

## 4. Target first viewport (strict)

Usable height = window − safe insets − tab bar − **in-flow** top bar (Classic + Noir).

**Must fit completely onload (no cutoff):**

| Band | Budget guide |
|------|----------------|
| Frame 1 (featured product) | **~42–52%** of usable height (not ~100%). Media + short editorial commerce (name, price, one CTA). Optional one-line promo cue only if it still fits. |
| Promo | Fixed banner height (existing `HOME_PROMO_BANNER_HEIGHT`) when active promos + flag — prefer **one** banner visible onload (pager still OK for rest) |
| New products | **First snap page** = 2 full equal cards + section header (title + swipe hint if multi-page) |

If math overflows on short phones: shrink Frame 1 further (floor ~38% usable) before dropping promo or product row. **Never** reintroduce peek or clip cards.

---

## 5. Target scroll (editorial density)

Order stays: Frame 1 → Promo → Products → Posts → Categories.

| Section | Round 3 change |
|---------|----------------|
| Frame 1 | Shorter; editorial caption optional (tagline / “New” / short line — i18n); no full-bleed empty void |
| Promo | Keep fixed banners; ensure visible when data+flag; don’t leave huge margin when absent |
| Products | Keep snap 2-up + affordance; **raise cap** (suggest **12–16**, still Home≠Shop — not full 20 dump unless needed). Tighter section top spacing (`HOME_SPACE.md` not airy double-lg stacks). Optional short editorial subline under title |
| Posts | Same tile geometry as products; **show all 6** (or cap ≥6). Optional **one** full-width editorial “lead” post **above** the snap row — must be complete box, fixed aspect, no cutoff — then snap for the rest. If lead adds complexity, skip lead and just densify equal snap (acceptable) |
| Categories | Keep quiet chip slider; tighten spacing so it doesn’t feel like an afterthought desert |

**Editorial voice (copy):** section titles that feel like an edit (“New arrivals” / “From the journal” / offers) — reuse keys where possible; add short sublines only if needed in all 3 locales.

---

## 6. Shared layout updates

Extend `lib/homeLayout.ts` (or sibling):

| Export | Intent |
|--------|--------|
| `HOME_FRAME1_USABLE_FRACTION` | e.g. `0.48` — max Frame 1 media+plate share of usable |
| `frame1HeroHeightFromFraction(usable, fraction, chromeBudget)` | Cap hero so above-fold composition fits |
| Optional `getHomeAboveFoldBudgets(...)` | Documents chrome + frame1 + promo + first product row heights for implementers |
| Slightly denser section defaults | Prefer `HOME_SPACE.md` between major sections; reserve `lg` for rare breaks |

Keep snap metrics / no-peek invariants from Round 2.

---

## 7. Theme skins

### Classic
- Keep Playfair editorial warmth
- Apply fraction-capped Frame 1 + above-fold product row
- Denser scroll; raise arrivals/posts caps

### Noir
- Same density map; dark editorial (uppercase section labels OK)
- Frame 1 may keep overlay plate but **height-capped** like Classic so products appear onload
- Same caps / snap grammar

---

## 8. Success criteria

- [ ] Onload (common phone heights): Frame 1 **not** alone — promo (if any) + 2 full product cards visible without cutoff
- [ ] Whole scroll feels like an edit with multiple beats, not sparse whitespace
- [ ] No half-card peek; Swipe/dots still when multi-page
- [ ] No MODEL MATCH wordmark on Home
- [ ] Product + promo + posts still present when data exists
- [ ] Caps use more of the 20/6/4 DB content without becoming Shop
- [ ] Classic + Noir both updated; Atelier untouched
- [ ] i18n en / zh-CN / ms if copy added

---

## 9. Agent pack

| Agent | Slice |
|-------|--------|
| 1 | Shared Frame 1 fraction helpers + above-fold budget docs/helpers; optional denser spacing notes |
| 2 | Classic Home Round 3 density + editorial |
| 3 | Noir Home Round 3 density + editorial |

---

## 10. Anti-patterns

- Do not return to full-usable-height Frame 1
- Do not use peek to “fill” emptiness
- Do not dump entire Shop catalog on Home
- Do not add busy widgets / stats / pill clusters for fake density
- Do not commit / push / `expo start` unless Stanley asks
