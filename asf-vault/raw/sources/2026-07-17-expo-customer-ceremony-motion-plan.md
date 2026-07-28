# Expo Customer App — 仪式感 / Ceremony & Motion System Plan (2026-07-17)

**Project**: ASF-2 Expo customer app (`asf-customer-app/`)  
**Date**: July 17, 2026  
**Status**: Approved for implementation (awaiting agent pass)  
**Stakeholder**: Simon (MODEL MATCH pilot) + Stanley  
**Companion prompts**: `2026-07-17-expo-customer-ceremony-motion-agent-prompts.md`  
**Builds on**:
- Home revamp + weak first ceremony — `2026-07-16-expo-customer-home-revamp-plan.md`
- Pixel2Motion splash — `2026-06-26-pixel2motion-model-match-splash.md`
- Customer redesign tokens — `docs/CUSTOMER_REDESIGN_PLAN_2026.md`
- Existing haptics — `asf-customer-app/lib/haptics.ts` (Stores tab is the best reference)

---

## 1. What we are doing

Make the **whole** Expo customer app feel more special (**仪式感**) — not just a flat ecommerce shell after the splash.

Focus areas:

1. **Richer once-per-session home arrival** (current ceremony is too subtle; users barely feel it)
2. **Intentional page / tab navigation** (stack transitions + tab switch feedback)
3. **Interaction texture** (press scale + haptics on high-traffic taps)
4. **Milestone ceremonies** (add to bag, wishlist, checkout success, warranty activate)

**Target app only**: `asf-customer-app/`  
**Out of scope**:
- `asf-2-next` web parity
- `asf-staff-app`
- New Pixel2Motion / splash asset authoring
- Remounting `OnboardingOverlay` (optional later; ceremony covers 仪式感)
- New DB tables / migrations
- Analytics events for ceremony completion

---

## 2. Problem (why current 仪式感 fails)

| Layer | Today | Issue |
|-------|-------|-------|
| Cold start | Pixel2Motion letter cascade (~3s + hold + fade) | Strong — keep |
| Home arrival | `HomeArrivalCeremony` — whole-tree opacity + 12px translateY + `hapticLight`, ~450ms after 300ms delay | Reads as “splash fade part 2”; one blob; too subtle after long splash |
| Navigation | Default stack / tab transitions; no tab haptic | Pages feel utilitarian |
| Taps | Most `Pressable` / `TouchableOpacity` have no scale or haptic | Dead plastic feel |
| Milestones | Checkout success / add-to-bag / wishlist flat | No celebration moments |
| Stores | Strong haptics + gallery ticks | Best-in-app reference — extend that language everywhere |

Simon’s original ask (paraphrased from home revamp): want the app to feel special when opening / landing home (animation, visual, haptic). Stanley confirmed after testing the homepage ceremony: **it does not feel like 仪式感** — needs to be richer.

---

## 3. Locked decisions

| # | Question | Decision |
|---|----------|----------|
| 1 | Intensity | **Fashion retail** — stronger entrances, badge pops, staggered reveals; still **no** bounce spam / neon glow / cartoon |
| 2 | Tab haptic | **Only when switching to a different tab** (not re-tap of current). Shop tab custom reset → `hapticLight()` |
| 3 | Scope | **All phases in one program** (no v1/v2 split) |
| 4 | Home ceremony | **Redesign** — staggered editorial sequence, clearly distinct from splash |
| 5 | Ceremony frequency (home) | **Once per JS session** (cold start); no replay on tab return |
| 6 | Motion personality | Confident · Clean · Modern (same as splash `motion_spec.md`) |
| 7 | Reduced motion | Skip / shorten visuals; keep at most one light haptic where a finish pulse was planned |

### Fashion retail means

- Staggered section reveals (not one opacity fade)
- Brand beat with accent underline wipe
- Badge pop on cart count change
- Heart scale snap on wishlist
- Checkout success check + `hapticSuccess`
- Slightly longer / more deliberate home sequence (~1.0–1.2s), still under ~1.5s

### Fashion retail does **not** mean

- Replaying overlays on every navigation
- Haptic on every pixel tap
- Spring bounce everywhere
- Third full-screen overlay after splash + home

---

## 4. Design system for motion

### Shared tokens — create `asf-customer-app/lib/motion.ts`

Suggested constants (agents may tune slightly but keep one SOT):

```ts
export const motion = {
  duration: {
    press: 120,
    fast: 200,
    base: 280,
    entrance: 420,
    ceremonyStep: 380,
  },
  delay: {
    postSplashBreathe: 200,
    stagger: 100,
    brandToHero: 120,
  },
  scale: {
    press: 0.97,
    badgePeak: 1.15,
    heroStart: 1.04,
    brandStart: 0.94,
    heartPeak: 1.25,
  },
  easing: "outCubic", // map to Reanimated Easing.out(Easing.cubic)
} as const;
```

### Haptic map — reuse `lib/haptics.ts`

| Action | Helper |
|--------|--------|
| Tab switch | `hapticSelection()` |
| Shop tab reset / secondary intentional action | `hapticLight()` |
| Card / row / icon tap (optional on press-in) | `hapticLight()` |
| Primary CTA (Add to bag, Checkout, Call store) | `hapticMedium()` |
| Success (order confirmed, warranty activated, ceremony finish) | `hapticSuccess()` / `hapticMedium()` for home finish |

Do not invent new haptic helpers unless needed; extend existing file only if a gap appears.

### Primitives to add under `components/motion/`

| Component | Role |
|-----------|------|
| `PressableScale` | Scale ~0.97 on press; optional `haptic` prop (`"light" \| "medium" \| "selection" \| "none"`) |
| `CeremonySection` | Children wrapper with stagger index; opacity + translateY from shared ceremony context / props |
| `AnimatedBadge` | Pop scale 0 → peak → 1 when numeric count changes (cart badge) |

### Existing to keep / extend

| Path | Role |
|------|------|
| `lib/haptics.ts` | Impact / selection / success wrappers |
| `lib/homeSessionCeremony.ts` | Once-per-session gate (`hasPlayedHomeCeremony` / `markHomeCeremonyPlayed`) |
| `components/home/HomeArrivalCeremony.tsx` | **Replace internals** — become orchestrator for staggered home |
| `components/SplashIntro.tsx` | Keep; optional `hapticLight` at fade-out start only |
| `app/(tabs)/locations.tsx` | Reference for haptic density — do not regress |

---

## 5. Home ceremony redesign (core 仪式感 fix)

Replace single wrapper fade with a **staggered editorial sequence** once per session.

### Sequence (target ~1.0–1.2s after splash)

```
Splash unmounts
    ↓ postSplashBreathe (~200ms stillness — distinct from splash fade)
① Brand beat — navbar brand (tenantBrand.displayName)
   scale 0.94→1 + fade; gold accent underline wipe
   haptic: selection
    ↓ +~120ms
② Hero — scale 1.04→1 + fade/up
   (optional light haptic — prefer skip to avoid double; brand already pulsed)
    ↓ +~100ms each
③ Offers strip (if rendered)
④ New arrivals row
⑤ Categories (+ posts strip if present)
    ↓
⑥ Finish — hapticMedium()  (“you’re in”)
```

### Rules

- Gate with `homeSessionCeremony.ts` — subsequent mounts in same session: no animation
- Coordinate with splash: **do not** start brand beat while splash overlay still visible; breathe after splash complete
- Loading spinner before home content: ceremony runs when real home content mounts (current pattern OK)
- `useReducedMotion()`: render final state immediately; mark played; optional single `hapticLight`
- Do **not** replay when returning to Home tab

### Implementation sketch

- `HomeArrivalCeremony` provides context or passes `play` + `baseDelay` to sections
- Home screen wraps discrete sections in `CeremonySection` with `index={0|1|2|…}`
- Navbar participates in step ① (brand beat) — not left static while content fades

---

## 6. Navigation feel

### Stack transitions

Apply consistent `screenOptions` on:

- `app/_layout.tsx` (root Stack)
- `app/(tabs)/browse/_layout.tsx`
- `app/(tabs)/profile/_layout.tsx`
- `app/checkout/_layout.tsx`
- `app/(auth)/_layout.tsx`

| Pattern | Screens | Animation |
|---------|---------|-----------|
| Push | PDP, profile subpages, orders, claims, etc. | `slide_from_right`, ~280ms |
| Sheet / modal layer | cart, checkout flow, wishlist | `slide_from_bottom` or fade-from-bottom |
| Auth | sign-in / sign-up / forgot | softer fade + slide ~320ms |

Use Expo Router / `react-native-screens` options already available — no new navigation libs.

### Tab bar (`app/(tabs)/_layout.tsx`)

- On `tabPress`: if destination ≠ current tab → `hapticSelection()`
- Re-press current tab → **no** haptic
- Shop custom listener (catalog reset): keep `preventDefault` + `openBrowseCatalog`; add `hapticLight()`
- Optional: active tab icon micro-scale 0.92→1.0 on switch (fashion accent; keep ≤150ms)

---

## 7. Interaction texture (high-traffic)

Wire `PressableScale` (+ light haptic where appropriate) into:

- `components/ProductCard.tsx`
- `components/CategoryPill.tsx`
- Home primary / secondary CTAs (`app/(tabs)/index.tsx`)
- Profile `MenuRow` (`app/(tabs)/profile/index.tsx`)
- Cart line / checkout primary actions (`app/cart.tsx`, checkout screens)
- Auth primary buttons
- `SubPageHeader` back affordance (light)
- PDP Add to bag / wishlist heart (`app/(tabs)/browse/[productId].tsx`)

Do not require replacing every `TouchableOpacity` in the repo in one pass — prioritize the list above; leave obscure screens if time-boxed, but Agents should finish the listed surfaces.

---

## 8. Milestone ceremonies

| Moment | Motion | Haptic |
|--------|--------|--------|
| Splash → app handoff | Existing fade; optional `hapticLight` when fade starts | light |
| Add to bag | Button pulse + cart `AnimatedBadge` pop | medium |
| Wishlist on/off | Heart scale 1 → 1.25 → 1 + color | selection |
| Checkout success | Check icon scale-in + brief accent treatment | success |
| Warranty activate / redeem confirm | Same success family as checkout | success |

Files of interest:

- `components/SplashIntro.tsx`
- `app/(tabs)/browse/[productId].tsx` (+ home/wishlist hearts if shared)
- Cart badge host (navbar / cart icon sites)
- `app/checkout/success.tsx`
- `app/(tabs)/profile/collection/activate.tsx` (and related confirm success UI)

---

## 9. Implementation phases → agents

| Phase | Agent | Deliverable |
|-------|-------|-------------|
| 1 | Agent 1 | `lib/motion.ts` + `PressableScale` + `CeremonySection` + `AnimatedBadge` (+ thin exports) |
| 2 | Agent 2 | Home ceremony redesign + wire sections on `index.tsx` |
| 3 | Agent 3 | Stack transitions + tab switch haptics (+ optional icon scale) |
| 4 | Agent 4 | Texture sweep + milestone ceremonies (bag, heart, success, warranty, splash bridge) |

Agents run **sequentially**. Each ends with:

```bash
cd asf-customer-app && npx tsc --noEmit
```

**Do not** `npm start` / `npm run build` (dev server often already running).  
**Do not** commit / push / merge unless the human explicitly asks.

---

## 10. Coding constraints (repo + Stanley rules)

- TypeScript strict: no `any`, no non-null `!`, no `as unknown as T`
- Strings: double quotes; prefer template literals / `.join()` over `+`
- Full implementations — no placeholder stubs
- JSDoc on exported functions / components (match existing style)
- i18n: any **new** user-visible strings → `zh-CN` / `en` / `ms` in parallel (prefer reuse existing keys)
- Match existing theme tokens in `constants/theme.ts` (`colors.accent` gold `#C9A96E`, etc.)
- Respect `useReducedMotion` on ceremony / major entrances
- Prefer Reanimated for new motion; RN `Animated` OK only where already used (e.g. SplashIntro fade)

---

## 11. Success criteria

- [ ] Opening the app: splash → short stillness → **noticeable** staggered home reveal + finish haptic (once/session)
- [ ] Returning to Home in same session: **no** replay
- [ ] Push / sheet navigations feel intentional (not default snap)
- [ ] Switching tabs: selection haptic; re-tap current: none; Shop reset: light
- [ ] Product cards / primary CTAs: press scale (+ light/medium haptic as mapped)
- [ ] Add to bag: medium haptic + badge pop (where badge exists)
- [ ] Wishlist toggle: heart motion + selection haptic
- [ ] Checkout success: visible celebration + success haptic
- [ ] Warranty activate success: same family
- [ ] Reduced motion: no jarring multi-step motion; app still usable
- [ ] `npx tsc --noEmit` clean
- [ ] No commit / push / merge unless asked

---

## 12. Manual test checklist

1. Cold start → watch splash → home stagger (brand → hero → strips) → feel finish haptic  
2. Leave Home → Browse → back to Home → **no** ceremony replay  
3. Switch tabs repeatedly → haptic only on change  
4. Re-tap active tab → silent  
5. Open PDP → back → stack animation OK  
6. Open cart / checkout → sheet-like transition  
7. Add to bag → haptic + badge  
8. Toggle wishlist heart  
9. Complete (or open) checkout success UI → celebration  
10. Toggle OS Reduce Motion → home lands quietly  

---

## 13. Related sources

- `asf-vault/raw/sources/2026-07-16-expo-customer-home-revamp-plan.md`
- `asf-vault/raw/sources/2026-06-26-pixel2motion-model-match-splash.md`
- `asf-vault/raw/sources/docs/CUSTOMER_REDESIGN_PLAN_2026.md`
- Wiki: `wiki/concepts/pixel2motion-splash-asf-2`, `wiki/concepts/mobile-app-architecture-asf-2`
- Code: `asf-customer-app/components/home/HomeArrivalCeremony.tsx`, `lib/homeSessionCeremony.ts`, `lib/haptics.ts`, `components/SplashIntro.tsx`, `app/(tabs)/locations.tsx`
