# Expo Customer App — Beginner Guide / "How to Use This App" Session Accomplishment (2026-07-17 → 2026-07-18)

**Date**: Planned and implemented 2026-07-17; device QA / polish into 2026-07-18  
**Project**: ASF-2  
**Primary delivery**: `asf-customer-app` (Expo + React Native) — beginner-first App Guide  
**Stakeholder**: Stanley  
**Git**: No commit, push, or merge was performed in this session  
**Status**: Implemented, typechecked, and iteratively smoke-tested on device

---

## 1. What we set out to do

Solve a **high learning curve** for people who have never used Shopee (or any online shopping app) — especially elderly users — so they can pick up `asf-customer-app` without being stuck.

**Product shape (locked early):**

1. A permanent **"How to use this app"** hub in Profile — a menu of short guided walkthroughs ("lessons") users can reopen whenever they are lost.
2. A short, skippable **first-launch guide** whose main job is to teach the map (tabs, bag) and **point people at that hub** as the safety net.
3. Both share one **coach-mark engine** that spotlights the **real UI** (dim overlay + hole), with large Next / Back / Skip and **no auto-advance**.

This is **not** the existing unmounted `OnboardingOverlay` (brand → rewards → sign-in). That overlay stays untouched.

**Out of scope (unchanged):**
- `asf-2-next` web parity, `asf-staff-app`
- Wiring / redesigning `OnboardingOverlay`
- New DB tables / analytics events for guide completion
- Video / narrated tutorials
- Fixing true guest browse vs tabs auth redirect (separate problem)

---

## 2. Decisions (locked)

| Decision | Choice |
|----------|--------|
| Audience | Absolute beginners / elderly; plain language only |
| Scope model | **No v1/v2 split** — full topic set + first-launch in one program |
| Teaching style | Coach marks on **real screens**, not marketing carousels or screenshots |
| Permanence | Hub always available in Profile; first-launch is once-per-install (persisted) |
| First-launch job | Tabs + bag + shop one-liner + **discover the hub**; then get out of the way |
| Skip | Visible on every step; skip marks first-launch done but **never** disables the hub |
| Advance | Tap only — no timed auto-advance |
| Language | First-launch **welcome step includes locale picker** (en / zh-CN / ms) so non-English users are not trapped |
| Motion | Calm; reuse `lib/motion` / haptics; respect `useReducedMotion` |
| vs Support | Guide = "show me how"; Support = "talk to a person" (hub may link to Support) |
| vs splash / ceremony | First-launch starts **after** home arrival ceremony finishes — never stacks on splash |
| OnboardingOverlay | Leave unmounted / unmodified |
| Feature flags (verified in code) | `myShoes` → `warranty_registration`; `rewards` → `rewards`; `askForHelp` → `support_chat` |

### Plain-language dictionary (copy)

| Avoid | Prefer |
|-------|--------|
| Cart / checkout jargon | Bag / pay |
| PDP / variant / SKU | The shoe's page / size |
| Wishlist | Favourites / saved |

---

## 3. Plans written (raw)

| Raw source | Purpose |
|------------|---------|
| `raw/sources/2026-07-17-expo-customer-beginner-guide-plan.md` | Full product + architecture plan (tours, anchors, i18n, phases) |
| This file | Session outcome / **source of truth for what landed** |

**Agent prompt file** `2026-07-17-expo-customer-beginner-guide-agent-prompts.md` was written for sequential Agents 1–4, then **deleted** after execution (same vault cleanup pattern as ceremony / warranty programs) so it does not enter the wiki. The plan still mentions the companion filename historically; treat this accomplishment as SOT for delivery.

Builds on: ceremony motion (`2026-07-17-expo-customer-ceremony-motion-*`), home revamp, customer i18n.

---

## 4. Agent execution — COMPLETE

| Agent | Scope | Result |
|-------|-------|--------|
| 1 | Coach-mark engine: `lib/appGuide.ts`, `components/guide/*`, mount in `app/_layout.tsx` | Provider, overlay, anchors, smoke-test tour |
| 2 | Hub `profile/guide.tsx` + Profile entry + topic cards + hub i18n | All 9 topics registered (empty steps filled later); flag mapping corrected |
| 3 | Shopping anchors + tours `findShoes` / `chooseSizeAddToBag` / `payCheckout` | Cross-screen nav; fixed route-group vs `pathname` mismatch |
| 4 | Account/help tours + `firstLaunch` after ceremony + replay welcome | Persistence + session guard; hub replay |

All agents ended with `cd asf-customer-app && npx tsc --noEmit` clean.

---

## 5. Expo delivery (`asf-customer-app`)

### Engine (`components/guide/` + `lib/appGuide.ts`)

| Piece | Role |
|-------|------|
| `lib/appGuide.ts` | `guide_first_v1_done` AsyncStorage; `hasSeenFirstGuide` / `markFirstGuideSeen`; session trigger guard; `resetFirstGuide()` for testing |
| `GuideContext.tsx` | Tour state machine; `startTour` / `next` / `back` / `exit`; cross-screen `router.navigate` with route-group stripping |
| `GuideOverlay.tsx` | Dim scrim + spotlight cutout + instruction card; Skip **inside** card (not floating over navbar); language picker on first-launch welcome; Back after step 1 |
| `TourAnchor.tsx` | `measureInWindow` registration; remeasure on focus + when step becomes active; settle retry |
| `TabBarAnchorOverlay.tsx` | Whole-tab-bar measurement fallback (tabs rendered internally by bottom-tabs) |
| `tours.ts` | `ANCHORS`, `TOURS`, `HUB_TOPIC_ORDER`, `GuideStep` / `GuideTour` (+ `dynamicBody` for flag-aware tab copy) |

### Hub & Profile

- `app/(tabs)/profile/guide.tsx` — permanent hub; large topic cards; replay welcome; contact support when `support_chat` on
- Profile menu: promoted **How to use this app** (signed-in + guest)
- Testing row: **Restart the welcome tour (testing)** → `resetFirstGuide()` + navigate Home + `startTour("firstLaunch")`

### Tours shipped

**First-launch (`firstLaunch`)** — after home ceremony once if not seen:

1. Welcome (+ language pills)  
2. Tabs  
3. Bag  
4. Shop one-liner  
5. Safety net → Profile guide entry  
6. Done → Home  

**Hub topics:** `findShoes`, `chooseSizeAddToBag`, `payCheckout`, `seeMyOrders`, `saveFavourites`, `changeLanguage`, `myShoes`, `rewards`, `askForHelp` (latter three flag-gated as above).

### i18n

New `guide.*` namespace in `en` / `zh-CN` / `ms` (controls, hub, topics, firstLaunch, step copy). Locale picker on welcome uses the same `setLocale` as Profile.

### Trigger

`HomeArrivalCeremony` gained `onFinish`; Home starts `firstLaunch` only if session guard + persisted "not seen". Finish **or** skip both call `markFirstGuideSeen()`. Replay from hub does not require clearing storage.

---

## 6. Device QA / polish (post-agents)

| Issue | Cause | Fix |
|-------|-------|-----|
| Next / Back text flush-left in guide | `PressableScale` inner stretch + bare `Text` left-align | Inner centering View / `textAlign: "center"` in overlay; later `centerContent` prop |
| Skip covering bag icon | Floating Skip at top-right | Skip moved into instruction card header |
| Step 5 spotlight on empty bars | Stale `measureInWindow` before Profile tab reattached (`detachInactiveScreens`) | Remeasure on screen focus + settle retry; scroll Profile to top when targeting guide entry |
| No language at start of guide | First-launch assumed English | Language pills on welcome step |
| No Back visible | Same left-align made Back look missing | Centering fix; Back already gated by `!isFirst` |
| Need to retest first-launch | Persistence blocks replay | Profile "Restart the welcome tour (testing)" + `resetFirstGuide()` |
| PDP Add to bag (and other CTAs) left-aligned | Same PressableScale pitfall after TourAnchor / full-width CTAs | Opt-in `centerContent` on `PressableScale`; applied to PDP, cart checkout/sign-in, auth submit, collection activate |

---

## 7. Success criteria (session)

- [x] Permanent hub in Profile; topic cards launch real-UI tours
- [x] First-launch once after ceremony; teaches tabs + bag + hub safety net
- [x] Skip / Exit always available; hub remains usable after skip
- [x] Language choosable at first-launch welcome
- [x] Feature-flagged topics only when flags on
- [x] en / zh-CN / ms key parity for new guide strings
- [x] `tsc --noEmit` clean
- [x] Agent prompts deleted from vault raw (not ingested)
- [ ] Commit / push — not done (human must ask)

---

## 8. Deferred / next

- True guest path vs `(tabs)` auth redirect
- Optional Home `?` shortcut to hub (Profile entry is SOT for now)
- Analytics on tour start/complete
- Further spotlight polish on highly dynamic empty states
- Commit when human requests

---

## 9. Related

- Plan: `raw/sources/2026-07-17-expo-customer-beginner-guide-plan.md`
- Ceremony: `raw/sources/2026-07-17-expo-customer-ceremony-motion-session-accomplishment.md`
- Wiki: [[wiki/concepts/expo-customer-beginner-guide-asf-2]], [[wiki/concepts/mobile-app-architecture-asf-2]], [[wiki/concepts/expo-customer-ceremony-motion-asf-2]], [[wiki/concepts/customer-i18n-asf-2]]
