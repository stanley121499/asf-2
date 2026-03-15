# Next.js Migration Plan — 2026

**Status**: Ready for Implementation  
**Date**: March 14, 2026  
**Goal**: Migrate from Create React App to Next.js 14 App Router to enable server-side rendering on customer-facing pages  
**Companion**: `NEXTJS_MIGRATION_AGENT_PROMPTS_2026.md`

---

## Why Next.js Fixes the Mobile Scroll Problem

The current app is a CRA (Create React App) SPA. When a customer visits on mobile:

1. Browser downloads the entire JS bundle
2. Phone CPU parses all JS (slow on mobile)
3. React executes and generates the DOM
4. Supabase queries fire, data arrives, React re-renders
5. Images start loading
6. Scroll is available — but CPU is still busy from steps 1–5

With Next.js SSR on the customer pages:

1. Server fetches data from Supabase
2. Server renders the HTML with real content
3. Browser receives **complete HTML** — no JS parsing needed before first paint
4. JS hydrates in background (React connects events) while user can already scroll
5. Images already in HTML with `loading="lazy"` — browser handles them natively

**The white-on-scroll problem disappears because content is in the HTML before any JS runs.**

---

## Current Stack

| What | Current | After Migration |
|------|---------|-----------------|
| Framework | Create React App (react-scripts 5) | Next.js 14 (App Router) |
| Routing | React Router v6 | Next.js file-based routing |
| Customer pages rendering | Client-side only | Server-side (SSR) |
| Admin pages rendering | Client-side only | Client-side (unchanged, `"use client"`) |
| Data fetching (customer) | `useEffect` + Supabase client | `async` server components |
| Data fetching (admin) | `useEffect` + Supabase client | Unchanged |
| CSS | Tailwind 3 + index.css | Unchanged |
| Components | All `.tsx` files | Unchanged (add `"use client"` where needed) |
| Supabase | `@supabase/supabase-js` | `@supabase/ssr` for server components |

---

## What Does NOT Change

- Every component file in `src/components/` — copy as-is
- Every context provider in `src/context/` — copy as-is (become client components)
- All utility functions in `src/utils/`, `src/hooks/`, `src/helpers/`
- All TypeScript types including `database.types.ts`
- All CSS (Tailwind config, `index.css`)
- All admin page logic
- Supabase table queries and realtime subscriptions
- `flowbite-react`, `react-dnd`, `apexcharts`, all third-party libraries (just reinstall)

---

## What Changes

| Change | Effort |
|--------|--------|
| File-based routing (rename/move page files) | Low — mostly renaming |
| Replace `BrowserRouter` + `React Router` with Next.js `<Link>` and `useRouter` | Medium — find/replace across pages |
| Customer pages: extract initial data fetch to `async` server component | Medium — per page |
| Admin pages: add `"use client"` at top | Low — one line per file |
| Auth guard: replace `ProtectedRoute` component with Next.js middleware | Medium |
| Supabase server client: add `@supabase/ssr` for server-side fetches | Low — new utility file |
| `useNavigate` / `useParams` → `useRouter` / `usePathname` / `params` prop | Medium — find/replace |
| `<img>` → `next/image` for LCP images (optional, recommended) | Low |

---

## Migration Approach: Parallel New Project

**Do NOT modify the existing CRA project.** Create a new Next.js project alongside it, port code into it, and switch when ready. This prevents breaking the live app during migration.

```
e:\Dev\GitHub\
  asf-2\          ← current CRA app (keep running)
  asf-2-next\     ← new Next.js project (build here)
```

---

## Next.js App Router Structure (Target)

```
asf-2-next/
  app/
    layout.tsx              ← Root layout (AuthProvider, AlertProvider)
    page.tsx                ← Home page (/ route) — SSR
    highlights/
      page.tsx              ← /highlights — SSR
    product-section/
      [[...categoryId]]/
        page.tsx            ← /product-section/:categoryId? — SSR
    product-details/
      [productId]/
        page.tsx            ← /product-details/:productId — SSR
    cart/
      page.tsx              ← Client component (needs auth state)
    checkout/
      page.tsx              ← Client component
    wishlist/
      page.tsx              ← Client component
    order-details/
      [orderId]/
        page.tsx            ← Client component
    notifications/
      page.tsx              ← Client component
    settings/
      page.tsx              ← Client component
    goal/
      page.tsx              ← Client component
    support-chat/
      page.tsx              ← Client component
    authentication/
      sign-in/
        page.tsx            ← Sign in page
    legal/
      privacy/
        page.tsx
    dashboard/              ← Admin — all client components
      page.tsx
    products/               ← Admin
      ...
    posts/                  ← Admin
      ...
    stocks/                 ← Admin
      ...
    orders/                 ← Admin
      ...
    payments/               ← Admin
      ...
    analytics/              ← Admin
      ...
    users/                  ← Admin
      ...
  components/               ← Copy from src/components/
  context/                  ← Copy from src/context/
  utils/                    ← Copy from src/utils/
  hooks/                    ← Copy from src/hooks/
  layouts/                  ← Copy from src/layouts/
  middleware.ts             ← Auth guard (replaces ProtectedRoute)
```

---

## Agent Task Breakdown (6 Agents)

| Agent | Task | Files Touched |
|-------|------|---------------|
| **Agent 1** | Initialize Next.js project + configure Tailwind + copy shared code | New project setup |
| **Agent 2** | Set up root layout, global providers, middleware auth guard, Supabase SSR client | `app/layout.tsx`, `middleware.ts`, `utils/supabase/` |
| **Agent 3** | Migrate the 4 most-visited customer SSR pages | home, highlights, product-section, product-details |
| **Agent 4** | Migrate remaining customer client pages | cart, checkout, wishlist, order-details, notifications, settings, goal |
| **Agent 5** | Migrate all admin pages (bulk `"use client"` + route rename) | All `/dashboard`, `/products`, `/posts`, `/stocks` |
| **Agent 6** | Migrate remaining admin pages + final wiring | `/orders`, `/payments`, `/analytics`, `/users`, `/support` |

---

## Verification After Full Migration

1. `npx tsc --noEmit` — 0 errors
2. `npm run build` — build succeeds
3. Home page: open Network tab → first response is full HTML with product cards already in it (not a blank `<div id="root">`)
4. Scroll test on mobile Chrome — no white sections
5. Admin login flow works end-to-end
6. All Supabase realtime subscriptions still update live data
