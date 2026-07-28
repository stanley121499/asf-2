---
title: "Expo customer ceremony / 仪式感 motion (ASF-2)"
type: concept
updated: 2026-07-17
sources: 3
tags: [asf-2, expo, motion, ceremony, haptics, model-match]
---

# Expo customer ceremony / 仪式感 motion (ASF-2)

Pattern for making `asf-customer-app` feel intentional on **daily** paths — not only rare wins or the cold-start splash.

**Session SOT:** [[wiki/sources/2026-07-17-expo-customer-ceremony-motion-session-accomplishment]]  
**Raw plans:** `raw/sources/2026-07-17-expo-customer-ceremony-motion-plan.md`, `raw/sources/2026-07-17-expo-customer-daily-bold-ceremony-plan.md`  
**Splash (separate, keep):** [[wiki/concepts/pixel2motion-splash-asf-2]]

---

## Three layers

| Layer | Frequency | Role |
|-------|-----------|------|
| Ambient | Often | Press scale, tab selection haptic, stack push vs sheet |
| Daily bold | Every session / product / add | Home amplify, Shop first-land, PDP entrance, bag tray, cart stagger |
| Achievement | Rare (deferred) | Warranty activate, claim credit unlock, stamp complete, tier unlock |

Personality: **Confident · Clean · Modern** / fashion retail (gold `#C9A96E` + black + white). Bold ≈ unmistakable ~1.5–2.5s then quiet. Confetti not required.

---

## Code map (`asf-customer-app`)

| Area | Path |
|------|------|
| Tokens | `lib/motion.ts`, `lib/haptics.ts` |
| Session gates | `lib/homeSessionCeremony.ts`, `lib/shopSessionCeremony.ts` |
| Primitives | `components/motion/*` (`PressableScale`, `CeremonySection`, `AnimatedBadge`, `GoldSweep`, `AddedToBagTray`) |
| Home | `components/home/HomeArrivalCeremony.tsx`, `app/(tabs)/index.tsx` |
| Shop / PDP / cart | `app/(tabs)/browse/index.tsx`, `browse/[productId].tsx`, `app/cart.tsx` |
| Nav | `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, nested stacks |

### Critical implementation notes

- **`PressableScale`:** put layout width/flex styles on the **outer** `Pressable`; children live in an inner column `Animated.View` — wrong placement squashed Shop grid and Profile menu rows.
- **PDP back from Home/Wishlist:** use `usePreventRemove`, not raw `beforeRemove` + `preventDefault` (native-stack mismatch warning).
- **Add to bag (bold pass):** tray + `hapticMedium`; **no** auto `router.push("/cart")`.

---

## Frequency gates

- Home amplify + Shop first-land: **once per JS process**
- PDP entrance: **every** product open (short)
- Add-to-bag tray: **every** successful add
- Cart stagger: **every** cart content mount
- Tab haptic: **switch only**

Respect `useReducedMotion`.

---

## Related

- [[wiki/entities/asf-2]]
- [[wiki/concepts/mobile-app-architecture-asf-2]]
- [[wiki/sources/2026-07-16-expo-customer-home-revamp-plan]] — first locked "session ceremony" ask
- Deferred: rare achievement surfaces (next program)
