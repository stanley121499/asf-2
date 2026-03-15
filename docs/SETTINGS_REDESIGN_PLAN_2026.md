# Settings Page Redesign Plan — 2026

**Project**: ASF-2 (Next.js — `asf-2-next`)  
**Date**: March 2026  
**Companion Prompts**: `SETTINGS_REDESIGN_AGENT_PROMPTS_2026.md`  
**Total Agents**: 2  
**Model**: Gemini 2.5 Pro (High context)

---

## Problem Statement

The current Settings page (`/settings`) has two core UX problems:

### 1. No path to the Wishlist page

The `/wishlist` page is fully implemented and functional. However, there is **no link to it anywhere** in the navigation. The bottom nav has 5 slots (Home, Cart, Highlights, Goal, Profile/Settings) — none of which go to `/wishlist`. The settings page menu inside also has no entry for Wishlist. Users who have saved items have no way to view them unless they already know the URL.

### 2. Settings page is desktop-first and mobile-unfriendly

The current layout uses a **two-column sidebar + tab panel design** (`flex-col md:flex-row`). On mobile:

- The sidebar appears as a vertical column of Flowbite `<Button>` components stacked at the top
- Users must scroll past those buttons to even see the tab content below
- The account tab content uses `max-h-[65vh] overflow-y-auto` which creates a **scroll trap** inside the page scroll — this breaks the native scroll feel on mobile
- There is no visual grouping of related settings — account, orders, appearance, and support are all presented as equal-weight tabs in a flat list
- The sidebar layout wastes horizontal space on mobile (buttons stretch full width)
- There is no direct navigation from settings to wishlist, goal, or notifications — all are orphaned pages

---

## What We Are Doing

We are **redesigning the settings page** to follow a mobile-first "Profile Hub" pattern — the standard used by Shopee, Lazada, TikTok Shop, and all major mobile e-commerce apps.

**The bottom nav is NOT changed.** The wishlist entry point is added inside the settings page itself.

---

## Design: Mobile-First Vertical List (Profile Hub)

Replace the sidebar/tab-panel layout with a vertically scrolling page composed of:

1. **Profile header card** — avatar, name, email, membership badge, points
2. **Grouped menu rows** — tappable full-width rows with icons, labels, and right chevrons
3. **An inline dark mode toggle row** — no separate "Appearance" tab needed
4. **A logout button** at the bottom

### Page Layout (Mobile)

```
┌─────────────────────────────────────────────────────────┐
│  NavbarHome                                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─── Profile Card ──────────────────────────────────┐  │
│  │  [Avatar]   Name              金牌会员             │  │
│  │             email@example.com    1,234 pts ⭐      │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ── 我的账户 ──────────────────────────────────────────  │
│  │ 📦  我的订单                              ›  │       │
│  │ ♡   我的收藏                              ›  │  ←NEW │
│  │ 🏅  积分与会员                            ›  │       │
│                                                         │
│  ── 账户设置 ──────────────────────────────────────────  │
│  │ 👤  编辑个人资料                          ›  │       │
│  │ 🔒  修改密码                              ›  │       │
│  │ 🖼   更换头像                             ›  │       │
│                                                         │
│  ── 偏好设置 ──────────────────────────────────────────  │
│  │ 🌙  深色模式                      [toggle]  │       │
│  │ 💬  联系客服                              ›  │       │
│                                                         │
│  [ 🚪  退出登录 ] (red text, full-width button)         │
│                                                         │
│  BottomNavbar (fixed, 4rem + safe area inset)           │
└─────────────────────────────────────────────────────────┘
```

---

## Key UX Decisions

| Decision | Rationale |
|---|---|
| **Vertical menu rows with chevrons** | Standard mobile pattern (iOS Settings, Shopee, every major app). No hidden tabs, no scroll traps. |
| **Profile card always visible at top** | Users want to see their name/points immediately — not hidden inside a tab. |
| **Inline dark mode toggle** | No need for a separate "Appearance" tab for a single toggle. |
| **Wishlist row in "我的账户" section** | Groups it logically with Orders and Points — all are things the user "owns". |
| **Goal/Points linked from settings row** | Goal is a loyalty feature. It belongs in Profile Hub, not bottom nav. This frees up bottom nav for wishlist if needed in future. |
| **Modal/drawer sub-pages for edit forms** | Account editing (name, phone, password, avatar) uses an expanding drawer within the same page OR navigates to sub-pages. The agent will implement the simplest approach: each edit section expands inline (accordion style) on tap. |
| **No scroll traps** | Remove `max-h-[65vh] overflow-y-auto` from the account tab — the whole page scrolls naturally. |
| **Bottom nav NOT changed** | Per user instruction — the bottom nav stays as-is (Home, Cart, Highlights, Goal, Settings). |

---

## Files Changed

| File | Change |
|---|---|
| `src/app/(customer)/settings/page.tsx` | Full JSX restructure — replace sidebar/tab layout with mobile-first vertical menu + inline accordion edit sections |

**Only one file is changed.**  
The logic (profile save, password update, avatar upload, points fetch) is **all kept as-is**. Only the presentation layer changes.

---

## Detailed Section Breakdown

### Section 1 — Profile Card

- **Component**: An inline `div` block, not a separate component
- **Contents**:
  - `<Avatar>` (Flowbite, rounded, size `xl`) — shows `avatarUrl` or placeholder icon
  - Display name (from `displayName` memo — already computed)
  - Email (read-only)
  - Membership badge — currently hardcoded "金牌会员" (keep as-is for now)
  - Points count — from `userPoints` state (already fetched)
- **Tap behaviour**: Tapping the avatar OR a pencil icon next to the name opens the "Edit Profile" accordion section below

### Section 2 — 我的账户 (My Account)

Three menu rows:

| Row | Icon | Label | Action |
|---|---|---|---|
| Orders | `HiOutlineShoppingBag` | 我的订单 | Links to `/order-details` (the working orders page link from `OrdersList.tsx`) |
| Wishlist | `HiOutlineHeart` | 我的收藏 | Links to `/wishlist` |
| Points & Membership | `HiOutlineStar` or `HiOutlineBadgeCheck` | 积分与会员 | Links to `/goal` |

### Section 3 — 账户设置 (Account Settings)

Three accordion rows (tap to expand inline, tap again to collapse):

| Row | Icon | Label | Expanded Content |
|---|---|---|---|
| Edit Profile | `HiOutlineUser` | 编辑个人资料 | First name, last name, phone inputs + Save button |
| Change Password | `HiOutlineLockClosed` | 修改密码 | Current pw, new pw, confirm pw inputs + Update button |
| Update Avatar | `HiOutlinePhotograph` | 更换头像 | File input + Upload button |

Each accordion row uses local state `openSection: string | null` to control which (if any) is expanded. Only one can be open at a time.

### Section 4 — 偏好设置 (Preferences)

Two rows:

| Row | Icon | Label | Behaviour |
|---|---|---|---|
| Dark Mode | `HiOutlineMoon` / `HiOutlineSun` | 深色模式 / 浅色模式 | Inline `<ToggleSwitch>` — no navigation, no tap to expand |
| Contact Support | `HiOutlineQuestionMarkCircle` | 联系客服 | Links to `/support-chat` |

### Section 5 — Logout Button

- Full-width red outlined button at the bottom
- `onClick` → `handleLogout()` (already implemented)
- Text: "退出登录"

---

## Guest State (Not Logged In)

The current guest state is already well-designed (centered sign-in prompt with a welcome message). **Keep it exactly as-is.** The guest view is not changed.

---

## Coding Standards

See `FEATURE_IMPLEMENTATION_PLAN_2026.md` — same rules apply:
1. No `any`, no `!`, no `as unknown as T`
2. Double quotes for strings
3. Template literals instead of `+` concatenation
4. `"use client"` at top (already present)
5. Full JSDoc comments on all functions
6. Complete code only — no placeholders
7. Tailwind only for styling
