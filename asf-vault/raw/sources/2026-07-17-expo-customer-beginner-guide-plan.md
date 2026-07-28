# Expo Customer App — Beginner Guide / "How to Use This App" Plan (2026-07-17)

**Project**: ASF-2 Expo customer app (`asf-customer-app/`)
**Date**: July 17, 2026
**Status**: Approved for implementation (awaiting agent pass)
**Stakeholder**: Stanley
**Companion prompts**: `2026-07-17-expo-customer-beginner-guide-agent-prompts.md`
**Builds on / must respect**:
- Ceremony & motion system — `2026-07-17-expo-customer-ceremony-motion-plan.md` (splash + home arrival + `PressableScale`/haptics)
- Home revamp — `2026-07-16-expo-customer-home-revamp-plan.md`
- Existing (unmounted) `components/OnboardingOverlay.tsx`
- Existing haptics — `asf-customer-app/lib/haptics.ts`
- Existing motion tokens — `asf-customer-app/lib/motion.ts`

---

## 1. What we are building

A **beginner-first learning system** for the Expo customer app, aimed squarely at users with a **high learning curve** — e.g. elderly users who have **never** used Shopee or any online shopping app.

It has **two parts that work together**:

1. **App Guide hub** — a permanent **"How to use this app"** page in Profile. It is a **menu of short, guided walkthroughs** ("lessons"), one per hard part of the app. Users can open it **any time they are lost or don't know how to do something**.
2. **First-launch guide** — a short, calm, skippable orientation the first time a signed-in user lands on Home. Its main job is to teach the map: bottom tabs, the shopping bag, and — most importantly — **where the App Guide hub lives** so they always have a safety net.

Both use the same **coach-mark / spotlight engine**: a dim overlay that highlights the **real UI** on the real screens and explains one thing at a time, with large **Next / Back / Skip** controls and **no auto-advance**.

**This is not** a marketing/rewards carousel and **not** a one-time tour. The `OnboardingOverlay` (brand → rewards → sign-in) is explicitly **not** the model here.

---

## 2. Why (the problem)

| User | Today's experience |
|------|--------------------|
| Never shopped online | No mental model of "browse → bag → pay → orders". The tab bar, bag icon, size picker, and checkout are all unfamiliar. Nothing teaches them, and there is no place to re-learn. |
| Elderly / low tech confidence | Small targets, jargon, and swipe-only patterns are intimidating. One-time onboarding (if skipped or forgotten) is a dead end. |
| Tech-savvy | Wants to skip instantly and never be nagged. |

**Core outcome:** after using the first-launch guide once, a beginner should be able to answer:
1. "Where do I find shoes?" → Shop
2. "Where do my items go?" → Bag
3. "How do I pay?" → Bag → pay
4. "Where is my order?" → Profile → My orders
5. **"I forgot everything — where do I go?"** → Profile → **How to use this app**

If #5 sticks, the learning curve stops being a cliff.

---

## 3. Locked decisions

| # | Question | Decision |
|---|----------|----------|
| 1 | Scope model | **No v1/v2 split.** Ship the full topic set + first-launch guide together. |
| 2 | Primary audience | **Absolute beginners / elderly.** Every copy + interaction decision favors them. |
| 3 | Teaching style | **Coach marks on real UI** (dim overlay + spotlight), not abstract screenshots or a separate mock. |
| 4 | Permanence | **App Guide hub is always available** in Profile; re-openable forever. |
| 5 | First-launch job | Teach the map (tabs, bag) **and** point to the hub as the safety net; then get out of the way. |
| 6 | Skippability | **Skip on every step.** Skipping the first-launch guide marks it done but never disables the hub. |
| 7 | Advance model | **Tap to advance only.** No timed auto-advance ever. |
| 8 | Motion | Reuse existing motion tokens; keep it calm; **respect `useReducedMotion`** (instant, no flashy transitions). |
| 9 | Relationship to Support | Guide = "show me how" (self-serve). Support = "talk to a person". Keep separate; hub may link to Support at the bottom. |
| 10 | OnboardingOverlay | **Leave unmounted / untouched.** Do not wire it up; do not delete it in this program. |

### Beginner UX rules (locked — apply everywhere)

- One idea per step.
- Large tap targets, high contrast, plain words (no "PDP", "SKU", "variant", "checkout jargon").
- Big **Next** and **Back**; **Skip / Exit guide** always visible.
- No auto-advance; no swipe-only.
- Real UI under a dim overlay (spotlight the actual control).
- All new user-visible copy in **en / zh-CN / ms**, in parallel.
- Respect reduced motion.

---

## 4. Naming & vocabulary

Use one consistent name for the feature so copy and code agree.

- Feature name (code + folder): **App Guide** (`guide`).
- User-facing hub title: **"How to use this app"** (EN) / **"如何使用本应用"** (zh-CN) / **"Cara guna aplikasi ini"** (ms). Implementers may refine wording, but keep it plain.
- A single lesson = a **tour** (internally) / **guide topic** (user-facing).

**Plain-language dictionary** (use these in copy; avoid the left column):

| Avoid (jargon) | Use (plain) |
|----------------|-------------|
| PDP / product detail page | the shoe's page |
| Variant / SKU | size / colour |
| Add to cart | Add to bag |
| Cart | Bag / shopping bag |
| Checkout | Pay / buy |
| Wishlist | Saved / favourites |
| Order status | where your order is |

---

## 5. Architecture

### 5.1 Coach-mark engine (new, reusable)

A small custom engine — **no new dependency** to start (avoid `react-native-copilot` unless spotlight measurement becomes painful). It integrates with the existing motion kit.

**New files (proposed under `components/guide/` + `lib/`):**

| File | Role |
|------|------|
| `lib/appGuide.ts` | Storage keys + helpers: `hasSeenFirstGuide()`, `markFirstGuideSeen()` (AsyncStorage, key `guide_first_v1_done`). Pure module, no React. |
| `components/guide/GuideContext.tsx` | Provider + `useGuide()` hook. Holds active tour + step index + registered anchor rects. Actions: `startTour(id)`, `next()`, `back()`, `exit()`, `registerAnchor(id, rect)`, `unregisterAnchor(id)`. |
| `components/guide/GuideOverlay.tsx` | Full-screen `Modal`/absolute overlay: dim backdrop + spotlight "hole" over the active anchor rect + a bottom instruction card (title, body, step indicator, **Back / Next / Skip**). Reads active step from context. |
| `components/guide/TourAnchor.tsx` | Wrapper component + `useTourAnchor(id)` hook. Measures its child via `measureInWindow` and registers the rect under `id`. Re-measures on layout / step change. |
| `components/guide/tours.ts` | Declarative tour + step definitions (see 5.4). Pure data referencing anchor ids + i18n keys + optional target route. |
| `components/guide/index.ts` | Barrel exports (mirror `components/motion/index.ts`). |

**Step shape (guideline):**

```ts
interface GuideStep {
  /** i18n key for the short title. */
  titleKey: string;
  /** i18n key for the one-idea body. */
  bodyKey: string;
  /** Anchor id to spotlight; omit for a centered full-card step (welcome/done). */
  anchorId?: string;
  /** Route to navigate to before showing this step (cross-screen tours). */
  route?: string;
  /** Card placement relative to the spotlight. */
  placement?: "top" | "bottom" | "center";
}

interface GuideTour {
  id: string;                 // e.g. "findShoes"
  titleKey: string;           // hub card title
  descriptionKey: string;     // hub card one-liner
  icon: IoniconName;          // hub card icon
  /** Optional feature flag gate — hide/skip when off. */
  featureFlag?: string;       // e.g. "claims", "promotions"
  steps: GuideStep[];
}
```

**Cross-screen behavior (important):** when a step has a `route`, the provider navigates there first (via `expo-router`), waits for the target `TourAnchor` to register its rect (short poll / effect), then the overlay spotlights it. If an anchor is missing after a brief timeout, skip the spotlight and show the card centered (graceful degrade) — never hard-crash or block.

### 5.2 App Guide hub page (new screen)

- Path: `app/(tabs)/profile/guide.tsx` (profile stack — gets `SubPageHeader` + slide transition for free).
- Layout: `SubPageHeader` title "How to use this app" + short subtitle ("Tap a topic. We'll show you on the real screen.") + a vertical list of **large topic cards** (icon + title + one-line description, big text, generous padding, `PressableScale`).
- Each card calls `startTour(tour.id)`; the provider handles navigation + spotlighting.
- Feature-flagged topics only render when their flag is on (`useFeatureFlags().isEnabled(...)`).
- Bottom of the page: a quieter **"Still need help? Contact support"** row linking to `/(tabs)/profile/support` (only when `support_chat` flag on).

### 5.3 First-launch guide (trigger + sequence)

- Triggered from Home (`app/(tabs)/index.tsx`) after the **home arrival ceremony** finishes and only if `hasSeenFirstGuide()` is false.
- Runs the `firstLaunch` tour (see 5.4). Its final step deposits the user on **Profile → How to use this app** (or clearly points there) so the safety net is discovered.
- On finish **or** skip: call `markFirstGuideSeen()`. The hub remains available regardless.
- Must **not** fight splash or ceremony: start only after ceremony completion (reuse `homeSessionCeremony` timing / a short post-ceremony delay). Never stack on top of the splash.

### 5.4 Tours (full set — no "later")

`firstLaunch` (the map + safety net):

1. Welcome (center card) — "This app lets you shop shoes on your phone. We'll show you the important buttons. You can skip anytime."
2. Bottom tabs — spotlight tab bar: Home = start, Shop = find shoes, Profile = your account & help. (Mention Highlights/Stores **only if** those tabs are visible.)
3. Shopping bag — spotlight the bag icon on Home: "Items you want to buy go here. Tap it when you're ready to pay."
4. Shop in one sentence — navigate to Shop, spotlight the grid: "Tap a shoe → choose size → Add to bag."
5. The safety net (most important) — navigate to **Profile → How to use this app** entry, spotlight it: "If you ever forget how, open this page to learn each part again."
6. Done (center card) — "You're ready. Start from Home anytime." → **Got it** returns to Home.

Hub topic tours (each 3–5 steps, self-contained, return to hub when done):

| Tour id | User-facing topic | Teaches | Feature flag |
|---------|-------------------|---------|--------------|
| `findShoes` | Find shoes | Shop tab → browse grid → open a shoe's page | — |
| `chooseSizeAddToBag` | Choose size & add to bag | Open a shoe → size row → Add to bag → bag icon updates | — |
| `payCheckout` | Pay for your order | Bag icon → review bag → the pay/checkout steps in plain words | — |
| `seeMyOrders` | See my orders | Profile → My orders → what the statuses mean, simply | — |
| `saveFavourites` | Save favourites | The heart / saved items ("save for later") | — |
| `changeLanguage` | Change language | Profile → language row → pick language | — |
| `myShoes` | My shoes / warranty | Profile → Collection → activate code | `claims` (or relevant collection flag) |
| `rewards` | Points & rewards | Profile → Rewards, kept very simple | `promotions` (or rewards flag) |
| `askForHelp` | Ask for help | How to open Support and send a message | `support_chat` |

Implementers verify exact feature-flag names against `context/FeatureFlagsContext.tsx` before gating.

### 5.5 Replay

- The hub itself **is** the replay mechanism (open any topic any time).
- Topic tours do not depend on the `guide_first_v1_done` flag — they always run on demand.
- Optional nicety: a "Show the welcome tour again" row at the bottom of the hub that re-runs `firstLaunch` (does not require clearing storage).

---

## 6. Where it lives in Profile

Promote discoverability — put the entry **near the top** of the signed-in profile menu (before Orders), with a friendly icon (e.g. `help-buoy-outline` or `school-outline`):

```
Profile
  ├── How to use this app     ← NEW hub (promoted, top of menu)
  ├── My orders
  ├── Collection / warranty   (if enabled)
  ├── My wishlist
  ├── Rewards                 (if enabled)
  ├── Support                 ← human help (existing)
  └── Language
```

Also show the same **"How to use this app"** row in the **guest** profile view (the guide teaches navigation, which guests can use too) — implementer's call if guest routing to gated topics is awkward; at minimum show `firstLaunch`, `findShoes`, `changeLanguage`.

---

## 7. Instrumentation (anchors to add)

Wrap the real controls with `TourAnchor` (stable ids). Keep ids in one place (e.g. exported constants in `components/guide/tours.ts`) to avoid typos.

| Anchor id | File | Element |
|-----------|------|---------|
| `tabbar.home` / `tabbar.shop` / `tabbar.profile` (+ `highlights`/`locations` when visible) | `app/(tabs)/_layout.tsx` | Tab bar items |
| `home.search` | `app/(tabs)/index.tsx` | Home search icon |
| `home.bag` | `app/(tabs)/index.tsx` | Home bag icon (has `AnimatedBadge`) |
| `shop.grid` | `app/(tabs)/browse/index.tsx` | Product grid / first card |
| `pdp.size` | `app/(tabs)/browse/[productId].tsx` | Size selector row |
| `pdp.addToBag` | `app/(tabs)/browse/[productId].tsx` | Add to bag button |
| `cart.review` | `app/cart.tsx` | Bag summary / checkout button |
| `profile.guideEntry` | `app/(tabs)/profile/index.tsx` | The "How to use this app" menu row |
| `profile.orders` | `app/(tabs)/profile/index.tsx` | My orders row |
| `profile.language` | `app/(tabs)/profile/index.tsx` | Language row |
| `profile.support` | `app/(tabs)/profile/index.tsx` | Support row |

Anchoring the tab bar may require measuring tab buttons; if `expo-router`/`@react-navigation` tab button refs are awkward, an acceptable fallback is a `TourAnchor` overlay positioned over the whole tab bar with copy that lists the tabs (still spotlights the real bar).

---

## 8. i18n

Add a new top-level namespace **`guide`** to all three catalogs (`i18n/locales/{en,zh-CN,ms}.json`), in parallel. Suggested shape:

```jsonc
"guide": {
  "hubTitle": "How to use this app",
  "hubSubtitle": "Tap a topic. We'll show you on the real screen.",
  "controls": { "next": "Next", "back": "Back", "skip": "Skip", "done": "Got it", "exit": "Exit guide", "stepIndicator": "Step {step} of {total}" },
  "contactSupport": "Still need help? Contact support",
  "replayWelcome": "Show the welcome tour again",
  "profileEntry": "How to use this app",
  "topics": {
    "findShoes": { "title": "Find shoes", "desc": "Browse and open a shoe" },
    "chooseSizeAddToBag": { "title": "Choose size & add to bag", "desc": "Pick a size and add it" }
    /* …one per tour… */
  },
  "firstLaunch": {
    "welcome": { "title": "…", "body": "…" },
    "tabs": { "title": "…", "body": "…" },
    "bag": { "title": "…", "body": "…" },
    "shop": { "title": "…", "body": "…" },
    "safetyNet": { "title": "…", "body": "…" },
    "done": { "title": "…", "body": "…" }
  },
  "steps": {
    "findShoes": { "s1": { "title": "…", "body": "…" } /* … */ }
    /* …per tour step copy… */
  }
}
```

Rules: no user-visible English hardcoded in TSX; keep key parity across en/zh-CN/ms; prefer reusing existing keys (`nav.*`, `settings.menu*`) where the same word already exists.

---

## 9. Coding constraints (repo + Stanley rules)

- TypeScript strict: **no `any`**, no non-null `!`, no `as unknown as T`. Define new types/interfaces as needed.
- Strings: double quotes; template literals / `.join()` over `+`.
- Full implementations — no placeholder stubs.
- JSDoc on exported functions/components (match existing style).
- Reuse `constants/theme.ts` tokens (`colors.accent` gold `#C9A96E`, `colors.text`, `colors.muted`, `colors.border`, etc.) and `lib/motion.ts` durations.
- Reuse `components/motion` (`PressableScale`) and `lib/haptics.ts` (e.g. `hapticLight` on advance, `hapticSuccess` on finish) — do not invent new haptic helpers unless there is a gap.
- Respect `useReducedMotion()` for overlay transitions.
- i18n parity across the three locales for every new string.
- Do **not** mount or modify `OnboardingOverlay`.
- Do **not** run `npm start` / `npm run build` (dev server usually already running).
- Do **not** commit / push / merge unless Stanley explicitly asks.
- Each agent ends with: `cd asf-customer-app && npx tsc --noEmit` (clean).

---

## 10. Implementation phases → agents

Sequential. See companion prompts for full per-agent context.

| Phase | Agent | Deliverable |
|-------|-------|-------------|
| 1 | Agent 1 | Coach-mark **engine**: `lib/appGuide.ts`, `components/guide/*` (context, overlay, anchor, tours scaffold, index), provider mounted, `guide.controls` i18n. No screen wiring yet beyond mount. |
| 2 | Agent 2 | **Hub page** `app/(tabs)/profile/guide.tsx` + promoted Profile menu row (signed-in + guest) + hub i18n + topic card list wired to `startTour`. |
| 3 | Agent 3 | **Anchors + shopping tours**: instrument tab bar / home / shop / PDP / cart; implement `findShoes`, `chooseSizeAddToBag`, `payCheckout` with cross-screen navigation; step i18n. |
| 4 | Agent 4 | **Account/help tours + first-launch guide**: implement `seeMyOrders`, `saveFavourites`, `changeLanguage`, `myShoes`, `rewards`, `askForHelp` (flag-gated) with anchors; build + trigger `firstLaunch` after home ceremony; step i18n. |

Sizing rationale (for a ~200k context model): Agent 1 is self-contained engine work; Agent 2 is one screen + one menu edit; Agents 3–4 are the larger cross-screen passes but each is bounded to a fixed anchor list and a fixed set of tours. If Agent 3 or 4 feels heavy, it may split shopping vs account further, but the anchors/tours are enumerated so context stays bounded.

---

## 11. Success criteria

- [ ] A permanent **"How to use this app"** hub exists in Profile (signed-in + at least the core topics for guest).
- [ ] Each hub topic launches a short coach-mark tour on the **real** screen and returns to the hub when done.
- [ ] First-launch guide runs **once** after the home ceremony for a new signed-in user; teaches tabs + bag; ends by revealing the hub.
- [ ] **Skip / Exit** is present on every step; skipping never disables the hub.
- [ ] Advance is tap-only; no auto-advance anywhere.
- [ ] Cross-screen tours navigate correctly and spotlight the right control (graceful center-card fallback if an anchor is missing).
- [ ] Feature-flagged topics only appear when their flag is on.
- [ ] Reduced motion: overlay is usable with instant transitions.
- [ ] All new copy present in en / zh-CN / ms with key parity; no hardcoded English in TSX.
- [ ] `npx tsc --noEmit` clean.
- [ ] `OnboardingOverlay` untouched; no commit/push/merge unless asked.

---

## 12. Manual test checklist

1. Fresh install → sign in → land Home → ceremony → first-launch guide appears; walk all steps; land on the hub; confirm it never re-appears on next cold start.
2. Fresh install → sign in → during first-launch guide press **Skip** at step 2 → guide closes, hub still reachable from Profile.
3. Profile → How to use this app → open **Find shoes** → verify navigation to Shop + spotlight + return to hub.
4. Open **Choose size & add to bag** → verify PDP size + Add to bag spotlights, bag badge updates conceptually, return to hub.
5. Open **Pay for your order** → verify bag/checkout spotlight and plain-language steps.
6. Open **See my orders** / **Change language** / **Ask for help** → correct screens spotlighted.
7. Turn a feature flag off (e.g. `claims`) → corresponding topic hidden; its tour not startable.
8. Toggle OS Reduce Motion → overlay transitions instant, still fully usable.
9. Switch locale to zh-CN and ms → all guide copy translated, no key warnings in dev.
10. Tech-savvy path: skip first-launch guide immediately → app fully usable, no nagging, hub available if wanted.

---

## 13. Out of scope (this program)

- Web (`asf-2-next`) parity.
- `asf-staff-app`.
- Wiring / redesigning `OnboardingOverlay`.
- New DB tables / migrations / analytics events for guide completion.
- Video tutorials or narrated audio.
- A true guest checkout path (tabs currently redirect unauthenticated users; fix separately if desired).

---

## 14. Related sources

- `asf-vault/raw/sources/2026-07-17-expo-customer-ceremony-motion-plan.md`
- `asf-vault/raw/sources/2026-07-16-expo-customer-home-revamp-plan.md`
- `asf-vault/raw/sources/2026-07-08-customer-i18n-plan.md`
- Wiki: `wiki/concepts/mobile-app-architecture-asf-2`, `wiki/concepts/expo-customer-ceremony-motion-asf-2`
- Code: `asf-customer-app/components/OnboardingOverlay.tsx`, `components/motion/*`, `lib/motion.ts`, `lib/haptics.ts`, `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/profile/index.tsx`, `app/(tabs)/browse/[productId].tsx`, `app/cart.tsx`
