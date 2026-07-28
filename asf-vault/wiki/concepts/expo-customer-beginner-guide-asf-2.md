---
title: "Expo customer beginner guide / App Guide (ASF-2)"
type: concept
updated: 2026-07-18
sources: 2
tags: [asf-2, expo, onboarding, beginner, elderly, i18n, coach-marks]
---

# Expo customer beginner guide / App Guide (ASF-2)

Beginner-first learning system on `asf-customer-app` for users who have never used online shopping apps (especially elderly). Two layers share one coach-mark engine:

1. **App Guide hub** — Profile → **How to use this app** — permanent menu of short real-UI walkthroughs.
2. **First-launch guide** — once after home ceremony; teaches tabs / bag / shop basics and **where the hub lives**.

**Session SOT:** [[wiki/sources/2026-07-17-expo-customer-beginner-guide-session-accomplishment]]  
**Plan (raw):** [2026-07-17-expo-customer-beginner-guide-plan.md](../../raw/sources/2026-07-17-expo-customer-beginner-guide-plan.md)  
**Related motion:** [[wiki/concepts/expo-customer-ceremony-motion-asf-2]] (first-launch starts **after** home ceremony, not on splash)

---

## Locked product rules

- Coach marks on **real UI**; large Next / Back / Skip; **no auto-advance**
- Skip never disables the hub
- Language picker on first-launch **welcome** (en / zh-CN / ms)
- Plain words: bag / pay / size — not cart jargon / PDP / SKU
- Do **not** remount `OnboardingOverlay` (brand/rewards carousel) for this job

---

## Code map (`asf-customer-app`)

| Area | Path |
|------|------|
| Persistence / reset | `lib/appGuide.ts` |
| Engine | `components/guide/*` (`GuideContext`, `GuideOverlay`, `TourAnchor`, `TabBarAnchorOverlay`, `tours`) |
| Hub | `app/(tabs)/profile/guide.tsx` |
| Profile entry + test restart | `app/(tabs)/profile/index.tsx` |
| First-launch trigger | `app/(tabs)/index.tsx` + `HomeArrivalCeremony` `onFinish` |
| i18n | `guide.*` in `i18n/locales/{en,zh-CN,ms}.json` |

### Feature flags for hub topics

| Tour | Flag |
|------|------|
| `myShoes` | `warranty_registration` |
| `rewards` | `rewards` |
| `askForHelp` | `support_chat` |

---

## Implementation notes (keep)

- Cross-screen routes: compare `pathname` after stripping Expo route groups (`/(tabs)/…`).
- Spotlight after tab switch: remeasure on **screen focus** — inactive tabs may be detached (`detachInactiveScreens`).
- Full-width CTA labels with `PressableScale`: use `centerContent` (or an inner centered View); outer `alignItems: "center"` alone does not center bare `Text`.
- Skip must live **in the instruction card**, not floating top-right over Home bag/search.

---

## Related

- [[wiki/entities/asf-2]]
- [[wiki/concepts/mobile-app-architecture-asf-2]]
- [[wiki/concepts/customer-i18n-asf-2]]
- [[wiki/concepts/expo-customer-ceremony-motion-asf-2]]
- [[wiki/sources/2026-07-17-expo-customer-beginner-guide-session-accomplishment]]
