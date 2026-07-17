# Expo Customer App — Home Screen Revamp Plan (2026)

**Project**: ASF-2 Expo customer app (`asf-customer-app/`)  
**Date**: July 16, 2026  
**Status**: Approved for implementation  
**Stakeholder feedback**: Simon (+ informal friend feedback)  
**Companion prompts**: `2026-07-16-expo-customer-home-revamp-agent-prompts.md`  
**Builds on**: Customer redesign tokens (`CUSTOMER_REDESIGN_PLAN_2026.md`), Pixel2Motion splash (`pixel2motion-splash-asf-2`), promotions module, existing home port of web `HomePageClient`

---

## 1. What we are doing

Revamp the **Expo customer app home tab** (`app/(tabs)/index.tsx`) so it:

1. Feels **brand-specific** (not a generic ecommerce template)
2. Surfaces **active promotions** early (commercial pull)
3. Shrinks the **new arrivals** block into a **single horizontal scroll row**
4. Adds **仪式感** (ceremony) on first home land of each **session** — short motion + haptic

**Target app only**: `asf-customer-app/`  
**Out of scope for this program**:
- `asf-2-next` web home parity (can follow later)
- `asf-staff-app`
- Re-authoring Pixel2Motion splash assets per tenant
- New DB tables / migrations (reuse `promotions`)
- Fake / hardcoded promo data when none exist

---

## 2. Problem (current home)

Verified layout in `asf-customer-app/app/(tabs)/index.tsx` (mirrors web):

| Section | Behavior today | Issue |
|---------|----------------|-------|
| Navbar brand | Hardcoded `"SYSTEM APP FORMULA"` | Conflicts with MODEL MATCH splash; not tenant-configurable |
| Hero | ~55% screen height, first post image, two equal CTAs | Generic; eats fold; weak shop bias |
| New arrivals | 2-col grid × 6 products (3:4) | Too tall; Simon: make one scrollable row |
| Offers | None | Promotions exist in DB + `PromotionContext` but never shown on home |
| Ceremony | None on home | Cold-start splash exists; home arrival is flat. `OnboardingOverlay` exists but is **not mounted** on Expo home |
| Haptics | Used on Stores; not on home | Missed 仪式感 opportunity |

Simon’s feedback (paraphrased):

- Looks like any other app — nothing special
- New product section takes too much space → one horizontal row
- Want coupon / offer up front
- Friend had no urge to buy (ambiguous: app vs products) → **assume worst case: both**
- Want 仪式感 on first land (animation / haptic / visual feedback)

---

## 3. Decisions (locked)

| # | Question | Decision |
|---|----------|----------|
| 1 | Brand name on home | **MODEL MATCH** for this pilot; must be **tenant-configurable** (no hardcoded string in the screen) |
| 2 | Which promos to show | **All active** promotions (see filter rules below) |
| 3 | Ceremony frequency | **Once per session** (JS process lifetime); revisit later if too frequent/rare |
| 4 | Friend feedback | Assume worst case: fix **brand/app desire** *and* **product purchase urge** |

### Active promotion filter (client)

A promo is **active for home** when all of:

- `deleted_at` is null (API list already tends to exclude deleted)
- `active === true`
- `start_date` is null **or** `start_date <= now`
- `end_date` is null **or** `end_date >= now`
- Respect feature flag: only render strip if `isEnabled("promotions")`
- If filtered list is empty → **omit the entire section** (no placeholder cards)

Show **all** matching promos in a horizontal strip (not just one).

### Tenant brand config (v1)

No remote tenant table yet. v1 approach:

- Create `asf-customer-app/lib/tenantBrand.ts` (or `constants/tenantBrand.ts`) exporting:
  - `displayName: string` — default `"MODEL MATCH"`
  - optional `tagline: string | null`
- Home navbar, ceremony moment, and any brand wordmark reads from this module
- Later: swap implementation to fetch remote config without changing call sites

**Do not** hardcode brand strings inside `index.tsx`.

### Session ceremony

- Play once after home first becomes visible in a session
- Gate with an in-memory module flag (e.g. `lib/homeSessionCeremony.ts`) — resets on cold start when JS reloads
- Prefer **not** stacking ceremony immediately on top of Pixel2Motion splash: if splash completed in the same launch within a short window, either delay slightly or skip visual double-hit — implementer may choose **delay ~300ms after mount** as the simple approach
- Duration target: **~400–700ms** total
- End with **one** `hapticLight()` or `hapticSelection()` from `lib/haptics.ts`
- Returning from Browse / Cart / other tabs in the same session: **no replay**

### Worst-case “no urge” — two layers

| Layer | Goal | Mechanism |
|-------|------|-----------|
| App desire | Feel special to open / stay | Session ceremony + MODEL MATCH brand continuity from splash → home |
| Product desire | Feel like buying something | Active promo strip under hero + shop-biased hero CTA + lighter product discovery row |

---

## 4. Target home structure (top → bottom)

```
┌──────────────────────────────────────┐
│ Fixed navbar — tenant displayName    │
│ + search + cart icons                │
├──────────────────────────────────────┤
│ A. Session arrival (once / session)  │  motion + haptic overlay on content
│ B. Hero (~40–45% viewport)           │  brand-aware; primary Shop CTA
│ C. Offers strip (all active promos)  │  horizontal; hide if none / flag off
│ D. New arrivals — 1 horizontal row   │  ~2.2 cards peek; “See all →”
│ E. Categories (keep)                 │  horizontal pills
│ F. Featured posts strip (keep)       │  horizontal
└──────────────────────────────────────┘
```

### B. Hero

- Height: `Dimensions.get("window").height * 0.42` (acceptable range 0.40–0.45)
- Keep full-bleed post image when available
- Primary CTA → Browse (`/(tabs)/browse`) — shop-biased label via i18n
- Secondary CTA → Highlights (outline style) — keep but visually secondary
- Optional short brand/tagline line above caption if `tenantBrand.tagline` set; otherwise keep post caption as today

### C. Offers strip

- Section title via i18n (e.g. `home.offers`)
- Horizontal cards: promo `name`, human-readable discount (`percentage` → “X% off”, `fixed` → “RM X off”), show `code` if present
- Tap:
  - If `code` present → navigate to `/cart` with `promoCode` param; cart should prefill (and auto-attempt validate if cart has lines — see prompts)
  - If no code → navigate to Browse
- Gate on `promotions` feature flag + non-empty filtered list

### D. New arrivals

- Replace wrap grid with horizontal `ScrollView`
- Card width ~42–46% of screen so ~2.2 cards peek
- Keep 3:4 image, name, price, wishlist heart
- Cap at 8–10 items in the row (or all sorted newest — prefer slice 0..10)
- “See all →” → Browse

### Design system (do not invent a new look)

From `constants/theme.ts` / redesign plan:

- Accent `#C9A96E`, bg white, panel `#F5F5F3`, text `#0A0A0A`
- Display: Playfair; body: Inter
- Product images 3:4
- Avoid Temu-style countdown spam, purple gradients, floating badge clutter
- No Buy Now — cart / browse only

---

## 5. Existing assets to reuse

| Asset | Path | Use |
|-------|------|-----|
| Home screen | `app/(tabs)/index.tsx` | Primary edit surface |
| Theme | `constants/theme.ts` | Colors / fonts |
| Haptics | `lib/haptics.ts` | Ceremony end pulse |
| Reanimated | `react-native-reanimated` (~4.1) | Entrance animation |
| Promotions | `context/PromotionContext.tsx` | `promotions` list (already under feature gate in `RouteContextBundle`) |
| Feature flags | `context/FeatureFlagsContext.tsx` | `isEnabled("promotions")` |
| Cart promo | `app/cart.tsx` | Prefill / validate by code |
| Splash ceremony | `components/SplashIntro.tsx` | Cold start only — do not duplicate full splash on home |
| Onboarding | `components/OnboardingOverlay.tsx` | Exists; **optional** mount — not required for v1 if ceremony covers 仪式感 |
| i18n | `i18n/locales/{zh-CN,en,ms}.json` | All new strings in **all three** locales |
| Currency | `lib/formatCurrency.ts` (`formatRm`) | Fixed discount display |

---

## 6. Implementation phases (map to agents)

| Phase | Agent | Deliverable |
|-------|-------|-------------|
| 1 | Agent 1 | Tenant brand module + home navbar uses it (MODEL MATCH default) |
| 2 | Agent 2 | Shorter hero + CTA hierarchy + horizontal new arrivals |
| 3 | Agent 3 | Active promo strip + cart prefill wiring |
| 4 | Agent 4 | Once-per-session home arrival (Reanimated + haptic) + final i18n polish / verify |

Agents run **sequentially**. Each ends with `cd asf-customer-app && npx tsc --noEmit`.

---

## 7. i18n keys (expected additions)

Add under `home` namespace in **zh-CN**, **en**, and **ms** (exact keys may be adjusted by implementers but must stay parallel across locales):

| Key | Purpose (EN meaning) |
|-----|----------------------|
| `home.heroCtaShop` | Primary shop CTA (may replace or sit beside `heroCtaExplore`) |
| `home.offers` | Offers section title |
| `home.offerPercentOff` | e.g. `{value}% off` |
| `home.offerFixedOff` | e.g. `RM {value} off` |
| `home.offerCode` | e.g. `Code: {code}` |
| `home.offerTapAria` | Accessibility label for offer card |
| `home.seeAllArrivals` | See all new arrivals (or reuse `home.viewAll`) |

Do **not** leave new user-visible English hardcoded in TSX.

---

## 8. Success criteria

- [ ] Navbar shows **MODEL MATCH** via tenant config (not `SYSTEM APP FORMULA`)
- [ ] Changing `tenantBrand.displayName` updates home without editing JSX copy
- [ ] New arrivals is **one horizontal row** (no 2-col wrap grid of 6)
- [ ] Hero shorter; primary CTA clearly shop-oriented
- [ ] When promotions flag on + active promos exist, strip appears under hero with **all** active promos
- [ ] When none / flag off, strip absent
- [ ] Tapping coded promo reaches cart with code prefilled
- [ ] Session ceremony runs once per cold start session; not on every tab return
- [ ] Ceremony includes visible motion + one haptic
- [ ] `npx tsc --noEmit` clean; zh-CN / en / ms key parity for new keys
- [ ] No commit / push / merge unless human asks

---

## 9. Open / deferred

- Remote tenant config API / Supabase table
- Per-tenant Pixel2Motion splash regeneration
- Web (`HomePageClient`) parity
- Mounting / redesigning `OnboardingOverlay` (optional follow-up)
- “Featured” promo flag in DB (not needed — show all active)
- Analytics on offer taps / ceremony completion

---

## 10. Related wiki / raw

- [[wiki/concepts/pixel2motion-splash-asf-2]]
- [[wiki/concepts/mobile-app-architecture-asf-2]]
- [[wiki/entities/asf-2]]
- `asf-vault/raw/sources/docs/CUSTOMER_REDESIGN_PLAN_2026.md`
- `asf-vault/raw/sources/2026-04-25-mobile-apps-progress.md`
