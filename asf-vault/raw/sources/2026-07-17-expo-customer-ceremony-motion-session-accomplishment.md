# Expo Customer App — Ceremony / 仪式感 Motion Session Accomplishment (2026-07-17)

**Date**: 2026-07-17  
**Project**: ASF-2  
**Primary delivery**: `asf-customer-app` (Expo + React Native) — ambient motion pass + day-to-day bold 仪式感  
**Stakeholder**: Simon (MODEL MATCH) + Stanley  
**Git**: No commit, push, or merge was performed in this session  
**Status**: Implemented and typechecked; device smoke-tested iteratively (layout regressions fixed)

---

## 1. What we set out to do

Make the Expo customer app feel more special (**仪式感**) — especially opening the app / landing Home and navigating between pages — via animation, visual feedback, and haptics.

Stanley feedback after the first (ambient) pass:
- Motion was **nice but too subtle** for Simon’s intent
- Bold moments should be **obvious**, but do **not** have to be confetti
- Rare wins (warranty activate, claim approved, stamp complete) fire too infrequently; **day-to-day shopping** must carry most of the feel

**Out of scope (unchanged):**
- `asf-2-next` web parity, `asf-staff-app`
- New Pixel2Motion splash assets / OnboardingOverlay remount
- Rare achievement celebrations (activate / claim approved / stamp 9/9 / tier unlock) — deferred
- DB migrations, analytics, commit/push/merge unless asked

---

## 2. Decisions (locked)

| Decision | Choice |
|----------|--------|
| Intensity | **Fashion retail** — stronger entrances, badge pops, staggered reveals; gold `#C9A96E` + black + white; not Apple-minimal, not cartoon bounce / rainbow confetti |
| Tab haptic | **Only when switching** to a different tab; Shop catalog reset → `hapticLight()`; re-tap current tab → silent |
| Home ceremony frequency | **Once per JS session** (cold start); no replay on Home tab return |
| Strategy mix | **~80%** daily loop (home / shop / PDP / bag / cart); **~20%** rare wins deferred |
| “Bold” definition | Unmistakable for **~1.5–2.5s** on daily paths, then quiet |
| Daily pillars | (1) Amplify home open · (2) Shop first-land once/session · (3) PDP entrance every open · (4) Add-to-bag moment · (5) Cart open stagger |
| Reduced motion | Skip / shorten visuals; keep at most one light haptic where a finish pulse was planned |
| Add-to-bag navigation | After bold pass: **show tray, do not auto-navigate to cart** (so the confirmation is visible) |

---

## 3. Plans written (raw)

| Raw source | Purpose |
|------------|---------|
| `raw/sources/2026-07-17-expo-customer-ceremony-motion-plan.md` | Ambient pass: primitives, home redesign, nav, texture, milestones |
| `raw/sources/2026-07-17-expo-customer-daily-bold-ceremony-plan.md` | Day-to-day bold: home amplify, Shop first-land, PDP, bag, cart |
| This file | Session outcome / **source of truth for what landed** |

**Agent prompt files** were written for execution, then **deleted** after agents ran (same vault cleanup pattern as other 2026-07-17 programs) so they do not enter the wiki.

Builds on: home revamp ceremony seed (`2026-07-16-expo-customer-home-revamp-plan.md`), Pixel2Motion splash (`2026-06-26-pixel2motion-model-match-splash.md`).

---

## 4. Agent execution — COMPLETE

### Pass A — Ambient ceremony & motion (Agents 1–4)

| Agent | Scope | Result |
|-------|-------|--------|
| 1 | `lib/motion.ts`, `PressableScale`, `CeremonySection`, `AnimatedBadge` | Foundation shipped |
| 2 | Home arrival redesign (stagger + brand beat + haptics) | Once/session orchestrator |
| 3 | Stack transitions + tab-switch haptics | Push vs sheet; switch-only haptic |
| 4 | Texture sweep + milestones (bag heart, checkout/activate success, splash bridge) | Press scale + success checks |

### Pass B — Day-to-day bold (Agents 1–4)

| Agent | Scope | Result |
|-------|-------|--------|
| 1 | Motion token extensions, `shopSessionCeremony`, `AddedToBagTray`, `GoldSweep` | Primitives ready |
| 2 | Home amplify + Shop first-land once/session | Stronger brand/hero; Shop entrance gated |
| 3 | PDP entrance every open | Hero → title/price → variants → CTA slide-up |
| 4 | Add-to-bag tray + cart open stagger | Tray + medium haptic; cart lines/summary stagger |

### Bugfixes during device testing

| Issue | Cause | Fix |
|-------|-------|-----|
| LogBox: `[productId]` removed natively but not from JS | Raw `beforeRemove` + `preventDefault` unsupported by native-stack | Switched to `usePreventRemove` |
| Shop grid “squished” narrow column | `PressableScale` put width styles on inner `Animated.View` | Layout styles on outer `Pressable` |
| Profile menu rows stacked vertically | Same PressableScale column-default child issue | Inner row `View` for MenuRow content + `alignSelf: "stretch"` on animated wrapper |

All passes ended with `npx tsc --noEmit` clean in `asf-customer-app`.

---

## 5. Expo delivery (`asf-customer-app`)

### Motion system

- `lib/motion.ts` — duration / delay / scale tokens + `motionEasing` (`Easing.out(Easing.cubic)`); daily-bold tokens (`dailyEntrance`, `addTray`, `ctaSlide`, `lightSweep`, `heroStartBold`, `pdpHeroStart`, …)
- `lib/haptics.ts` — unchanged API (`light` / `medium` / `selection` / `success`)
- `lib/homeSessionCeremony.ts` — once-per-session home gate
- `lib/shopSessionCeremony.ts` — once-per-session Shop first-land gate

### Components (`components/motion/`)

| Component | Role |
|-----------|------|
| `PressableScale` | Press scale ~0.97; optional haptic; **layout styles on outer Pressable** |
| `CeremonySection` | Staggered opacity / translateY / optional scale; no haptics |
| `AnimatedBadge` | Count badge pop on increase (cart) |
| `GoldSweep` | Gold accent wipe for brand / Shop header |
| `AddedToBagTray` | Short-lived “Added” confirmation strip |
| `index.ts` | Barrel exports |

### Home

- `components/home/HomeArrivalCeremony.tsx` — orchestrator + brand beat (scale, underline, GoldSweep) + finish `hapticMedium`
- `app/(tabs)/index.tsx` — sections in `CeremonySection`; hero uses bold settle; cart `AnimatedBadge`

### Navigation

- Root / browse / profile stacks: `slide_from_right` (~280ms)
- Cart / wishlist / checkout: `slide_from_bottom` (sheet)
- Auth: softer `fade_from_bottom` (~320ms)
- Tabs: selection haptic on switch; Shop reset keeps catalog reset + light haptic

### Daily bold surfaces

- Shop (`browse/index.tsx`): first-land entrance once/session
- PDP (`browse/[productId].tsx`): entrance every open; `usePreventRemove` for Home/Wishlist return; add → tray + `hapticMedium` (no auto cart push)
- Cart (`cart.tsx`): line stagger (cap ~6) + summary/checkout emphasis; optional promo gold pulse

### Milestone / texture (ambient pass, still present)

- Wishlist heart snap + selection haptic
- Checkout success / warranty activate success check ceremonies + `hapticSuccess`
- Splash fade-start optional `hapticLight`
- High-traffic PressableScale (cards, pills, profile rows, auth, etc.)

---

## 6. Two-layer model (keep this in mind)

| Layer | Frequency | Feel | Examples shipped |
|-------|-----------|------|------------------|
| **Ambient** | Often | Texture | Tab haptic, press scale, stack transitions |
| **Daily bold** | Every session / every product / every add | Obvious short ritual | Home amplify, Shop first-land, PDP entrance, bag tray, cart stagger |
| **Achievement** (deferred) | Rare | Full win surface | Activate, claim credit unlock, stamp complete, tier unlock |

Do not confetti everyday taps. Do not make ambient as loud as daily bold.

---

## 7. Success criteria (session)

- [x] Cold start → splash → noticeable home storefront opening (once/session)
- [x] Shop first-land entrance once/session; no replay after PDP return
- [x] PDP open shows image → content → CTA entrance
- [x] Add to bag shows obvious tray + medium haptic (no forced cart nav)
- [x] Cart open staggers lines / emphasizes checkout
- [x] Tab switch haptic only on change
- [x] Shop grid full-width; Profile menu rows horizontal
- [x] PDP back / Shop reset without native-stack JS state warning
- [x] `tsc --noEmit` clean
- [ ] Commit / push — not done (human must ask)

---

## 8. Deferred / next

- Rare achievement celebrations (warranty activate full surface, claim approved value reveal, stamp 9/9, tier unlock)
- Optional Highlights like drama
- Sign-up welcome brand beat
- Further home intensity tuning after Simon device review
- Commit when human requests

---

## 9. Related

- Plans: `raw/sources/2026-07-17-expo-customer-ceremony-motion-plan.md`, `raw/sources/2026-07-17-expo-customer-daily-bold-ceremony-plan.md`
- Prior: `raw/sources/2026-07-16-expo-customer-home-revamp-plan.md`, Pixel2Motion splash sources
- Wiki: [[wiki/concepts/pixel2motion-splash-asf-2]], [[wiki/concepts/mobile-app-architecture-asf-2]], [[wiki/syntheses/2026-07-17-expo-customer-home-catalog-revamp-session-accomplishment]]
