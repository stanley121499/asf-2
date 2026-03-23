# Customer App — Full UI/UX Redesign Plan (2026)

## What We Are Doing

A complete visual and interaction redesign of the customer-facing side of the Next.js app at `asf-2-next/`. The goal is to replace the current generic, admin-panel-looking UI with a premium, minimalist, mobile-first shopping experience inspired by Zara, Charles & Keith, and Apple.

The app is served inside a **mobile WebView** — not a browser. All navigation must be self-contained (no reliance on browser back button or Android back gesture).

---

## Hard Constraints (Apply to Every Agent, Every File)

| Constraint | Details |
|---|---|
| **Language** | 100% Simplified Chinese. Every label, button, placeholder, error, empty state, toast visible to the customer must be in Chinese. Any English string = bug. |
| **WebView Navigation** | Never use `router.back()`. All back buttons must use explicit `router.push('/target')`. Every screen must have a visible way out (← Back, × Close, or Cancel). |
| **No Buy Now** | Remove all "Buy Now / 立即购买" buttons everywhere. Route all purchase intent through the cart via "加入购物袋". |
| **Touch Targets** | Minimum 56×56px on all tappable elements. Bottom nav 64px height. |
| **Font Sizes** | Body text minimum 16px. Secondary labels minimum 14px. Nothing smaller visible to users. |
| **Icon Labels** | Bottom nav tabs always show Chinese text labels below icons, even when inactive. No icon-only buttons that rely on user guessing. |
| **No Silent Deletes** | Any removal (cart item, wishlist item) shows a toast with 「撤销」(Undo) for 3 seconds. |
| **Errors in Plain Chinese** | Not raw Supabase error strings. E.g. 「邮箱或密码不正确，请重试」not "Invalid login credentials". |
| **Loading States** | Never blank screen. Show skeleton loaders or spinner with 「正在加载…」during data fetch. |
| **No Test Buttons** | Do not add or expose any development/test buttons to the customer UI. |
| **TypeScript Rules** | No `any`, no `!` non-null assertion, no `as unknown as T`. Double quotes for all strings. Complete files only — no placeholders or `// ... rest of code`. |

---

## Design System Tokens

These CSS variables are set in Phase 1 and used by all subsequent agents. Every agent must reference these variables, not hardcoded hex values.

```css
--color-bg: #FFFFFF;
--color-text: #0A0A0A;
--color-panel: #F5F5F3;
--color-accent: #C9A96E;   /* warm sand — CTAs, active states, progress bars */
--color-danger: #E8453C;   /* destructive actions only */
--color-muted: #6B7280;    /* secondary text */
--color-border: #E5E5E3;   /* dividers */
```

**Fonts (loaded in Phase 1):**
- `Cormorant Garamond` — headings, product names, brand moments (serif, luxury feel)
- `Inter` — all body copy, labels, buttons (clean, readable)

**Motion:** `transition: all 200ms ease-in-out` on all interactive elements.

**Image ratio:** `3:4` portrait for all product images.

---

## What the App Does

| Screen | Route | Purpose |
|---|---|---|
| Home | `/` | Brand entry point, editorial hero, new arrivals, categories, posts strip |
| Posts/Highlights | `/highlights` | Editorial social feed with like/save/comment |
| Product Catalog | `/product-section` | Browse products by category, filter, sort |
| Product Details | `/product-details/[id]` | Full-screen image, variants, Add to Bag |
| Cart | `/cart` | Review bag, points redemption, checkout |
| Wishlist | `/wishlist` | Saved products + saved posts (tabbed) |
| Goal/Rewards | `/goal` | Membership card, stamp card, tier progress, points history |
| Notifications | `/notifications` | In-app notifications grouped by date |
| Settings/Profile | `/settings` | Account management, preferences, support links |
| Support Chat | `/support-chat` | Ticket form → live chat → rating |
| Order Details | `/order-details/[orderId]` | Order status timeline, items, contact support |
| Sign In | `/authentication/sign-in` | Customer-branded login (redesign) |
| Sign Up | `/authentication/sign-up` | New registration page (does not exist yet) |
| Order Success | `/order-success` | Post-payment confirmation |

---

## Bottom Navigation (Applied in Phase 2, affects all screens)

**4 tabs — replaces current 5-tab + Trophy nav:**

```
🏠 首页    🛍 购物    ❤️ 已收藏    👤 我的
/          /product-section   /wishlist   /settings
```

- 64px height
- Translucent white, subtle `backdrop-blur`
- Both icon AND Chinese label always visible on all tabs (active and inactive)
- Active: `--color-accent` icon + label
- Inactive: `--color-muted` icon + label
- Safe-area-inset-bottom respected
- Goal/Rewards is accessed from Profile (Settings) → not a nav tab

---

## New Files to Create

| File | Description |
|---|---|
| `src/app/authentication/sign-up/page.tsx` | New sign-up page |
| `src/components/OnboardingOverlay.tsx` | 3-step first-launch overlay |
| `src/components/PostCard.tsx` | Social post card (like/save/comment demo) |
| `src/components/SearchOverlay.tsx` | Already exists — full redesign |

---

## Implementation Phases

| Phase | Agent File | What |
|---|---|---|
| Phase 1 | Agent 1 | Design system (globals.css, fonts, layout.tsx) |
| Phase 2 | Agent 1 | Bottom nav + Top nav redesign |
| Phase 3 | Agent 2 | Sign In redesign + Sign Up new page |
| Phase 4 | Agent 3 | Onboarding overlay + Home Page rework |
| Phase 5 | Agent 4 | PostCard component + Highlights feed |
| Phase 6 | Agent 5 | Product Section (category pills, grid, filter sheet, quick-view sheet) |
| Phase 7 | Agent 6 | Product Details (full-screen carousel, floating panel, complete the look, sticky bag bar) |
| Phase 8 | Agent 7 | Cart redesign + Wishlist redesign |
| Phase 9 | Agent 8 | Search Overlay redesign |
| Phase 10 | Agent 9 | Goal/Rewards page |
| Phase 11 | Agent 10 | Notifications + Settings + Support Chat |
| Phase 12 | Agent 11 | Order Details + Order Success |

---

## All-New Demo Features (Frontend Only — No Backend)

All of the following are fully implemented on the frontend using `localStorage` and mock data. They look and feel production-ready but do not call any API.

| Feature | Where | How |
|---|---|---|
| Post Like (heart animation) | Posts feed | Toggle in `localStorage['liked_posts']` |
| Post Comment (bottom sheet, text input) | Posts feed | State-only, no submit to backend |
| Product Quick-View bottom sheet | Product Section | Filter from already-in-memory product data |
| "Complete the Look" section | Product Details | Random sample from same-category products already loaded |
| Onboarding 3-step intro overlay | Home (first visit) | `localStorage['onboarding_v1_done']` gate |
| Order Status Timeline | Order Details | Mock stages derived from order `status` field |
| Points History list | Goal page | 5 hardcoded mock rows |
| "How to Earn More" nudges | Goal page | UI placeholders only |
| FAQ bottom sheet | Settings | 5 hardcoded FAQ items |
| Language toggle (中文/English) | Settings | `localStorage['lang']` — no actual translation |
| Order Again button | Order Details | Adds to cart context, no backend needed |
| Trending Searches | Search overlay | Hardcoded list |
| Recent Searches | Search overlay | `localStorage['recent_searches']` |
