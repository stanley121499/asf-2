# Expo Customer App — Theme Skins Intentional Polish Pass (2026-07-27)

**Project**: ASF-2 Expo customer app (`asf-customer-app/`)  
**Date**: July 27, 2026  
**Status**: Approved for implementation (awaiting agent passes)  
**Stakeholder**: Stanley  
**Companion prompts**: deleted after execution (see session SOT [`2026-07-28-expo-customer-theme-skins-session-accomplishment.md`](2026-07-28-expo-customer-theme-skins-session-accomplishment.md))  

**Supersedes / corrects (for product rules):**
- Customer-facing Appearance from [`2026-07-27-expo-customer-theme-skins-plan.md`](2026-07-27-expo-customer-theme-skins-plan.md) — **wrong**. Themes are **staff/SUPERADMIN QA only** for now.
- V1 agent shipping left Atelier Home strong but Shop/filters/FAB/secondary surfaces weak; Noir mostly Classic-darkened.

**Builds on (keep working):**
- Theme foundation already shipped: `context/ThemeContext.tsx`, `themes/*`, registry, thin routes, Tier B `useThemeTokens()`, cart chromes
- Ceremony / App Guide — do not rip out; missing anchors no-op
- Prior plan architecture (packs, Tier A/B) remains valid

---

## 1. What we are doing

A **design-intent polish pass** on the three existing theme packs so each feels **intentionally designed**, not “Classic + CSS.”

Goals:

1. **Access model** — only `SUPERADMIN` can switch themes; remove duplicate staff controls; normals never see Appearance.
2. **Lock a design brief per theme** (this doc §4) so agents implement rules, not vibes.
3. **Atelier** — keep Home’s editorial win; fix FAB; redesign Shop filters; raise Shop/PDP/Highlights/Profile to Home’s bar.
4. **Noir** — **rebuild structure** (not recolor). Same dark tokens OK; Home/Shop/filter IA must stop mirroring Classic.
5. **Classic** — leave as customer default boutique baseline; minimal touch (gating only + any broken chrome).

**Not doing in this pass:**
- 4th theme (only after three pass a 10s “different app” test)
- Customer-facing theme picker
- Web / staff-app parity
- New DB tables
- Triple redesign of Tier B (orders/auth/checkout) — tokens already swept; leave unless broken

---

## 2. Why (Stanley QA feedback)

| Feedback | Diagnosis |
|----------|-----------|
| Other themes feel slapped together | Agents shipped trees without a surface-by-surface design contract |
| Atelier Home feels intentional | Keep — raise other Atelier surfaces to that standard |
| Atelier FAB misaligned | Craft bug in `themes/atelier/CartChrome.tsx` / `CartButton` sizing |
| Shop filters feel the same | Same IA (sort row + category row); Atelier text-links / Noir dark pills ≠ different interaction model |
| Profile → theme | Appearance was shipped for **all** signed-in users; too prominent |
| Appearance + Theme (staff) both exist | Duplicate; consolidate into **one SUPERADMIN-only** control |
| Noir feels like removed bits + CSS | Home/Shop still Classic section stack / 2-col + double filters, only darkened |

---

## 3. Locked decisions

| # | Question | Decision |
|---|----------|----------|
| 1 | Who can switch themes? | **`user_detail.role === "SUPERADMIN"` only** |
| 2 | Customer Appearance? | **Remove from normal Profile hubs.** No theme UI for customers in this pass |
| 3 | Staff UX | **One** entry: Profile → **Appearance** (or rename label to “Theme (staff)”) — gated SUPERADMIN. **Delete** the separate “Theme (staff)” cycle row (or fold cycle into Appearance as optional shortcut on that page only) |
| 4 | Default theme | **`classic`** for everyone; persist `asf_theme` still works for staff |
| 5 | Theme count | Stay at **3** (`classic`, `atelier`, `noir`). No 4th until these three feel intentional |
| 6 | Classic scope | **Baseline — do not redesign.** Only gating / regression fixes |
| 7 | Atelier scope | **Polish + filter redesign + secondary parity** with Home editorial language |
| 8 | Noir scope | **Structural rebuild** of Home + Shop (+ filters). Tokens may stay; layouts must not be Classic-painted-black |
| 9 | Screenshots | Optional later; agents work from **this brief + code**. Stanley may paste shots later for follow-up |
| 10 | Coding standards | Double quotes; strict TS; no `any`; no `!`; no `as unknown as T`; JSDoc on new exports |
| 11 | No npm start / no commit | Unless Stanley asks |

---

## 4. Design briefs (source of truth for agents)

### 4.1 Classic — “Boutique catalog” (customer default)

**Person:** Knows what they want / trusts the shop.  
**Job:** Efficient browse → bag → pay.

**Colors (intentional — brand lock):**
- Ground `#FFFFFF`, panel `#F5F5F3`, accent gold `#C9A96E`, text `#0A0A0A`
- Do not re-palette Classic in this pass

**Layout laws:**
- Home: tall hero + horizontal strips (current)
- Shop: twin CategoryPill rows + 2-col grid (current) — **this IA is Classic’s identity**
- PDP: 1:1 + sticky black Add (current)
- Cart: header bag
- Profile: card stack

**Do / Don’t:**
- Do: keep ceremony + guide anchors
- Don’t: invent new Classic layouts in this pass

---

### 4.2 Atelier — “Editorial lookbook”

**Person:** Wants magazine inspiration first.  
**Job:** Slow looking; commerce secondary.

**Colors (intentional — keep):**
- Paper ground `#F6F1E8`, panel `#EDE6DA`, quiet brown accent `#8B7355`, warm ink `#2C2416`
- Not Classic gold-on-white; paper/brown supports lookbook

**Home (already good — protect):**
- Slim intro, **not** tall hero CTA
- Large single product/post **chapters**
- Slim “Shop the edit” row
- Categories as **text index** (not pill cluster)
- Search in minimal chrome; **no header bag**

**Shop (must change filters):**
- Keep single-column lookbook cards
- **Do not** use twin sticky filter strips (even as text links)
- **One** calm control: e.g. “Filter & sort” text button → **bottom sheet** (or full-screen quiet list) with sort + categories
- Default view = almost unfiltered lookbook scroll

**PDP:**
- Tall portrait gallery + quiet Add — tighten spacing/type to match Home paper language
- Reserve bottom padding so FAB doesn’t cover Add; **or** hide FAB while PDP sticky CTA is visible (pick one rule and apply consistently)

**FAB cart:**
- Optical align above tab bar (safe area + tab `minHeight`)
- Single clear size; don’t double-wrap oversized `CartButton`
- Never cover primary CTAs; never sit on tab icons

**Highlights / ProfileHub:**
- Same paper + editorial header language as Home (not Classic cards painted paper)

**Do / Don’t:**
- Do: raise every Atelier surface to Home’s intentionality
- Don’t: leave Shop looking like Classic with underline links

---

### 4.3 Noir — “Night commerce feed” (rebuild, not recolor)

**Person:** Wants a dense, fast, dark shopping **app** — not boutique landing at night.  
**Job:** Scan → tap → buy with minimal chrome.

**Colors (keep tokens, use with discipline):**
- Ground `#0A0A0A`, panel `#161616`, text `#F2F2F0`, accent `#B89A6A`
- **Accent sparingly** — primary CTAs / selected states only, not every Classic-gold moment

**Home (structural rebuild required):**
- **Stop** stacking Classic sections (offers strip clone + arrivals clone + pills + posts) in dark paint
- Prefer one clear primary: e.g. **vertical product-forward stream** or a single dense “For you” feed with inline price, plus **at most one** secondary strip (offers **or** posts — not both mirroring Classic)
- Compact top bar (brand + search + bag) stays
- Every block needs a one-line reason; cut decorative clones

**Shop (structural + filter rebuild):**
- Dense grid **or** price-forward list — pick one and commit
- Filters: **not** Classic double pill highway
  - Prefer: one filter icon / “Filter” control → sheet, **or** a single compact segmented row (Sort | Category) opening sheets
- Header bag consistent with other Noir headers

**PDP:**
- Keep immersive dark media + strong sticky Add (closest to intentional today)
- Tighten; ensure header bag doesn’t fight floating controls

**Highlights / Profile:**
- Media-first dark feed; Profile = dense settings list (already closer — polish only)

**Do / Don’t:**
- Do: change information architecture so 10s on Home/Shop ≠ “Classic but black”
- Don’t: only swap `colors.*` / tokens and call it done

---

## 5. Current code map (agents start here)

| Area | Paths |
|------|--------|
| Theme context / registry | `context/ThemeContext.tsx`, `themes/registry.ts`, `themes/types.ts` |
| Classic | `themes/classic/**` |
| Atelier | `themes/atelier/**` (Home strong; `CartChrome.tsx` FAB; Shop text-link filters) |
| Noir | `themes/noir/**` (Home dense rails; Shop dark pills) |
| Appearance | `app/(tabs)/profile/appearance.tsx` |
| Profile hubs | `themes/*/screens/ProfileHub.tsx` — Appearance row + Theme (staff) cycle |
| Shared cart | `components/cart/CartButton.tsx`, `CartChromeHost.tsx` |
| Thin routes | `app/(tabs)/index.tsx`, `browse/*`, `highlights.tsx`, `profile/index.tsx` |

---

## 6. Agent phases (sized for ~200k)

See companion prompts. Summary:

| Agent | Delivers | Depends on |
|-------|----------|------------|
| **1** | SUPERADMIN-only theme access; remove duplicate staff cycle; normals have no Appearance | — |
| **2** | Atelier FAB craft + Shop filter sheet redesign | Agent 1 optional (can parallel) |
| **3** | Atelier PDP / Highlights / ProfileHub editorial parity with Home | Agent 2 preferred (FAB/PDP rule settled) |
| **4** | Noir Home structural rebuild | Agent 1 optional |
| **5** | Noir Shop + filters rebuild (+ light PDP tighten) | Agent 4 preferred |

**Parallelism:** After plan read, **1 ∥ 2 ∥ 4** possible if careful on ProfileHub files; safer serial **1 → 2 → 3 → 4 → 5**.  
**Suggested serial:** 1 → 2 → 3 → 4 → 5.

---

## 7. Acceptance criteria

1. Non-SUPERADMIN Profile has **no** Appearance / theme controls.
2. SUPERADMIN has **exactly one** theme entry point (Appearance page); no redundant cycle row on hub (unless inside Appearance only).
3. Atelier Home still feels editorial; FAB optically aligned; Shop uses **one** filter entry → sheet (not twin strips).
4. Atelier Highlights / Profile / PDP feel like the same lookbook as Home.
5. Noir Home/Shop fail the “is this Classic black?” test — structure differs.
6. Classic still default boutique; buy paths work on all themes.
7. Guide anchors / ceremony not broken on Classic; other themes no-op missing anchors.
8. `tsc --noEmit` clean; no npm start / no commit unless asked.

---

## 8. Later (explicitly out)

- 4th theme (Studio/Utility/etc.)
- Customer-facing Appearance soft launch
- Screenshot-driven micro-polish round (Stanley may paste page shots)
- Syncing `asf_theme` to Supabase
