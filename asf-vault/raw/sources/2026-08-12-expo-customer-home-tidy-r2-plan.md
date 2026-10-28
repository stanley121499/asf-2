# Expo Customer Home — Tidy Revamp Round 2 (Classic + Noir) — Plan (2026-08-12)

**Project**: ASF-2 — `asf-customer-app/` (Expo) only  
**Date**: August 12, 2026  
**Status**: Approved for implementation (awaiting agent passes)  
**Stakeholder**: Stanley (feedback source: Simon)  
**Companion prompts**: `2026-08-12-expo-customer-home-tidy-r2-agent-prompts.md`

**Supersedes (for Home tidy grammar only):**  
`raw/sources/2026-08-12-expo-customer-home-tidy-revamp-plan.md` (Round 1). Round 1 landed product Frame 1 + `HOME_SPACE` / `HOME_ASPECT` helpers, but **failed Simon’s tidy bar** on device. Keep Round 1 files for history; **implement against this Round 2 plan**.

**Builds on / must respect**:
- Round 1 helpers already in tree: `asf-customer-app/lib/homeLayout.ts`
- Theme packs — `wiki/concepts/expo-customer-theme-skins-asf-2.md` (**Home ≠ Shop**)
- Ceremony — `wiki/concepts/expo-customer-ceremony-motion-asf-2.md`
- Customer i18n — `zh-CN` | `en` | `ms`

**Out of scope**:
- Atelier Home (except tiny shared-import fixes)
- Shop / PDP / Highlights / Profile (except Home top-bar pattern)
- Changing `tenantBrand.displayName` globally (splash / onboarding / other screens may keep MODEL MATCH)
- Backend / schema / new feature flags

---

## 1. What we are building

**Round 2** fixes Round 1’s miss: tidy is a **visual grammar**, not just margin tokens.

1. **No cutoff** — nothing important bisected at the screen edge (onload **or** while scrolling / sliding)
2. **Equal objects** — products and posts share one tile geometry; promos are one fixed banner size; no free-height text cards
3. **Discoverable snap sliders** — horizontal rows page in **full cards only** (option B), with a clear “this slides” affordance (no half-card peek as the cue)
4. **Remove MODEL MATCH wordmark** from Classic + Noir **Home** top-left only; keep search + bag
5. **Classic Frame 1** — fix bottom cutoff; **prefer push-down** top bar (in-flow); **kill stacked dark scrims** (overlays not required)
6. **Useful content retained** — product + promo + posts (Simon explicit); categories kept as a quiet equal chip slider

---

## 2. Why Round 1 was not enough (device audit)

| Issue | What shipped | Why Simon still says “not tidy” |
|-------|--------------|----------------------------------|
| Mixed shapes | Frame1 height-driven + text plate + variable-height offer cards + 3:4 products + 4:5 posts + chips | Margins equal; **objects** unequal |
| Offers | `HomeOffersStrip` width 200, height from 1–2 lines of copy | Loudest unequal module |
| Classic Frame 1 cutoff | `heroHeight` + separate commerce plate; guessed chrome reserves (`132` / `36`) | Media/CTA can sit under tab bar / clip |
| Dark scrims | Multiple stacked overlays so wordmark readable on photo | Looks muddy; wordmark is being removed anyway |
| Horizontal peek | Card width ~0.44 / ~0.40 | Half card = **cutoff** (Stanley confirmed) |
| Wordmark | `HomeBrandBeat` / `tenantBrand.displayName` top-left | Simon wants MODEL MATCH gone on Home |

**Core outcome:** After Round 2, Classic and Noir Home share one tidy grammar: in-flow chrome without wordmark, complete Frame 1, full-width fixed promo banners, snap pages of identical product/post tiles with visible slide affordance, quiet category chip slider — no half-cut media.

---

## 3. Locked decisions (Stanley 2026-08-12, Round 2)

| # | Question | Decision |
|---|----------|----------|
| 1 | Top-left MODEL MATCH | **Remove wordmark on Home only**; keep search + bag |
| 2 | Classic Frame 1 / scrims | Fix bottom cutoff; **prefer push-down** (in-flow bar); do **not** rely on stacked dark overlays |
| 3 | Horizontal peek | **Forbidden** — half card counts as cutoff |
| 4 | Products / posts interaction | **B — snap slider**, full cards only per page |
| 5 | Slider discoverability | Must be obvious it slides (header hint and/or page dots — **not** half-card peek) |
| 6 | Offers | **Full-width fixed-height banners** (identical size). Multiple → stack or **paged snap** (one full banner per page, no peek) |
| 7 | Categories | **Keep**; equal chip slider under same no-cutoff + affordance rules; quiet / end of page |
| 8 | Classic Frame 1 composition | Push-down preferred for tidy; overlay-on-image only if still fully on-screen with ≤1 light gradient |
| 9 | Must keep content | **Product + promo + posts** |
| 10 | Reference app | None — define our own system |
| 11 | Themes | Classic + Noir only |
| 12 | Coding standards | Double quotes; strict TS; no `any`; no `!`; no `as unknown as T`; JSDoc on new modules |

**Recommended slider page size:** **2 full product/post cards per snap page** (feels shoppable; still tidy). Promo banners: **1 full banner per page** if paged.

**Recommended affordance:** section header trailing muted “Swipe” (i18n) **and/or** page dots under the row — same pattern on every horizontal section.

---

## 4. Current state (post Round 1)

### Shared
- `lib/homeLayout.ts` — `getHomeUsableHeight`, `frame1HeroHeight`, `HOME_SPACE`, `HOME_ASPECT`, chrome constants
- `components/home/HomeOffersStrip.tsx` — unequal text cards (replace / stop using for Home tidy)
- `components/home/HomeArrivalCeremony.tsx` — `HomeBrandBeat` renders `tenantBrand.displayName`

### Classic (`themes/classic/screens/Home.tsx`)
- Overlay nav + `HomeBrandBeat` + search + bag
- Frame 1: product media + **in-flow commerce plate** + stacked top scrims
- Offers → arrivals (peek) → posts (peek, different aspect) → demoted categories

### Noir (`themes/noir/screens/Home.tsx`)
- In-flow bar with `tenantBrand.displayName`
- Drop often `frame1HeroHeight(usable, 0)` with overlays on image
- Chips offers → tall stream → short posts strip

---

## 5. Target information architecture (both themes)

Same **jobs** + same **grammar**; different skin.

### Top chrome
- In-flow row: **search + bag only** (no MODEL MATCH / no `HomeBrandBeat` wordmark on Home)
- Safe area respected; bar height feeds usable-height math

### Frame 1 (onload — strict)
Must fit entirely above tab bar:
1. Top chrome (in-flow)
2. Newest **product** media (full width, complete)
3. Name / price / one primary CTA
4. Optional thin promo cue only if active promo — still inside Frame 1

**Classic default:** media then commerce **below** (push-down) — no stacked dark scrims.  
**Noir:** may keep dark commerce plate aesthetic, but same no-cutoff + no wordmark rules; prefer not needing heavy top scrims.

Measure real layout (onLayout / consistent token heights) — **do not guess** plate reserves that drift from UI.

### Scroll sections (order)
1. **Promo banners** — only if flag + active promos; fixed height; full width; no variable text-card strip
2. **New products** — snap pages of **2 full equal cards** (`HOME_ASPECT.productCard`); affordance required
3. **Latest posts** — **same card width + same aspect as products**; snap + affordance
4. **Categories** — equal chips; snap/page so chips aren’t cut; quiet affordance; end of Home

Home ≠ Shop: keep SKU caps (Classic arrivals / Noir stream totals in the same ballpark as Round 1).

---

## 6. Shared tidy grammar (implement once)

Extend or add beside `lib/homeLayout.ts`:

| Piece | Intent |
|-------|--------|
| Snap page geometry | Given screen width, gutter, gap, cardsPerPage → `cardWidth`, `pageWidth` / `snapToInterval` |
| No-peek invariant | Visible page shows only whole cards; no fractional card at trailing edge |
| `HomeSnapSection` (or similar) | Reusable: header + optional Swipe label + horizontal paging ScrollView + dots |
| Promo banner size | Fixed height constant (both themes can skin color/type) |
| Home top bar without wordmark | Shared pattern or pack-local but identical job |

**Hard rules:**
- Within a section, all primary media share one aspect + one width recipe
- Gaps only from `HOME_SPACE` (may extend scale if needed — document)
- `contentFit="cover"` only inside complete boxes — never clip the box at the viewport edge
- Half-card peek is **never** the “swipe” teaching moment

---

## 7. Theme skins

### Classic
- Playfair / light boutique kept where it doesn’t fight tidy
- In-flow top bar (push-down); remove `HomeBrandBeat` from Home
- Frame 1 push-down commerce; remove stacked scrims
- Replace `HomeOffersStrip` usage on Home with banner module (strip may remain for other callers or be retired if Home-only)

### Noir
- Dark tokens / uppercase / Inter
- Remove displayName wordmark from Home top bar
- Same section map + snap grammar; curated SKU cap
- Posts use **same tile geometry as products** (not a different mini size)

---

## 8. i18n

Add keys for slider affordance, e.g.:
- `home.swipeHint` — “Swipe” / zh / ms
- Optional `home.pageIndicator` if needed for a11y

Reuse existing `home.latestPosts`, offers, arrivals, categories keys where possible. Update **en + zh-CN + ms** together.

---

## 9. Guide / ceremony

- Preserve `ANCHORS.home.saveHeart` on first product tile heart (Classic + Noir if present)
- Arrival ceremony may stay; **do not** show MODEL MATCH wordmark as Home header chrome
- If `HomeBrandBeat` is unused on Home after this, leave component in ceremony file for other use or no-op — do not break Atelier unless required

---

## 10. Anti-patterns

- Do not use half-visible cards to signal scroll
- Do not stack multiple dark overlays “for nav readability” after wordmark removal
- Do not keep Classic overlay-nav-on-hero if it causes cutoff or forces scrims
- Do not leave variable-height offer text cards on Home
- Do not turn Home into Shop
- Do not change global `tenantBrand` string for splash unless Stanley asks
- Do not commit / push / merge / run `expo start` unless Stanley asks

---

## 11. Success criteria

- [ ] No MODEL MATCH wordmark on Classic or Noir Home top bar
- [ ] Classic Frame 1: no bottom cutoff; no stacked dark scrims; fully above tab bar onload
- [ ] No half-cut product/post/promo/category items at screen edges
- [ ] Products and posts share identical tile geometry
- [ ] Snap sliders page full cards; Swipe hint and/or dots present when more than one page
- [ ] Promo = full-width fixed banners only when promos exist
- [ ] Categories kept, tidy chip slider at end
- [ ] Product + promo + posts all present when data exists
- [ ] Guide save-heart still works
- [ ] i18n en / zh-CN / ms updated
- [ ] Atelier Home unchanged (aside from unavoidable shared helper imports)

---

## 12. Agent pack overview

Three sequential agents (~200k-friendly):

| Agent | Slice |
|-------|--------|
| 1 | Shared snap geometry + `HomeSnapSection` (header hint + dots) + promo banner primitive + homeLayout updates |
| 2 | Classic Home Round 2 (wordmark off, push-down Frame 1, wire shared modules) |
| 3 | Noir Home Round 2 (same grammar, dark skin) |

See companion prompts.

---

## 13. Open implementer notes

- Prefer `onLayout` for Frame 1 chrome if token reserves drift
- Tab bar: keep using `HOME_TAB_BAR_ROW_HEIGHT` from Round 1 (verify still matches `_layout`)
- Dots: hide when only one page (no fake affordance)
- Swipe hint: show when `pageCount > 1`
- Categories chips: compute page width from whole chips + gaps; never clip a chip mid-glyph
