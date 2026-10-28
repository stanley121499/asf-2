# Agent Prompts — Home Hero / Category Design Lab + Store Welcome (2026-09-28)

**Plan (read first):** `raw/sources/2026-09-28-expo-customer-home-hero-store-welcome-design-lab-plan.md`  
**App root:** `asf-customer-app/`  
**Model assumption:** ~200k context — each prompt is **one pass**. Do **not** merge passes.  
**Order:** Pass 1 → Pass 2 → Pass 3 (strict).

**Vault note:** Stanley explicitly requested this prompt pack for handoff (2026-09-28), despite an earlier mid-record that deleted unrelated `*agent-prompts*` dumps. Do not recreate other deleted prompt files.

**Global rules for every pass**
- Double quotes for strings; strict TypeScript; no `any`; no non-null assertion (`!`); no `as unknown as T`.
- Prefer string templates or `.join()` over `+` concatenation.
- JSDoc on new exported functions/modules; complete implementations (no placeholders).
- Do **not** reinstall `expo-task-manager`, do **not** enable nearby/push kill-switches.
- Do **not** edit `asf-2-next` customer Home in these passes.
- Do **not** change discovery-points ceremony.
- Prefer reading the plan + listed files over dumping entire theme Home trees into chat.
- When done: short summary of files changed + how Stanley/Simon verifies on device.

---

## How to use

1. Open a **fresh** agent chat (or clear context between passes if the same chat is getting long).
2. Paste **one** `PROMPT N` block below as the user message (include the fenced content).
3. After the agent finishes, smoke-check its verify steps before starting the next pass.
4. If a pass is incomplete, resume **that** pass only — do not start the next.

---

## PASS 1 — Design Preview infrastructure + Design Lab screen

> **Paste everything from “BEGIN PROMPT 1” through “END PROMPT 1”.**

```
BEGIN PROMPT 1

You are implementing Pass 1 of the ASF-2 Design Lab for Simon’s Home hero + store-welcome review.

## Read first (required)
1. Plan: `asf-vault/raw/sources/2026-09-28-expo-customer-home-hero-store-welcome-design-lab-plan.md` — especially §§3–6, success criteria 1 & 5.
2. Staff Appearance pattern (copy gate + redirect style):
   - `asf-customer-app/app/(tabs)/profile/appearance.tsx`
3. ProfileHub SUPERADMIN Appearance row (you will add a sibling Design Lab row in all four themes):
   - `asf-customer-app/themes/classic/screens/ProfileHub.tsx`
   - `asf-customer-app/themes/noir/screens/ProfileHub.tsx`
   - `asf-customer-app/themes/atelier/screens/ProfileHub.tsx`
   - `asf-customer-app/themes/storefront/screens/ProfileHub.tsx`
4. Theme persistence pattern for AsyncStorage naming style: `asf-customer-app/context/ThemeContext.tsx` (or wherever `asf_theme` is written).
5. Locale files used by `useTranslation` (find existing `settings.appearance*` keys and add sibling keys).

## Goal (Pass 1 only)
Ship the **switcher infrastructure** and staff UI. Do **not** implement Home layout variants A–D. Do **not** implement welcome popup variants 1–4 yet — but Design Lab must show the option lists and persist selections so Pass 2/3 can read them.

## Requirements

### Storage + API
- AsyncStorage keys (exact unless you document a rename in the summary):
  - `asf_design_preview_hero` → `"current" | "a" | "b" | "c" | "d"` (default `"current"`)
  - `asf_design_preview_welcome` → `"off" | "1" | "2" | "3" | "4"` (default `"off"`)
- Provide a small React context + hooks, e.g. `DesignPreviewProvider` + `useDesignPreview()`, with:
  - `heroVariant` / `setHeroVariant`
  - `welcomeVariant` / `setWelcomeVariant`
  - load on mount; persist on change
  - typed unions (no stringly magic outside the module)
- Mount the provider in the existing app root / providers tree (find `AppRoot` or equivalent) **without** breaking Theme/Auth order.

### Design Lab screen
- New route: `asf-customer-app/app/(tabs)/profile/design-lab.tsx`
- SUPERADMIN + signed-in only; same defense-in-depth redirect as Appearance for non-staff.
- UI sections:
  1. Home hero — radio-style cards for current / A / B / C / D with short English descriptions from the plan (§4.1). Use i18n keys (en/zh-CN/ms).
  2. Store welcome — radio cards for off / 1 / 2 / 3 / 4 with short descriptions from the plan (§4.2).
  3. Buttons:
     - “Preview welcome” — for Pass 1, show a simple `Alert` or temporary Text modal saying preview ships in Pass 3 (or a no-op stub that reads the selected welcome variant id). Do **not** build the four welcome UIs here.
     - Optional “Open Home” → `/(tabs)/` or theme home tab.
- Use existing chrome (`SubPageHeader`, theme tokens via `useThemeTokens`, `PressableScale` if Appearance does).

### ProfileHub entry
- Add a SUPERADMIN-only row **near Appearance** labeled via i18n (e.g. Design Lab) → `/(tabs)/profile/design-lab` in **all four** ProfileHub theme files.

### i18n
- Add keys for Design Lab title, subtitle, each option name + one-line description, preview button, stub message — for `en`, `zh-CN`, and `ms`.

## Explicit non-goals for Pass 1
- No changes to Storefront/Classic/Noir/Atelier `Home.tsx` layouts.
- No notification navigation changes.
- No kill-switch / TaskManager / nearby background location work.
- No Next.js edits.

## Done when
1. SUPERADMIN can open Profile → Design Lab, pick hero `b` and welcome `2`, kill app, reopen → selections persist.
2. Non-SUPERADMIN cannot open Design Lab (redirect).
3. Home looks unchanged (still `current`).
4. You list every file touched and the AsyncStorage key names.

END PROMPT 1
```

---

## PASS 2 — Home hero / category variants (Storefront only)

> **Paste everything from “BEGIN PROMPT 2” through “END PROMPT 2”.**  
> **Requires Pass 1 merged/available in the working tree.**

```
BEGIN PROMPT 2

You are implementing Pass 2 of the ASF-2 Design Lab: Home hero + category layout variants for Simon.

## Read first (required)
1. Plan: `asf-vault/raw/sources/2026-09-28-expo-customer-home-hero-store-welcome-design-lab-plan.md` — §4.1 options A–D, §3 locked decisions, success criteria 1–2.
2. Pass 1 output: `DesignPreview` context/hooks + storage keys (`asf_design_preview_hero`).
3. Current Storefront Home + category rail (primary wiring target):
   - `asf-customer-app/themes/storefront/screens/Home.tsx`
   - `asf-customer-app/components/storefront/StorefrontHomeCategoryRail.tsx`
4. Shared layout tokens (do not reintroduce Round 3 “short Frame 1 packing” as the only production path):
   - `asf-customer-app/lib/homeLayout.ts` (read header comments: Round 4 tall cover is current IA)
5. Mid-record Home notes (hero below chrome; category chevron): `asf-vault/raw/sources/2026-09-28-expo-customer-apk-crash-ui-polish-mid-record.md` §2

## Goal (Pass 2 only)
Implement hero/category variants **`current` | `a` | `b` | `c` | `d`** and wire them into **Storefront Home only**, driven by `useDesignPreview().heroVariant`.

Do **not** rewrite Classic / Noir / Atelier Homes in this pass (optional follow-up later).  
Do **not** implement store welcome popups (Pass 3).

## Variant behavior (must match plan)

| ID | Behavior |
|----|----------|
| `current` | Exact current Storefront Home behavior (baseline). Prefer: when variant is `current`, render the existing tree with minimal diff. |
| `a` | Full-bleed / maximal grandeur cover in the first viewport; category chips remain below the fold (refined styling OK). |
| `b` | Tall hero with **category chips overlaid** on the lower hero edge (readable contrast: glass/scrim). Selected chip state visible. |
| `c` | Grand hero at load; on scroll, collapse toward a thin media strip + **sticky** category bar. Sticky chips remain usable while body scrolls. |
| `d` | Selecting a category updates hero mood (crossfade/swap when a category image or representative product media exists; safe fallback to current cover). Strong selected chip; optional small product peek for that category under hero — keep performant. |

## Architecture constraints
- Prefer shared components under e.g. `asf-customer-app/components/designPreview/home/` rather than four full copies of Storefront Home.
- Reuse existing data hooks (products, categories, posts, promos) — do not add new APIs.
- Category tap may navigate to Shop/browse as today for `current`/`a`; for `b`/`d` soft-select on Home is OK for preview (document behavior in summary).
- Respect safe areas, in-flow/header chrome, and tab bar — no content permanently hidden under chrome.
- Keep Home≠Shop product caps / existing performance habits (no accidental full-catalog FlatList explosions).
- Motion: intentional, light; respect any existing reduced-motion helpers if present.

## Explicit non-goals
- Design Lab screen redesign (already Pass 1).
- Welcome popup / notification deep links.
- Enabling nearby/push / TaskManager.
- Next.js Home.
- Registering new theme packs in `themes/registry.ts`.

## Done when
1. Design Lab → set hero `a`/`b`/`c`/`d` → open Storefront Home (switch theme to Storefront if needed via Appearance) → layout matches the variant descriptions.
2. `current` matches pre-Pass-2 Storefront Home for non-staff / default.
3. No TypeScript errors in touched files; no `any` / `!` / `as unknown as T`.
4. Summary: files changed + how to flip variants for Simon + any intentional tap-behavior differences per variant.

END PROMPT 2
```

---

## PASS 3 — Store welcome popup variants + notification tap + Design Lab preview

> **Paste everything from “BEGIN PROMPT 3” through “END PROMPT 3”.**  
> **Requires Pass 1 (and ideally Pass 2) in the working tree.**

```
BEGIN PROMPT 3

You are implementing Pass 3 of the ASF-2 Design Lab: Welcome-to-store popup variants and notification tap wiring.

## Read first (required)
1. Plan: `asf-vault/raw/sources/2026-09-28-expo-customer-home-hero-store-welcome-design-lab-plan.md` — §4.2, §4.3 flow, success criteria 3–6, contradiction note (§10).
2. Pass 1: `useDesignPreview()` welcome variant + Design Lab “Preview welcome” stub to replace.
3. Notification navigation + tap handlers:
   - `asf-customer-app/lib/notificationNavigation.ts`
   - `asf-customer-app/components/PushTokenRegistrar.tsx`
   - `asf-customer-app/app/(tabs)/profile/notifications.tsx`
   - `asf-customer-app/components/NotificationRow.tsx`
4. Nearby notification metadata shape (product_id, store_location_id, deep_link `product:…`) — see plan + `asf-2-next/src/app/api/_lib/customerNotifications.ts` / matcher only if needed for field names.
5. Ceremony / modal patterns to reuse (do not invent a fifth system):
   - `asf-customer-app/components/motion/AchievementCeremony.tsx`
   - Any bottom-sheet / Modal patterns already in the Expo app
6. Stores / maps:
   - `asf-customer-app/lib/openStoreMaps.ts`
   - Locations tab / `StoreLocationContext`
7. Kill-switch reminder: `asf-customer-app/lib/nearbyStockAlerts.ts`, `lib/pushNotificationsEnabled.ts` — leave OFF; preview must work without them.

## Goal (Pass 3 only)
1. Implement welcome UI variants **`1` | `2` | `3` | `4`** per plan §4.2.
2. Host that can present welcome from:
   - Design Lab **Preview welcome** (demo Mid Valley + sample product — fake payload OK)
   - Inbox / push tap when notification is nearby wishlist stock **and** `welcomeVariant !== "off"`
3. When `welcomeVariant === "off"` (default): keep today’s behavior (navigate to PDP via existing `resolveNotificationHref`).

## Welcome content (all variants)
- Headline: Welcome to **Mid Valley** (mall short name; i18n)
- Supporting: invite to look around the store (i18n)
- Optional product thumb + product name when `product_id` resolveable from contexts/API cache; graceful empty state if missing
- CTAs:
  - Primary-ish: **View item** → `/(tabs)/browse/{productId}` when id present; disable/hide if missing in demo only if unavoidable — prefer always enabling with a seeded demo product id if contexts empty
  - Secondary: **Explore store** → Locations tab and/or `openStoreMaps` for Mid Valley / matched `store_location_id`
- Dismiss: close popup without forcing navigation

## Variant mapping
| ID | UI |
|----|----|
| `1` | Center card + dimmed backdrop |
| `2` | Bottom sheet slide-up |
| `3` | Edge / top arrival banner (ceremony-like, not weak bag tray) |
| `4` | Near-full-screen welcome moment |

## Notification wiring
- Detect nearby wishlist stock via notification `type` and/or metadata (`store_location_id` + `product_id` / existing nearby fields). Inspect real metadata writers before inventing new fields.
- Prefer a single welcome host mounted high in the tree (e.g. near AppRoot) listening to a small event/queue, OR navigate to a route that immediately presents the modal — pick one approach and keep it simple.
- Do **not** require background location or push registration for Design Lab preview.
- Do **not** INSERT client-side into `notifications` unless a demo seed already exists; Design Lab preview must work offline of inbox.

## Design Lab
- Replace Pass 1 stub: **Preview welcome** opens the selected variant with Mid Valley demo payload.
- If welcome is `off`, Preview can temporarily show variant `1` for QA **or** prompt the user to pick 1–4 — pick one UX and document it.

## Explicit non-goals
- Changing Home hero variants (Pass 2).
- Enabling nearby/push env flags or reinstalling TaskManager.
- Geofence “entered mall” without notification.
- Next.js web.
- Changing server matcher radius/cooldown.

## Done when
1. Design Lab → set welcome `1`–`4` → Preview welcome shows correct layout with Mid Valley copy.
2. With welcome `off`, inbox tap on a product deep link still goes to PDP with no popup.
3. With welcome `2` (example), tapping a nearby-stock inbox row (if a demo row exists) shows the sheet; CTAs work.
4. i18n for welcome strings in en / zh-CN / ms.
5. Summary: files changed, how Simon demos Preview without GPS, and exact tap order (popup vs PDP).

END PROMPT 3
```

---

## Optional PASS 2b — Other theme Homes (only if Simon needs it)

Not required for the first Simon review if Appearance → Storefront is enough.

```
BEGIN PROMPT 2b (OPTIONAL)

Wire the same `heroVariant` from `useDesignPreview()` into Classic and/or Noir and/or Atelier Home screens by reusing Pass 2 shared components under `components/designPreview/home/`.

Do not invent theme-specific fourth copies of A–D unless a shared shell cannot respect that theme’s chrome (in-flow header, tokens). Prefer adapters.

Read: plan §3 decision 6; `lib/homeLayout.ts`; each theme’s `themes/*/screens/Home.tsx`.

Non-goals: welcome popups, Design Lab redesign, TaskManager.

Done when: flipping hero variant in Design Lab changes Home for each wired theme, with `current` preserving prior look.

END PROMPT 2b
```

---

## Verify checklist (Stanley / Simon)

After all passes:

1. Appearance → **Storefront** theme.  
2. Profile → **Design Lab** (SUPERADMIN).  
3. Hero A → Home; then B; then C; then D; then **current**.  
4. Welcome 1–4 → **Preview welcome** each time.  
5. Confirm cold start still safe (no TaskManager reintroduced; nearby/push still OFF).  
6. Simon picks winners → **later** follow-up task to collapse Design Lab defaults into production (not in these prompts).
