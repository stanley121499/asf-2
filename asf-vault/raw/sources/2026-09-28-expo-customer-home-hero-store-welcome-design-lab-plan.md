# Expo Customer — Home Hero / Category Design Lab + Store Welcome Popup (2026-09-28)

**Project**: ASF-2 — primarily `asf-customer-app/` (Expo)  
**Date**: 2026-09-28  
**Status**: Design-preview phase — **do not pick a production winner yet**; ship switchable variants for Simon to review on device  
**Stakeholder**: Stanley (product) + Simon (design review)  
**Companion prompts**: `raw/sources/2026-09-28-expo-customer-home-hero-store-welcome-design-lab-agent-prompts.md`

**Related (read, do not re-litigate unless noted):**
- Home layout Round 4 (tall cover) — `asf-customer-app/lib/homeLayout.ts`
- Mid-record (crash / kill-switches / current Home chrome) — `raw/sources/2026-09-28-expo-customer-apk-crash-ui-polish-mid-record.md`
- Nearby wishlist stock (Feature B) — `raw/sources/2026-09-08-expo-customer-engagement-discovery-points-nearby-stock-plan.md`
- Ceremony / 仪式感 — wiki `wiki/concepts/expo-customer-ceremony-motion-asf-2.md`
- Theme skins + staff Appearance — wiki `wiki/concepts/expo-customer-theme-skins-asf-2.md`
- Store locations (Mid Valley etc.) — wiki `wiki/concepts/store-locations-feature-asf-2.md`

**Note on vault policy:** An earlier 2026-09-28 mid-record said vault-wide `*agent-prompts*` were deleted on purpose. **Stanley explicitly requested a new prompt pack for this workstream** the same day — the companion prompts file is intentional for handoff only. Do not revive unrelated deleted prompt dumps.

---

## 1. What we are doing

Two **design-review** workstreams, both delivered as **in-app switchable variants** (staff-only Design Lab), not as a single committed production UI yet.

### Workstream A — Home hero grandeur + category bar

Simon: shrinking / packing the hero made the first viewport feel **less grand**. We also want **more designed** category selection on Home (not only plain chips).

**Deliverable:** 4 hero + category layout options (A–D) that a SUPERADMIN can flip in **Design Lab** and immediately see on Home.

### Workstream B — Nearby-stock notification → Welcome to store popup

When a user is near a store that has a **wishlisted product in stock**, they already can get push + inbox (“In stock nearby”). Simon wants the **tap** experience to open a **Welcome to ____** popup (e.g. Mid Valley), inviting them to look around — not only dump them on the PDP.

**Deliverable:** 4 welcome-popup visual options (1–4), a Design Lab **Preview welcome** button (works even when nearby/push kill-switches are OFF), and wiring so a real nearby-stock notification tap opens the chosen popup.

---

## 2. Why (current vs desired)

| Area | Today (verified ~2026-09-28) | Desired for Simon review |
|------|------------------------------|---------------------------|
| Home Frame 1 | Round 4 = tall cover ≈ full usable height below in-flow chrome; Round 3 short Frame 1 was reverted as “killed the focal point” | Still need **explicit design options** Simon can compare (grandeur + category composition), switchable live |
| Category on Home | Theme-specific rails/chips; Storefront has category rail + chevron toggle; selection often navigates to Shop | More intentional selected / compositional designs in options B–D |
| Nearby Feature B | Server match 1.5 km → push + inbox; tap → **product PDP** via `product:{uuid}`; `store_location_id` stored but unused on nav | Tap → **Welcome popup** first, then optional product / explore CTAs |
| Nearby ceremony (Sep 8 plan) | Locked: **no in-app ceremony** for nearby | **Revised for this workstream:** welcome popup on notification tap is **in scope** (Simon request). Do not re-open discovery-points ceremony. |
| Kill-switches | Nearby + push default OFF; `expo-task-manager` must stay out of APK | Preview must **not** require enabling nearby/TaskManager. Design Lab preview uses fake Mid Valley payload. |

---

## 3. Locked decisions (Stanley 2026-09-28 chat)

| # | Decision |
|---|----------|
| 1 | **No production winner yet** — implement variants + switcher for Simon to choose |
| 2 | Switching = **in-app Design Lab** (staff-only), not separate EAS builds per option |
| 3 | Gate like Appearance: **`user_details.role === "SUPERADMIN"`** only |
| 4 | Defaults = **current production** layout / current PDP-only tap until staff picks a preview variant |
| 5 | Primary surface = **Expo** `asf-customer-app`. Next.js `HomePageClient` **out of scope** for this pass |
| 6 | First Home wiring theme = **Storefront** (demo skin). Classic / Noir / Atelier = follow-up prompt only if needed after Simon reviews Storefront |
| 7 | Welcome preview uses **Model Match Mid Valley** / mall short name **Mid Valley** + a sample wishlist product thumb |
| 8 | Coding standards: double quotes; strict TS; no `any`; no `!`; no `as unknown as T`; JSDoc on new modules; full implementations (no placeholders) |
| 9 | Do **not** reinstall `expo-task-manager` or flip nearby/push kill-switches for this work |
| 10 | i18n: add `en` / `zh-CN` / `ms` keys for Design Lab + welcome copy |

### Open for Simon (do not hard-lock in code beyond defaults)

| Question | Default while previewing |
|----------|---------------------------|
| Welcome primary CTA | Dual CTAs: **View item** + **Explore store** (Locations tab or store maps) |
| Copy: “Mid Valley” vs “Model Match Mid Valley” | Display mall short name in headline; store full name secondary if space |
| Welcome also on cold open inside radius (no notification)? | **Out of scope** this pass — notification tap + Design Lab preview only |
| Category tap: navigate vs filter-in-place | Per variant: A navigate (current); B–D may soft-highlight / mood-swap without requiring full Shop navigation for preview |

---

## 4. Design options to implement

### 4.1 Home hero + category (Workstream A)

| ID | Name | Hero | Category bar | Intent |
|----|------|------|--------------|--------|
| **current** | Production | Keep today’s Storefront Home Frame 1 + category rail behavior | Unchanged | Baseline |
| **A** | Full-bleed restored | Maximize cover grandeur (full usable height feel; caption/CTA only in first viewport) | Categories stay **below** fold (refined pills, no active required) | “Grand again,” editorial lookbook |
| **B** | Hero + categories one plane | Tall hero (~75–90% usable); **category chips overlaid** on lower hero edge (glass / thin underlay) | Chips part of hero; selected state visible | Immersive; category = hero chrome |
| **C** | Compact sticky after scroll | Grand hero at load; on scroll, collapse to thin media strip + **sticky** category bar | Sticky active chips while browsing body | Grand entry + practical browse |
| **D** | Category as visual switch | Hero media **crossfades** (or swaps) by selected category mood image when available; else keep cover | Strong selected chip; optional peek of that category’s products under hero | Designed selection, still grand |

**Implementation note:** Variants may share data hooks; UI must be separable components under something like `components/designPreview/home/` so Design Lab can switch without four full Home.tsx forks.

### 4.2 Store welcome popup (Workstream B)

| ID | Name | Pattern | Content |
|----|------|---------|---------|
| **1** | Center welcome card | Dimmed backdrop + centered card | “Welcome to Mid Valley” + invite + product thumb + View item / Explore store |
| **2** | Bottom sheet | Slide-up sheet | Same content; lighter / mobile-native |
| **3** | Edge arrival banner | Top/corner ceremony strip (akin to achievement banner, stronger copy) | Short welcome + wishlist cue + one primary CTA |
| **4** | Full welcome moment | Near-full-screen with store mood / solid brand plate | Strong welcome + Look around + secondary Go to product |

Reuse patterns where useful: `AchievementCeremony`, announcement/bottom sheets, store picker modal, `AlertBanner` — do **not** copy bag-tray weakness for option 4.

### 4.3 Shared notification → popup flow

```
OS push or inbox tap
  → app opens / focuses
  → if type is wishlist_nearby_stock (or metadata has store_location_id + product_id from nearby)
  → show Welcome popup (selected Design Lab variant, default 1 for staff preview / or current=skip popup until staff sets welcome variant)
  → CTAs: View item → PDP; Explore store → Locations (or maps helper); dismiss → stay on current screen / Home
```

**Important:** Non-staff / default welcome variant `off` keeps today’s PDP deep link (no popup) so production behavior stays stable until Simon picks.

Suggested storage keys (names flexible if documented):
- `asf_design_preview_hero` → `current` | `a` | `b` | `c` | `d`
- `asf_design_preview_welcome` → `off` | `1` | `2` | `3` | `4`

---

## 5. Design Lab (how Simon switches)

**Route:** `/(tabs)/profile/design-lab` (name OK if consistent)  
**Entry:** ProfileHub row next to Appearance — **SUPERADMIN only** (all four theme ProfileHubs).  
**Screen contents:**
1. Section **Home hero** — radio cards for current / A / B / C / D (short description each)
2. Section **Store welcome** — radio cards for off / 1 / 2 / 3 / 4
3. Button **Preview welcome** — presents selected welcome UI with Mid Valley demo payload (no GPS)
4. Optional: **Open Home** shortcut
5. Persist immediately to AsyncStorage (like `asf_theme`)

Non-SUPERADMIN deep link → `router.replace` to Profile (same as Appearance).

---

## 6. File map (expected touch points)

### New (suggested)
- `asf-customer-app/context/DesignPreviewContext.tsx` (or `lib/designPreview.ts` + thin context)
- `asf-customer-app/app/(tabs)/profile/design-lab.tsx`
- `asf-customer-app/components/designPreview/home/*` (variant shells)
- `asf-customer-app/components/designPreview/StoreWelcome*.tsx` (variants 1–4 + host)
- i18n locale JSON keys under existing locale files

### Existing (wire / extend)
- `themes/storefront/screens/Home.tsx` — read hero variant; render switch
- `themes/*/screens/ProfileHub.tsx` (×4) — Design Lab row
- `lib/notificationNavigation.ts` — nearby path may return a “show welcome” signal **or** navigate Home/browse with query params the welcome host reads
- `components/PushTokenRegistrar.tsx` + `app/(tabs)/profile/notifications.tsx` — ensure tap path invokes welcome when variant ≠ `off`
- `lib/openStoreMaps.ts` / Locations tab — Explore store CTA
- Store seed names: Mid Valley → `Model Match Mid Valley` (`store_locations`)

### Do not touch for this pass
- Re-enable nearby/push env flags
- `expo-task-manager` / background location packages
- Next.js customer Home
- Discovery points ceremony
- Admin stock UIs / cron matcher (already exist)

---

## 7. Success criteria

1. SUPERADMIN opens Design Lab, picks hero **B**, opens Home → sees overlay category chips without rebuild.
2. Flip to **A** / **C** / **D** → Home updates after navigation/focus (acceptable: remount on tab focus).
3. Design Lab → Preview welcome with Mid Valley → shows selected variant; CTAs work with demo ids or graceful fallbacks.
4. With welcome ≠ `off`, tapping a nearby-stock **inbox** row (demo seed OK) shows popup before/instead of bare PDP — document exact order in PR notes.
5. Non-staff users never see Design Lab; defaults leave Home + notification tap unchanged.
6. No TaskManager / kill-switch changes; APK cold-start safety preserved.
7. `en` / `zh-CN` / `ms` strings present for new UI.

---

## 8. Agent pass sizing

| Pass | Scope | Why this size |
|------|-------|----------------|
| **1** | DesignPreview store + Design Lab screen + ProfileHub entries + i18n shell | Infrastructure only — small enough to finish cleanly |
| **2** | Home variants A–D + wire **Storefront** Home | One theme’s Home is large; do not also rewrite Classic/Noir/Atelier here |
| **3** | Welcome variants 1–4 + notification tap + Preview button | Separate ceremony surface; needs nav + modal focus |

Optional later (only if Simon needs other themes): Pass **2b** — Classic/Noir/Atelier Home wiring to same shared variant components.

**Companion prompts file** has copy-paste prompts for Pass 1–3. Run **in order**.

---

## 9. Out of scope / explicit non-goals

- Shipping Simon’s final pick as the only Home (that’s a follow-up after he chooses)
- Client-side geofence enter events without notification
- Web (`asf-2-next`) Home redesign
- Changing nearby radius / cooldown / matcher SQL
- New theme packs in `themes/registry.ts` for these options (variants ≠ themes)

---

## 10. Contradiction note

Sep 8 Feature B: “nearby = normal notification, **no in-app ceremony**.”  
This plan **overrides that one UX decision** for notification-tap welcome only, pending Simon’s choice. Server matching, radius, cooldown, and kill-switches stay as today.
