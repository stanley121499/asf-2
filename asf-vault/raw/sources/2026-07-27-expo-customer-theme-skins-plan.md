# Expo Customer App — Multi-Theme Layout Skins Plan (2026-07-27)

**Project**: ASF-2 Expo customer app (`asf-customer-app/`)  
**Date**: July 27, 2026  
**Status**: Approved for implementation (awaiting agent passes)  
**Stakeholder**: Stanley  
**Companion prompts**: deleted after execution (see session SOT [`2026-07-28-expo-customer-theme-skins-session-accomplishment.md`](2026-07-28-expo-customer-theme-skins-session-accomplishment.md))  
**Builds on / must respect**:
- Ceremony & motion — `2026-07-17-expo-customer-ceremony-motion-plan.md`, `lib/motion.ts`, `components/motion/*`
- Beginner App Guide — `2026-07-17-expo-customer-beginner-guide-plan.md`, `components/guide/*`
- Home revamp — `2026-07-16-expo-customer-home-revamp-plan.md`
- Current tokens — `asf-customer-app/constants/theme.ts`
- Locale persistence pattern — `asf-customer-app/context/LocaleContext.tsx` (`AsyncStorage` key `asf_locale`)
- Auth / roles — `asf-customer-app/context/AuthContext.tsx` (`user_detail.role`)

---

## 1. What we are building

A **multi-theme skin system** for the Expo customer app so customers can choose how the app *looks and is laid out* — not just a color palette swap.

Each theme is a **full skin pack** that covers the **whole customer app chrome**, not only Home:

1. **App chrome** — bottom **tab bar**, top headers / navbars, `SubPageHeader`, status bar, cart entry chrome
2. **Primary layouts** — Home, Shop list, **product inner (PDP)**, Highlights/posts, Profile hub, Locations
3. **Secondary surfaces** — cart / wishlist sheets, profile subpages, auth, checkout (see §3.1 tier matrix — some are full layout skins, some are token shells so Noir never shows a white Classic island)
4. **Visual tokens** — colors, panels, borders, overlays, optional typography emphasis

Customers pick a theme in Profile (Appearance). During development, a **SUPERADMIN-only** theme switcher unlocks early QA before the customer picker ships (or alongside it).

**Target app only**: `asf-customer-app/`  
**Out of scope**:
- `asf-2-next` web parity (unless a later program asks for it)
- `asf-staff-app`
- New Supabase migrations / new role tables (reuse existing `user_details.role`)
- Three fully redesigned Stripe checkout *flows* (keep flow; **do** token-shell so pages aren’t broken in Noir)
- Changing cart *data* model (`CartContext` / `add_to_carts`) — shared across all themes
- Guide coach-mark *engine* rewrite (anchors must keep working; missing anchors no-op)

---

## 2. Why

| Today | Problem |
|-------|---------|
| Single static light palette in `constants/theme.ts` | No customer choice; app always feels the same |
| Home bag icon only | Cart not reachable from Shop / Highlights / Profile without hunting |
| “Theme” often means dark mode colors | Stanley wants **radically different layouts** so choice is meaningful |

**Core outcome:** switching themes should make the app — including **tab bar, headers, product inner, profile, and bag chrome** — feel like a **different app personality** within ~10 seconds, while shopping data and routes stay the same.

---

## 3. Locked decisions

| # | Question | Decision |
|---|----------|----------|
| 1 | Theme count (v1) | **Exactly 3**: `classic`, `atelier`, `noir` |
| 2 | What a theme changes | **Layout + tokens + app chrome + cart chrome** (not colors alone) |
| 3 | Nav bar included? | **Yes — both.** (A) **Bottom tab bar** in `(tabs)/_layout.tsx` is theme-aware (colors + optional density/label treatment per theme). (B) **Top navbars / headers** (Home overlay nav, Shop sticky header, `SubPageHeader`, Profile sticky header) are theme-aware and participate in cart-chrome rules |
| 4 | Product inner included? | **Yes.** PDP (`browse/[productId].tsx`) is a **Tier A full layout skin** per theme — not a token-only leftover |
| 5 | Profile included? | **Yes.** Profile **hub** is Tier A (layout may differ per theme). Profile **subpages** are at least Tier B token shells (readable in Noir); optional light layout tweaks OK, full triple redesign of every subpage is not required in v1 |
| 6 | Shared vs skinned | **Shared logic**: CartContext, WishlistContext, checkout *flow*, feature flags, i18n plumbing, guide engine, auth session. **Skinned presentation**: screens + chrome listed in §3.1 |
| 7 | Cart options | **One cart-chrome style per theme** (all three options exist, each owned by a theme) |
| 8 | Dev unlock | **`user_detail.role === "SUPERADMIN"`** only (from `user_details`, already loaded in `AuthContext`). Do **not** use `feature_flags` for this gate |
| 9 | Customer unlock | Profile **Appearance** picker (all signed-in customers). SUPERADMIN may keep a fast cycle control |
| 10 | Persistence | `AsyncStorage` key **`asf_theme`**, same hydrate/write pattern as locale |
| 11 | Default theme | **`classic`** (current boutique landing) |
| 12 | Auth / checkout | **Tier B token shell** in v1 (same structure; must not stay stuck on Classic white when Noir is active) |
| 13 | NativeWind | StyleSheet + token hooks first. No full NativeWind theme rewrite required in v1 |
| 14 | Reduced motion | Keep existing ceremony/guide reduced-motion behavior |
| 15 | i18n | All new user-facing theme names/descriptions in **en / zh-CN / ms** |
| 16 | Coding standards | Double quotes; strict TS; no `any`; no `!`; no `as unknown as T`; JSDoc on new modules/functions |
| 17 | No Classic islands | After a theme switch, user should not hit a random white Classic page while the rest of the app is Noir/Atelier. Tier B minimum on every listed surface |

### 3.1 Surface inventory (locked tiers)

**Tier A — Full layout skin**  
Different component tree / composition per theme (this is the “feels like another app” layer).

**Tier B — Theme shell**  
Same information architecture / mostly same layout, but **must** consume `useThemeTokens()` (and theme tab/header styles). No hardcoded Classic white/black that breaks Noir.

**Tier C — Out of visual program**  
Logic-only / system; no skin work beyond not crashing.

| Surface | Route / file (approx) | Tier | Notes |
|---------|------------------------|------|-------|
| **Bottom tab bar** | `app/(tabs)/_layout.tsx` | **A/B** | **Included.** Theme tokens for bg/border/active/inactive; Atelier may be airier, Noir dark dense. Same 5 tabs + feature-flag hiding |
| **Top nav / headers** | Home navbar, Shop sticky header, Profile header, `SubPageHeader.tsx` | **A/B** | **Included.** Colors + cart slot per theme chrome rules |
| **Status bar** | `app/_layout.tsx` | **B** | Follow `tokens.statusBarStyle` |
| **Home** | `app/(tabs)/index.tsx` | **A** | Distinct layouts per theme |
| **Shop list** | `app/(tabs)/browse/index.tsx` | **A** | Distinct layouts per theme |
| **Product inner (PDP)** | `app/(tabs)/browse/[productId].tsx` | **A** | **Explicitly included** — gallery, CTA, details chrome differ per theme |
| **Highlights (tab)** | `app/(tabs)/highlights.tsx` | **A** | Distinct feed presentation |
| **Highlights (profile stack)** | `app/(tabs)/profile/highlights.tsx` | **A** | Same Highlights skin as tab (shared component) |
| **Locations / Stores** | `app/(tabs)/locations.tsx` | **B** (prefer light **A** if cheap) | Must theme; full triple layout optional |
| **Profile hub** | `app/(tabs)/profile/index.tsx` | **A** | Hub composition may differ (e.g. Classic cards vs Noir dense list vs Atelier editorial header) |
| **Appearance** | `profile/appearance.tsx` (new) | **B** | Picker UI; themed |
| **Account** | `profile/account.tsx` | **B** | |
| **Orders list / detail** | `profile/orders/*` | **B** | |
| **Rewards / points** | `profile/rewards.tsx` | **B** | |
| **Notifications** | `profile/notifications.tsx` | **B** | |
| **Support** | `profile/support/*` | **B** | |
| **Guide hub** | `profile/guide.tsx` | **B** | |
| **Collection / warranty** | `profile/collection/*`, `warranty-credits.tsx` | **B** | |
| **Claims** | `profile/claims/*` | **B** | |
| **Cart sheet** | `app/cart.tsx` | **B** (light **A** OK) | Same sheet route; themed list/summary; not three checkout flows |
| **Wishlist sheet** | `app/wishlist.tsx` | **B** | |
| **Checkout index / payment / success** | `app/checkout/*` | **B** | Keep Stripe flow; theme tokens + headers |
| **Auth sign-in / sign-up / forgot** | `app/(auth)/*` | **B** | Readable in all themes |
| **Splash / entry** | `SplashIntro`, `app/index.tsx` | **B/C** | Don’t block program; optional token awareness |
| **Guide overlay engine** | `components/guide/*` | **C** (+ token dim colors) | Engine shared; dim/card colors from tokens |
| **Providers / contexts** | `components/Providers.tsx`, contexts | **C** | Wire ThemeProvider only |

### Cart chrome mapping (locked)

| Theme id | Cart chrome | Description |
|----------|-------------|-------------|
| `classic` | **Header bag** | Bag + badge in shared top chrome / navbar (extends today’s Home bag to other main surfaces) |
| `atelier` | **Floating FAB** | Bag FAB above tab bar on tab screens; hide on checkout/auth |
| `noir` | **Headers everywhere** | Bag on Home + Shop + Profile + `SubPageHeader` where it makes sense — dense always-available entry, no FAB |

Same destination for all: `router.push("/cart")`. Same badge source: `useAddToCartContext().add_to_carts`.

---

## 4. The three themes (product definition)

### 4.1 `classic` — Boutique landing (current)

**Feel:** Gold accent `#C9A96E`, white ground, Playfair display. Editorial shop landing.

| Surface | Layout |
|---------|--------|
| Tab bar | Light bar, gold active, current icon set |
| Top chrome | Overlay Home navbar; light Shop/Profile headers |
| Home | Full-bleed hero → horizontal offers → horizontal new arrivals → category pills → featured posts strip; overlay navbar with brand / search / bag |
| Shop | Sticky search + sort/category pills → **2-column** product grid |
| **Product inner** | 1:1 gallery → name/price → color pills / size squares → accordion → sticky Add to bag |
| Highlights | Full-width vertical **4:5** post feed |
| Profile hub | Current card stack (avatar card + menu cards) |
| Locations | Current map/list, Classic tokens |
| Cart chrome | Header bag |

**Who picks it:** Customers who like the current polished boutique look.

### 4.2 `atelier` — Lookbook / magazine

**Feel:** Warmer paper ground, quieter accent, more whitespace. Inspiration-first.

| Surface | Layout |
|---------|--------|
| Tab bar | Airier / quieter active state (still same tabs) |
| Top chrome | Minimal headers; less “app chrome,” more editorial |
| Home | No tall hero CTA block. **Stacked editorial chapters**: large single product/post frames with short captions; slim “Shop the edit” row; categories as a text index (not pill cluster) |
| Shop | **Single-column** large lookbook cards (image dominates; name/price under). Filters as quieter top controls / text links (not twin dense pill rows) |
| **Product inner** | Tall portrait gallery (scroll images); details more inline (less accordion stacking); quieter Add CTA + slim sticky bar |
| Highlights | Magazine tiles — calmer crop; caption treatment less “social feed,” more editorial |
| Profile hub | Editorial header + quieter list (not heavy bordered card stack) |
| Locations | Token shell (+ optional calmer list treatment) |
| Cart chrome | Floating bag **FAB** (tab bar still visible; FAB sits above it) |

**Who picks it:** Browse-for-inspiration shoppers.

### 4.3 `noir` — Immersive night retail

**Feel:** Near-black canvas, light type, muted gold. Dense, app-like.

| Surface | Layout |
|---------|--------|
| Tab bar | Dark bar, light icons, muted-gold active |
| Top chrome | Compact dark headers; bag on headers |
| Home | Compact top bar (brand + search + bag). **No tall hero** — dense “For you” product rail, compact offer chips, mini post carousel. More content above the fold |
| Shop | Dark denser **grid or list**; sticky filters kept but dark chrome; price-forward cards |
| **Product inner** | Edge-to-edge dark media, floating controls, strong sticky Add bar; compact specs |
| Highlights | Full-bleed dark media-first feed |
| Profile hub | Dense dark settings list (less “card gallery”) |
| Locations | Dark token shell |
| Cart chrome | Bag on **shared headers everywhere** (no FAB) |

**Who picks it:** Customers who want a darker, denser shopping app.

---

## 5. Architecture

### 5.1 Core idea

```
ThemeProvider (themeId + tokens + setTheme)
  └── registry[themeId]
        ├── tokens
        ├── tabBar   (styles / optional TabBar component config)
        ├── chrome   (header helpers, SubPageHeader appearance)
        ├── screens: {
        │     Home, Shop, ProductDetail, Highlights,
        │     ProfileHub, Locations?
        │   }
        └── CartChrome
```

Route files stay thin: they mount the active skin. **Product inner = `ProductDetail`.** Tab bar reads theme tokens (and optional pack `tabBar` config) from `(tabs)/_layout.tsx` — it is **not** left on hardcoded Classic `colors`.

### 5.2 Proposed files

| Path | Role |
|------|------|
| `context/ThemeContext.tsx` | Provider + `useTheme()` / `useThemeTokens()`; hydrate `asf_theme`; `setTheme(id)` |
| `themes/types.ts` | `ThemeId`, `ThemeTokens`, `ThemePack` interfaces |
| `themes/registry.ts` | Map `ThemeId` → pack; default `classic` |
| `themes/classic/tokens.ts` | Current palette (extract from `constants/theme.ts`) |
| `themes/classic/screens/*` | Classic Home / Shop / **ProductDetail (PDP)** / Highlights / ProfileHub (moved from current implementations) |
| `themes/classic/CartChrome.tsx` | Header bag chrome for Classic |
| `themes/classic/tabBar.ts` (or inline in pack) | Tab bar style tokens for Classic |
| `themes/atelier/...` | Atelier pack (screens + tabBar + CartChrome FAB) |
| `themes/noir/...` | Noir pack (screens + tabBar + headers cart) |
| `components/cart/CartButton.tsx` | Shared bag icon + `AnimatedBadge` + navigate (used by chromes) |
| `components/cart/CartChromeHost.tsx` | Renders active theme’s `CartChrome` from registry (mount near tabs / root) |
| `components/SubPageHeader.tsx` | Theme-aware (tokens + optional trailing cart slot for noir/classic rules) |
| `app/(tabs)/_layout.tsx` | **Theme-aware tab bar** (bg, border, active/inactive from tokens / pack) |
| `app/(tabs)/profile/appearance.tsx` | Customer Appearance picker (Agent 8) |
| `constants/theme.ts` | Keep exporting **Classic defaults** for gradual migration; prefer `useThemeTokens()` everywhere Tier A/B |

### 5.3 Theme pack shape (guideline)

```ts
type ThemeId = "classic" | "atelier" | "noir";

type ThemeTokens = {
  accent: string;
  bg: string;
  panel: string;
  text: string;
  muted: string;
  border: string;
  danger: string;
  success: string;
  statusBarStyle: "light" | "dark";
};

type TabBarTheme = {
  backgroundColor: string;
  borderTopColor: string;
  activeTintColor: string;
  inactiveTintColor: string;
  /** Optional height tweak; default keep current 60 + safe area */
  minHeight?: number;
};

type ThemePack = {
  id: ThemeId;
  tokens: ThemeTokens;
  tabBar: TabBarTheme;
  screens: {
    Home: React.ComponentType;
    Shop: React.ComponentType;
    /** Product inner page */
    ProductDetail: React.ComponentType;
    Highlights: React.ComponentType;
    ProfileHub: React.ComponentType;
    /** Optional; if omitted, route uses token-shell of current Locations */
    Locations?: React.ComponentType;
  };
  CartChrome: React.ComponentType;
};
```

Exact prop needs (e.g. PDP needing `productId` from route) may mean screen components receive the same props the route already has — keep route params in the thin route and pass through, or have the skin read `useLocalSearchParams` itself. Prefer **one consistent pattern** across themes.

### 5.4 Auth gate for SUPERADMIN switcher

```ts
const isThemeDev = user_detail?.role === "SUPERADMIN";
```

- Show Profile row **"Theme (staff)"** or Appearance early-access only when `isThemeDev` **until** customer Appearance ships.
- After customer Appearance ships: all users see Appearance; SUPERADMIN may still see an extra “cycle theme” affordance if useful.
- Never gate on `__DEV__` alone for the staff switcher (Stanley wants role-based lock). `__DEV__` may *additionally* show a helper, but SUPERADMIN is the required unlock for non-dev builds / TestFlight QA.

### 5.5 Persistence

- Key: `asf_theme`
- Valid values: `"classic" | "atelier" | "noir"`
- Invalid / missing → `"classic"`
- Write immediately on `setTheme` (mirror locale)

---

## 6. Current app map (baseline for Classic extraction)

Agents should treat this as the Classic baseline (as of 2026-07-27). **Everything in §3.1 exists in the app today** and must not be forgotten.

| Surface | Key files |
|---------|-----------|
| **Bottom tab bar** | `app/(tabs)/_layout.tsx` (currently hardcoded `colors.*`) |
| Home + top overlay nav | `app/(tabs)/index.tsx`, `components/home/*` |
| Shop + sticky header | `app/(tabs)/browse/index.tsx`, `browse/_layout.tsx`, `components/ProductCard.tsx` |
| **Product inner** | `app/(tabs)/browse/[productId].tsx` |
| Highlights | `app/(tabs)/highlights.tsx`, `app/(tabs)/profile/highlights.tsx`, post card components |
| Locations | `app/(tabs)/locations.tsx` |
| Profile hub | `app/(tabs)/profile/index.tsx` |
| Profile subpages | `profile/account`, `orders/*`, `rewards`, `notifications`, `support/*`, `guide`, `collection/*`, `claims/*`, `warranty-credits` |
| Cart / wishlist sheets | `app/cart.tsx`, `app/wishlist.tsx` |
| Checkout | `app/checkout/*` |
| Auth | `app/(auth)/*` |
| Sub headers | `components/SubPageHeader.tsx` |
| Cart state | `context/product/CartContext.tsx` |
| Tokens | `constants/theme.ts` |
| Providers | `components/Providers.tsx` |

**Cart today:** bag mainly on Home navbar; PDP has Add to bag + `AddedToBagTray` but no bag icon; browse/profile generally lack cart chrome.

---

## 7. Supabase / roles (verified)

- MCP access confirmed to project tables.
- Roles live on:
  - `public.user_details.role` (observed value: `SUPERADMIN`)
  - `public.staff_roles.role` (observed value: `owner`) — **not** used for this gate
- RLS: users can `SELECT` their own `user_details` / `staff_roles` rows.
- Customer app already loads `user_details` in `AuthContext` as `user_detail`.
- **Do not** invent a new roles table for this program.

**Security note (adjacent, not this program):** many public tables still have RLS disabled (Supabase advisor). Track separately; do not block theme work on fixing all RLS.

---

## 8. Implementation phases (agent-sized)

See companion prompts file for copy-paste agent prompts. **8 agents** (5 was too fat after tab bar / product inner / Profile / Tier B were locked in).

| Agent | Delivers | Depends on |
|-------|----------|------------|
| **1** | Theme **foundation only**: types, ThemeContext, registry, Classic tokens + tabBar config, ThemeProvider, SUPERADMIN switcher, StatusBar. Routes still current screens; start preferring `useThemeTokens()` in shared chrome where cheap | — |
| **2** | **Classic extraction**: Home, Shop, product inner, Highlights, Profile hub into `themes/classic/*` + theme-aware tab bar + SubPageHeader + Classic header CartChrome | Agent 1 |
| **3** | **Atelier** Home + Highlights + Profile hub + tabBar + FAB CartChrome (Shop/product inner may temporarily reuse Classic) | Agent 2 |
| **4** | **Atelier** Shop + product inner | Agent 3 |
| **5** | **Noir** Home + Highlights + Profile hub + tabBar + headers-everywhere CartChrome (Shop/product inner may temporarily reuse Classic) | Agent 2 |
| **6** | **Noir** Shop + product inner | Agent 5 |
| **7** | **Tier B token shell sweep**: auth, checkout, cart, wishlist, locations, profile subpages, guide overlay colors — no Classic islands | Agents 2+ (ideally after 3–6 so all themes exist to QA against) |
| **8** | Customer **Appearance** picker + i18n + final acceptance smoke | Agent 7 (and Tier A themes ideally done) |

**Parallelism:**

| After | Can run in parallel |
|-------|---------------------|
| Agent 2 complete | Agent **3** and Agent **5** |
| Agent 3 complete | Agent **4** |
| Agent 5 complete | Agent **6** |
| Agents 4 + 6 complete (or at least 2 + tokens live) | Agent **7** |
| Agent 7 complete | Agent **8** |

**Suggested serial order if one chat at a time:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8.

---

## 9. Acceptance criteria (program-level)

1. Switching `themeId` changes Home / Shop / **product inner** / Highlights / Profile hub **layout**, not only colors.
2. **Bottom tab bar** and **top headers** follow the active theme (no leftover Classic gold-on-white tab bar while Noir Home is showing).
3. All three themes selectable; default Classic; preference persists across app restarts.
4. Each theme’s cart chrome works and opens `/cart` with correct badge count.
5. SUPERADMIN sees staff theme controls; non-SUPERADMIN does not see staff-only controls.
6. Signed-in customers can open Appearance and choose a theme (after Agent 8).
7. Tier B surfaces (auth, checkout, cart sheet, wishlist, profile subpages, locations) are **readable and on-token** in every theme — no obvious Classic white islands in Noir (Agent 7).
8. Ceremony, App Guide anchors, and feature flags still work on Classic; other themes must not crash if a guide anchor is missing (no-op / skip gracefully).
9. New copy in en / zh-CN / ms.
10. No `npm start` / production build required from agents (user usually has Expo running).

---

## 10. Non-goals / pitfalls

- Do not fork `CartContext` per theme.
- Do not put theme choice only in `__DEV__`.
- Do not implement “dark mode toggle” as a fourth system — Noir is a full skin, not system dark mode.
- Do not leave large duplicated business logic in three Homes — extract shared data hooks where duplication hurts (products, posts, offers), but **do** allow three different JSX trees.
- Avoid rewriting the entire app to NativeWind class theming in this program.

---

## 11. Open follow-ups (explicitly later)

- Sync `asf_theme` to `user_details` for cross-device preference
- Web (`asf-2-next`) theme parity
- Additional 4th theme
- Per-theme App Guide coach-mark layouts
- Full checkout / auth visual forks
