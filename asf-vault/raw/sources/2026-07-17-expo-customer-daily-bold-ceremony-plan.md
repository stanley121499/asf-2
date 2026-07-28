# Expo Customer App — Day-to-Day Bold Ceremony Plan (2026-07-17)

**Project**: ASF-2 Expo customer app (`asf-customer-app/`)  
**Date**: July 17, 2026  
**Status**: Approved for implementation (awaiting agent pass)  
**Stakeholder**: Simon (MODEL MATCH pilot) + Stanley  
**Companion prompts**: `2026-07-17-expo-customer-daily-bold-ceremony-agent-prompts.md`  
**Builds on**:
- Ambient motion pass (shipped) — `2026-07-17-expo-customer-ceremony-motion-plan.md`
- Home revamp — `2026-07-16-expo-customer-home-revamp-plan.md`
- Pixel2Motion splash — `2026-06-26-pixel2motion-model-match-splash.md`
- Existing primitives — `lib/motion.ts`, `components/motion/*`, `HomeArrivalCeremony`

---

## 1. What we are doing

Make **仪式感 obvious on paths people use every day** — not only rare wins (warranty activate, claim approved, stamp complete).

Stanley feedback after the ambient pass:
- Current motion is **nice but subtle**
- Simon wants something **bolder / more obvious**
- Does **not** have to be confetti — can be seal, count-up, light sweep, fly-to-bag, full entrance
- Rare achievement moments help, but they fire **&lt;10% of sessions** — daily shopping loop must carry most of the feel

**Strategy mix:**
- **~80%** of perceived 仪式感 from daily loop: open home → shop/PDP → add to bag → cart
- **~20%** rare wins deferred (activate / claim / stamps) — out of scope for *this* program unless time remains

**Target app only**: `asf-customer-app/`  
**Out of scope for this program**:
- `asf-2-next` web parity, `asf-staff-app`
- Rainbow party confetti / cartoon bounce / neon glow
- Confetti on every tap / every tab switch / every product card press
- New Pixel2Motion splash assets
- Warranty activate / claim approved / stamp-complete / tier unlock celebrations (follow-up program)
- DB migrations, analytics, commit/push/merge unless human asks

---

## 2. Problem (baseline after ambient pass)

| Surface | Today (post ambient pass) | Gap for “day-to-day bold” |
|---------|---------------------------|---------------------------|
| Home open | Staggered brand → hero → sections + finish haptic | Still too quiet after splash; needs stronger storefront opening |
| Shop catalog | Flat grid; tab haptic only | First Shop land per session has no entrance |
| PDP | Mostly static; heart snap + add haptic | Opening a product feels utilitarian — highest-frequency “looking” moment |
| Add to bag | `hapticMedium` + optional badge pop | Easy to miss; needs a clear short “caught it” moment |
| Cart open | Sheet transition + PressableScale on rows | Lines / total land flat — should feel like stepping to the counter |
| Rare wins | Small check ceremonies on checkout / activate | Important later; not the daily driver |

---

## 3. Locked decisions

| # | Question | Decision |
|---|----------|----------|
| 1 | What is “bold”? | **Unmistakable for ~1.5–2.5s**, then quiet. Fashion retail: gold `#C9A96E` + black + white. Not confetti-required. |
| 2 | Daily pillars (this program) | **(1) Home open amplify** · **(2) PDP entrance** · **(3) Add-to-bag moment** · **(4) Cart open** · **(5) Shop first-land (session)** |
| 3 | Frequency gates | Home / Shop first-land = **once per JS session**. PDP entrance = **every PDP open** (keep short). Add-to-bag = **every successful add**. Cart open = **every cart mount** (short stagger, not a 2s takeover). |
| 4 | What stays subtle | Tab switches, grid card presses, filter chips, scroll, wishlist heart (keep existing snap) |
| 5 | Reduced motion | Skip / shorten visuals; keep at most one haptic where a finish pulse was planned |
| 6 | Reuse | Extend `lib/motion.ts` + `components/motion/*`; do not reinvent PressableScale / CeremonySection |
| 7 | Personality | Confident · Clean · Modern — same as splash / ambient pass |

### Bold patterns allowed (pick per surface)

| Pattern | Use |
|---------|-----|
| Gold light sweep / accent underline wipe | Home hero, Shop header |
| Stronger staggered entrance | Home amplify, PDP, Cart lines |
| Fly-to-bag / “Added” tray strip | Add to bag |
| Sticky CTA bar slide-up | PDP Add to bag bar |
| Sheet content stagger + total emphasis | Cart open |
| Badge / bag icon catch pop | Add to bag (amplify existing AnimatedBadge) |

### Explicitly avoid

- Full-screen takeover on every PDP
- Confetti / particle storms on daily actions
- Replaying home ceremony on every Home tab return
- Blocking UI for &gt;2.5s on daily paths

---

## 4. Daily pillars (spec)

### 4.1 Home open — amplify (once / session)

**Files:** `components/home/HomeArrivalCeremony.tsx`, `app/(tabs)/index.tsx`, maybe `CeremonySection`

**Make it louder than ambient stagger:**
- Longer / clearer brand beat (scale + gold underline; optional soft gold light sweep across brand or hero top edge)
- Hero settle more visible (`heroStart` may increase slightly, e.g. 1.06–1.08; duration slightly longer)
- Content stagger remains, but finish should feel like “store is open” (`hapticMedium` already — keep)
- Still **after** splash breathe; still once per session; still respect reduced motion

**Success feel:** User cold-starts and thinks “that was intentional,” not “splash faded twice.”

### 4.2 Shop first-land (once / session)

**Files:** `app/(tabs)/browse/index.tsx`, new `lib/shopSessionCeremony.ts` (mirror home session gate)

**When:** First time Shop catalog mounts in this JS process (not every tab re-focus if already played).

**Motion:**
- Search bar + sort/filter row fade/slide in (index 0–1)
- Product grid rows stagger lightly (first ~2–4 rows or whole list wrapper — prefer wrapper / header to avoid FlatList jank)
- Optional gold accent line under search
- One `hapticSelection` or `hapticLight` at start — not medium

**Do not** replay when returning from PDP to catalog in same session if gate already set.

### 4.3 PDP entrance (every product open)

**Files:** `app/(tabs)/browse/[productId].tsx`

**Sequence (~1.2–1.8s total, non-blocking):**
1. Hero image: scale ~1.05→1 + fade (or slight translateY)
2. Name + price stagger in
3. Variant selectors fade in
4. Sticky **Add to bag** bar slides up from bottom last

Haptics: optional single `hapticLight` when entrance starts — **not** success. Keep existing wishlist / add haptics.

Respect `useReducedMotion`: show final layout immediately.

### 4.4 Add-to-bag moment (every successful add)

**Files:** PDP `[productId].tsx`, shared primitive, home/cart bag icon hosts if needed

**Must be unmissable but short (~800–1200ms):**
- Keep `hapticMedium` on successful add
- Add a visible moment — pick **one primary** pattern (implementer may combine lightly):
  - **A. Added tray / toast**: thin strip or compact card near bottom (“Added” + product name or thumb), auto-dismiss
  - **B. Bag catch**: bag icon / badge does a clear overshoot pop (amplify `AnimatedBadge`)
  - Prefer A+B together if clean; A alone is OK if badge host is awkward

**Do not** navigate away. **Do not** block further taps longer than the animation.

i18n: reuse existing add-to-bag success strings if present; else add parallel keys in zh-CN / en / ms.

### 4.5 Cart open (every cart mount)

**Files:** `app/cart.tsx`

**Motion:**
- Line items stagger in (opacity + slight Y), capped so long carts don’t take forever (e.g. stagger first 6, rest appear settled)
- Summary / total / Checkout CTA lands last with slight emphasis
- If a promo is already applied, gold “saved” treatment pulses once (subtle)

Haptic: optional `hapticLight` on open — not success.

Sheet transition from ambient pass stays (`slide_from_bottom`).

---

## 5. Shared primitives to add / extend

| Piece | Role |
|-------|------|
| Extend `lib/motion.ts` | Tokens for daily bold: e.g. `dailyEntrance`, `addTray`, `lightSweep`, slightly stronger `heroStart` if needed |
| `components/motion/GoldSweep.tsx` (optional) | Thin gold accent wipe / light sweep — reuse on home + shop |
| `components/motion/AddedToBagTray.tsx` | Short-lived “Added” confirmation UI |
| `lib/shopSessionCeremony.ts` | Once-per-session gate for Shop first-land |
| Reuse | `CeremonySection`, `PressableScale`, `AnimatedBadge`, `homeSessionCeremony`, haptics |

Keep primitives focused; prefer extending existing motion kit over one-off screen hacks.

---

## 6. Implementation phases → agents

| Phase | Agent | Deliverable |
|-------|-------|-------------|
| 1 | Agent 1 | Motion token extensions + `AddedToBagTray` (+ optional `GoldSweep`) + `shopSessionCeremony` gate |
| 2 | Agent 2 | Home open amplify + Shop first-land |
| 3 | Agent 3 | PDP entrance + sticky CTA slide-up |
| 4 | Agent 4 | Add-to-bag moment (tray + bag catch) + Cart open stagger |

Agents run **sequentially**. Each ends with:

```bash
cd asf-customer-app && npx tsc --noEmit
```

**Do not** `npm start` / `npm run build`.  
**Do not** commit / push / merge unless human asks.

---

## 7. Coding constraints

- TypeScript strict: no `any`, no `!`, no `as unknown as T`
- Strings: double quotes; prefer templates / `.join()`
- Complete implementations — no placeholders
- JSDoc on new exports
- New user-visible copy → zh-CN / en / ms in parallel
- Prefer Reanimated; respect `useReducedMotion`
- Preserve ambient pass work (nav transitions, tab haptics, PressableScale layout fix — style on outer Pressable)
- Do not regress Shop grid full-width (`PressableScale` width on outer Pressable)
- Do not reintroduce PDP raw `beforeRemove` + `preventDefault` (use `usePreventRemove` if touching back)

---

## 8. Success criteria

- [ ] Cold start → home feels like a **clear storefront opening** (stronger than ambient-only stagger)
- [ ] First Shop land per session has a short entrance; later Shop visits same session do not replay
- [ ] Every PDP open has a visible image → content → CTA entrance
- [ ] Successful add to bag shows an **obvious** short confirmation (tray and/or bag catch) + medium haptic
- [ ] Opening cart staggers lines / emphasizes checkout
- [ ] Daily paths stay under ~2.5s of ceremony; UI remains usable
- [ ] Reduced motion paths safe
- [ ] Grid / PressableScale layout not squished
- [ ] `npx tsc --noEmit` clean
- [ ] No commit unless asked

---

## 9. Manual test checklist

1. Cold kill → open app → splash → home amplify (noticeably bolder)  
2. Open Shop first time → entrance plays  
3. Open PDP → back → Shop again → Shop entrance does **not** replay  
4. Open several PDPs → each gets short entrance  
5. Add to bag → tray/catch obvious + haptic  
6. Open cart → lines stagger, checkout emphasized  
7. Reduce Motion on → no jarring multi-step motion  
8. Shop grid still full-width (2-col)

---

## 10. Deferred (next program)

- Warranty activate full success surface  
- Claim approved / credit unlock reveal  
- Stamp card 9/9 + tier unlock  
- Sign-up welcome  
- Highlights like drama (optional polish)

---

## 11. Related sources

- `asf-vault/raw/sources/2026-07-17-expo-customer-ceremony-motion-plan.md`
- `asf-vault/raw/sources/2026-07-17-expo-customer-ceremony-motion-agent-prompts.md`
- Code: `components/home/HomeArrivalCeremony.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/browse/[productId].tsx`, `app/(tabs)/browse/index.tsx`, `app/cart.tsx`, `lib/motion.ts`, `components/motion/*`
