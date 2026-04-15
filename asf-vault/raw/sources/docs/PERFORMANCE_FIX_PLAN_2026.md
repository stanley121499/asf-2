# Performance Fix Plan — ASF-2 (March 2026)

**Status**: In Progress  
**Audit Date**: March 13, 2026  
**Author**: Senior Dev Code Review  
**Related Docs**: `PERFORMANCE_AUDIT_2026.md`, `PERFORMANCE_ISSUES.md`

---

## Overview

A full performance audit was conducted on March 13, 2026. The previous round of fixes (from the `PERFORMANCE_AUDIT_2026.md` doc) has been **partially completed** — the biggest architectural wins (route-scoped context bundles, code splitting via `React.lazy`, `useCallback`/`useMemo` across contexts, realtime UPDATE bug fix, `UserContext` N+1 fix) are already in place.

**14 new/remaining issues** have been identified across the live codebase. These are the root cause of the app feeling laggy and unresponsive today.

---

## What's Already Fixed ✅

| Fix | Location |
|-----|----------|
| Route-scoped context bundles (was 36 global providers) | `RouteContextBundles.tsx` |
| Code splitting — all 40+ pages lazy loaded | `App.tsx` |
| `OrderContext` — `useCallback`, `useMemo`, `showAlertRef` | `OrderContext.tsx` |
| `UserContext` N+1 query → batch `.in()` | `UserContext.tsx` |
| `ProductContext` realtime UPDATE wipe bug | `ProductContext.tsx` |
| `flatMap + Array(1).fill()` anti-pattern | `products/list.tsx` |
| `ConfirmDeleteModal` rendered per card | `products/list.tsx` |
| O(n²) `productMedias.find()` in render | `products/list.tsx` |
| Filter recomputed in JSX without `useMemo` | `products/list.tsx` |
| `ConversationContext` loads all messages on mount | `ConversationContext.tsx` |
| `AlertContext` not memoized | `AlertContext.tsx` |
| Smart image lazy loading (`SmartImage` component) | `SmartImage.tsx` |
| React 18 Concurrent Mode (`ReactDOM.createRoot`) | `index.tsx` |

---

## What Still Needs Fixing (Remaining 14 Issues)

### 🔴 CRITICAL

| # | Issue | Root Cause | Files |
|---|-------|-----------|-------|
| 1 | `UserProvider` at global root fires `admin.listUsers()` on every page | Architecture | `App.tsx`, `RouteContextBundles.tsx` |
| 2 | `ProductContext` still makes 2 sequential Supabase calls per fetch | Missing RPC fields | `ProductContext.tsx` + SQL RPC |
| 3 | `PaymentContext` fires N admin API calls per payment fetch | Using admin auth API instead of `user_details` table | `PaymentContext.tsx` |

### 🟠 HIGH

| # | Issue | Root Cause | Files |
|---|-------|-----------|-------|
| 4 | Sidebar inner components cause full remounts on every state change | React anti-pattern: components defined inside parent | `sidebar.tsx` |
| 5 | `listMessagesByConversationId` recreates on every chat message | `conversations` in `useCallback` deps | `ConversationContext.tsx` |
| 6 | `DndProvider` wraps all routes including customer-facing pages | Incorrectly scoped at app root | `App.tsx` |

### 🟡 MEDIUM

| # | Issue | Root Cause | Files |
|---|-------|-----------|-------|
| 7 | `console.log`/`console.error` in production hot paths | Never removed after debugging | Multiple context + page files |
| 8 | `PointsMembershipProvider` at app root (unnecessary) | Should be in `OrderContextBundle` | `App.tsx`, `RouteContextBundles.tsx` |
| 9 | `ProductMediaContext` + others fetch full tables with no limit | No pagination | Multiple context files |
| 10 | `new URLSearchParams()` created on every render in `ProductSection` | Missing `useMemo` | `ProductSection.tsx` |
| 11 | `SidebarContext` reads `window.location` instead of React Router | Won't update on SPA navigation | `SidebarContext.tsx`, `sidebar.tsx` |
| 12 | `via.placeholder.com` external image requests on home page | Third-party service for every missing image | `home.tsx` |
| 13 | No `React.StrictMode` | Never added | `index.tsx` |
| 14 | No pagination on any context (scalability time-bomb) | Every context fetches all rows | All context files |

---

## Implementation Plan — 6 Agent Tasks

The 14 issues have been grouped into **6 focused agent tasks**, ordered by impact. Each task is self-contained and touches a defined set of files.

### Agent Task 1 — Provider Scoping (Issues 1, 6, 8)
**Impact**: 🔴 Critical  
**Files**: `src/App.tsx`, `src/context/RouteContextBundles.tsx`  
**What**: Move `UserProvider` to only admin user routes; move `DndProvider` to only product-editor routes; move `PointsMembershipProvider` out of root into `OrderContextBundle`.  
**Why it matters**: Eliminates `admin.listUsers()` call on every customer page load and removes drag-and-drop overhead from all customer-facing routes.

### Agent Task 2 — Sidebar Component Anti-Pattern (Issue 4)
**Impact**: 🟠 High  
**Files**: `src/components/sidebar.tsx`  
**What**: Move `SidebarContent`, `FloatingMenuButton`, and `MobileUserSection` from being defined inside the parent `ExampleSidebar` function to module-level scope.  
**Why it matters**: React sees inner components as new types each render → unmount + remount cycle. The sidebar is on every admin page.

### Agent Task 3 — ConversationContext Stability + StrictMode (Issues 5, 13)
**Impact**: 🟠 High  
**Files**: `src/context/ConversationContext.tsx`, `src/index.tsx`  
**What**: Apply `conversationsRef` pattern to `listMessagesByConversationId` so it doesn't recreate on every message; add `React.StrictMode` to entry point.  
**Why it matters**: Every incoming chat message currently cascades re-renders to all `ConversationContext` consumers.

### Agent Task 4 — PaymentContext User Enrichment Fix (Issue 3)
**Impact**: 🔴 Critical  
**Files**: `src/context/PaymentContext.tsx`  
**What**: Replace per-user `supabaseAdmin.auth.admin.getUserById(id)` calls (N calls) with a single `user_details` table batch query.  
**Why it matters**: Every payment fetch fires N separate admin API calls. Should be 1 DB query.

### Agent Task 5 — Code Quality & Small Fixes (Issues 7, 10, 11, 12)
**Impact**: 🟡 Medium  
**Files**: `src/pages/landing/ProductSection.tsx`, `src/context/SidebarContext.tsx`, `src/components/sidebar.tsx`, `src/pages/landing/home.tsx`, key context files  
**What**: Memoize `URLSearchParams`; fix sidebar active-page tracking with `useLocation`; replace `via.placeholder.com` with local placeholder; remove `console.log` from hot paths.  
**Why it matters**: Accumulated small drags that add up, especially on the customer-facing landing page.

### Agent Task 6 — ProductContext Single Fetch (Issue 2)
**Impact**: 🔴 Critical  
**Files**: `src/context/product/ProductContext.tsx` + Supabase SQL RPC  
**What**: Update the `fetch_products_with_computed_attributes` RPC function to return all base product columns (`brand_id`, `category_id`, `department_id`, `range_id`, `warranty_description`, `warranty_period`, `deleted_at`); then remove the second sequential query from `fetchProducts`.  
**Why it matters**: Every product load makes 2 sequential DB round-trips. Should be 1.

---

## Coding Standards (All Agents Must Follow)

These are non-negotiable project standards:

1. **Full code only** — no placeholders, no `// ... rest of code`. Every file must be complete and runnable.
2. **TypeScript strict** — no `any`, no `!` non-null assertion, no `as unknown as T` casts.
3. **Strings** — double quotes (`"`) only; use template literals or `.join()` for concatenation.
4. **Comments** — JSDoc headers on all exported functions/components; inline comments explaining non-obvious logic.
5. **Error checking** — all async functions must have `try/catch` with proper error surfacing.
6. **React patterns** — `useCallback` for all functions exposed via context; `useMemo` with correct dependencies for all context values.

---

## Estimated Impact After All Fixes

| Metric | Current | After All 6 Agents | Improvement |
|--------|---------|-------------------|-------------|
| Admin API calls on customer page load | 1 (listUsers) | 0 | **Eliminated** |
| Supabase calls on `/products/list` load | 2 sequential | 1 | **50% reduction** |
| Payment fetch API calls (10 users) | 10 admin calls | 1 DB query | **90% reduction** |
| Sidebar re-render cost | 3 full remounts | 0 remounts | **Eliminated** |
| ConversationContext re-renders per message | All consumers | 0 | **Eliminated** |
| DnD overhead on customer pages | Full library init | None | **Eliminated** |

---

## File Reference

```
src/
├── App.tsx                              ← Agent 1, 6
├── index.tsx                            ← Agent 3
├── components/
│   └── sidebar.tsx                      ← Agent 2, 5
├── context/
│   ├── RouteContextBundles.tsx          ← Agent 1
│   ├── SidebarContext.tsx               ← Agent 5
│   ├── ConversationContext.tsx          ← Agent 3
│   ├── PaymentContext.tsx               ← Agent 4
│   └── product/
│       └── ProductContext.tsx           ← Agent 6
├── pages/
│   └── landing/
│       ├── home.tsx                     ← Agent 5
│       └── ProductSection.tsx           ← Agent 5
```
