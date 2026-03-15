# Next.js Migration — Agent Prompts 2026

**Companion Plan**: `NEXTJS_MIGRATION_PLAN_2026.md`  
**Model**: Gemini 2.5 Pro  
**Total Agents**: 6  
**Target**: Next.js 14 App Router

---

## Context for ALL Agents (Read First)

**Current app**: Create React App (CRA) SPA at `e:\Dev\GitHub\asf-2`. Uses React 18, React Router v6, TypeScript 4.9, Tailwind 3, Supabase JS v2, flowbite-react 0.7.5.

**New project**: Will be created at `e:\Dev\GitHub\asf-2-next`. This is a parallel project — do NOT modify the original `asf-2` folder.

**Key rules across ALL agents:**
- Use Next.js 14 with **App Router** (not Pages Router)
- TypeScript strict mode — double-quote strings
- `"use client"` directive at the very top of any component using `useState`, `useEffect`, `useContext`, event handlers, or browser APIs
- Server components (no directive) can only use `async/await` — no hooks
- Replace `import { Link } from "react-router-dom"` → `import Link from "next/link"`
- Replace `import { useNavigate }` → `import { useRouter } from "next/navigation"`  and use `router.push("/path")`
- Replace `import { useParams }` → read params from the `params` prop passed to `page.tsx`
- Replace `import { useLocation }` → `import { usePathname, useSearchParams } from "next/navigation"`
- All context providers ARE client components (they use React state) — `"use client"` at the top
- Do NOT use `next/image` unless explicitly stated — keep existing `<img>` tags
- Copy `database.types.ts`, `src/utils/`, `src/hooks/`, `src/helpers/`, `src/types/` verbatim

---

---

## Agent 1 — Initialize Next.js Project + Copy Shared Code

### Your Task

Initialize a new Next.js 14 project at `e:\Dev\GitHub\asf-2-next` and copy all reusable shared code from the existing CRA project.

### Step 1: Create the Next.js project

Run this command from `e:\Dev\GitHub`:

```bash
npx create-next-app@14 asf-2-next --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```

When prompted, accept all defaults. The `--app` flag selects App Router, `--src-dir` puts code under `src/`.

### Step 2: Install dependencies

From inside `e:\Dev\GitHub\asf-2-next`, run:

```bash
npm install @supabase/supabase-js @supabase/ssr @stripe/stripe-js flowbite-react@0.7.5 react-dnd react-dnd-html5-backend react-dropzone react-router-dom apexcharts react-apexcharts emoji-picker-react papaparse react-modal-image react-sortablejs axios react-icons react-datepicker
```

```bash
npm install -D @types/uuid
```

### Step 3: Configure Tailwind

Open `e:\Dev\GitHub\asf-2-next\tailwind.config.ts` and replace its `content` array with:

```ts
content: [
  "./src/**/*.{js,ts,jsx,tsx,mdx}",
  "./node_modules/flowbite-react/lib/**/*.{js,ts}",
],
```

Also add `require("flowbite/plugin")` to the `plugins` array if it exists, and keep `darkMode: "class"`.

### Step 4: Copy global CSS

Copy `e:\Dev\GitHub\asf-2\src\index.css` content into `e:\Dev\GitHub\asf-2-next\src\app\globals.css` (replace the default Next.js globals.css content entirely — keep the `@tailwind` directives that Next.js generates at the top and append the rest of `index.css` below them).

### Step 5: Copy shared directories verbatim

Copy these folders FROM `e:\Dev\GitHub\asf-2\src\` TO `e:\Dev\GitHub\asf-2-next\src\`:

| Source (asf-2/src/) | Destination (asf-2-next/src/) |
|---------------------|-------------------------------|
| `components/` | `components/` |
| `context/` | `context/` |
| `utils/` | `utils/` |
| `hooks/` | `hooks/` |
| `helpers/` | `helpers/` |
| `types/` | `types/` |
| `layouts/` | `layouts/` |
| `database.types.ts` | `database.types.ts` |
| `flowbite-theme.ts` | `flowbite-theme.ts` |

### Step 6: Add Supabase SSR utility

Create `e:\Dev\GitHub\asf-2-next\src\utils\supabase\server.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "../../database.types";

/**
 * Creates a Supabase client for use in Server Components and Route Handlers.
 * Reads/writes auth cookies via the Next.js cookies() API.
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}
```

### Step 7: Copy environment variables

Copy `e:\Dev\GitHub\asf-2\.env` (or `.env.local`) to `e:\Dev\GitHub\asf-2-next\.env.local`. Make sure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` exist.

### Step 8: Delete Next.js boilerplate

Delete or clear:
- `src/app/page.tsx` (will be replaced by Agent 3)
- `src/app/layout.tsx` (will be replaced by Agent 2)
- `src/app/globals.css` is already updated in Step 4

### Verification

Run `npm run dev` from `asf-2-next`. The dev server should start on `http://localhost:3001` (or 3000 if 3000 is free). You may see a blank page or 404 — that's fine at this stage. `npx tsc --noEmit` should pass with minor errors (missing pages are expected).

---

---

## Agent 2 — Root Layout + Auth Middleware + Global Providers

### Your Task

Create the root layout, auth middleware, and wire up all global providers in the new Next.js project. This runs after Agent 1.

**Working directory**: `e:\Dev\GitHub\asf-2-next`

**All context providers from `asf-2/src/context/` have been copied to `asf-2-next/src/context/`. They need `"use client"` at the top since they all use React state and hooks.**

### Step 1: Add `"use client"` to all context providers

Open each file in `src/context/` and add `"use client";` as the very first line if it's not already there. Files to update:
`AuthContext.tsx`, `AlertContext.tsx`, `UserContext.tsx`, `PointsMembershipContext.tsx`, `WishlistContext.tsx`, `PaymentContext.tsx`, `ConversationContext.tsx`, `ConversationParticipantContext.tsx`, `CommunityContext.tsx`, `GroupContext.tsx`, `TicketContext.tsx`, `TicketStatusLogContext.tsx`, `HomePageElementContext.tsx`, `RouteContextBundles.tsx`, and all files in `context/product/` and `context/post/`.

Also add `"use client"` to every file in `src/layouts/` (they use hooks).

### Step 2: Create the root layout `src/app/layout.tsx`

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { AlertProvider } from "../context/AlertContext";
import { AuthProvider } from "../context/AuthContext";
import { AlertComponent } from "../components/AlertComponent";

export const metadata: Metadata = {
  title: "My App",
  description: "Customer shopping experience",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body>
        <AlertProvider>
          <AuthProvider>
            <AlertComponent />
            {children}
          </AuthProvider>
        </AlertProvider>
      </body>
    </html>
  );
}
```

> Note: `AlertProvider`, `AuthProvider`, `AlertComponent` are all client components (they were copied from your context folder with `"use client"` added). Next.js allows server layouts to render client components as children — this is correct.

### Step 3: Create auth middleware `src/middleware.ts`

This replaces the `ProtectedRoute` component from React Router. It intercepts navigation to admin routes server-side and redirects unauthenticated users to sign-in.

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_ROUTES = [
  "/dashboard",
  "/products",
  "/posts",
  "/stocks",
  "/orders",
  "/payments",
  "/analytics",
  "/users",
  "/support",
  "/home-page-builder",
  "/internal-chat",
];

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isAdminRoute(pathname)) {
    return NextResponse.next();
  }

  // Admin route: check Supabase session from cookies
  const response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const signInUrl = new URL("/authentication/sign-in", request.url);
    signInUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### Step 4: Create a shared customer layout `src/app/(customer)/layout.tsx`

Group customer routes under a route group `(customer)` so they share the `SlimLandingContextBundle`:

```tsx
"use client";
import { SlimLandingContextBundle } from "../../context/RouteContextBundles";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SlimLandingContextBundle>{children}</SlimLandingContextBundle>;
}
```

Create the directory `src/app/(customer)/` — all customer page files in Agent 3 and 4 will go inside this folder.

### Verification

`npx tsc --noEmit` — should pass (or have only "module not found" errors for pages not yet created).

---

---

## Agent 3 — Migrate the 4 Core Customer SSR Pages

### Your Task

Migrate the 4 highest-traffic customer pages to Next.js as **server components** that pre-fetch data. This is the key performance win — these pages will arrive as complete HTML.

**Working directory**: `e:\Dev\GitHub\asf-2-next`  
**Reference files**: Read from `e:\Dev\GitHub\asf-2\src\pages\landing\` before writing.

### Pages to migrate

| Route | Source file | Destination |
|-------|-------------|-------------|
| `/` | `asf-2/src/pages/landing/home.tsx` | `src/app/(customer)/page.tsx` |
| `/highlights` | `asf-2/src/pages/landing/Highlights.tsx` | `src/app/(customer)/highlights/page.tsx` |
| `/product-section/:categoryId?` | `asf-2/src/pages/landing/ProductSection.tsx` | `src/app/(customer)/product-section/[[...categoryId]]/page.tsx` |
| `/product-details/:productId` | `asf-2/src/pages/landing/ProductDetails.tsx` | `src/app/(customer)/product-details/[productId]/page.tsx` |

### Migration pattern for each page

Each page in the source uses `useEffect` + context to fetch data. In Next.js, we split this into:

1. A **server component** (`page.tsx`) that fetches data with `async/await` using the Supabase server client
2. A **client component** (e.g. `HomePageClient.tsx`) that receives data as props and handles interactive features (cart buttons, wishlist, etc.)

**Example pattern for the home page:**

```
src/app/(customer)/
  page.tsx                ← Server component: fetches products, categories, posts
  _components/
    HomePageClient.tsx    ← "use client" — receives data as props, renders UI
```

**`src/app/(customer)/page.tsx`:**
```tsx
import { createSupabaseServerClient } from "../../utils/supabase/server";
import HomePageClient from "./_components/HomePageClient";

export default async function HomePage() {
  const supabase = createSupabaseServerClient();

  // Fetch all data the home page needs in parallel
  const [
    { data: products },
    { data: categories },
    { data: posts },
    { data: productMedias },
    { data: brands },
    { data: departments },
    { data: ranges },
  ] = await Promise.all([
    supabase.from("products").select("*").order("created_at", { ascending: false }).limit(20),
    supabase.from("categories").select("*"),
    supabase.from("posts").select("*, medias:post_medias(*)").order("created_at", { ascending: false }).limit(10),
    supabase.from("product_medias").select("product_id, media_url"),
    supabase.from("brands").select("*"),
    supabase.from("departments").select("*"),
    supabase.from("ranges").select("*"),
  ]);

  return (
    <HomePageClient
      products={products ?? []}
      categories={categories ?? []}
      posts={posts ?? []}
      productMedias={productMedias ?? []}
      brands={brands ?? []}
      departments={departments ?? []}
      ranges={ranges ?? []}
    />
  );
}
```

**`src/app/(customer)/_components/HomePageClient.tsx`:**
```tsx
"use client";
// Copy the existing home.tsx component here, but:
// 1. Remove all useEffect data-fetching (data comes from props)
// 2. Remove all context hooks for data (useProductContext, usePostContext, etc.)
// 3. KEEP context hooks needed for user state: useAuthContext, usePointsMembership, useAddToCartContext
// 4. Replace import { Link } from "react-router-dom" with import Link from "next/link"
// 5. The component receives data via props instead of context
```

Apply the same split pattern to each of the 4 pages. Read the source file carefully to identify:
- Which data comes from Supabase (fetch server-side)
- Which state is user-specific / interactive (keep client-side)

For `ProductSection` and `ProductDetails`, read params from the `params` prop:
```tsx
// src/app/(customer)/product-section/[[...categoryId]]/page.tsx
export default async function ProductSectionPage({
  params,
}: {
  params: { categoryId?: string[] };
}) {
  const categoryId = params.categoryId?.[0];
  // ... fetch with categoryId filter
}
```

### Verification

After each page: run `npm run dev` and open the page in browser. Right-click → View Page Source. You should see actual product/post HTML content in the source — not just `<div id="__NEXT_APP">`. If you see content, SSR is working.

---

---

## Agent 4 — Migrate Remaining Customer Pages (Client Components)

### Your Task

Migrate the remaining customer pages. These pages require user authentication state, cart actions, or other client-side interactivity, so they remain client components — but they still benefit from Next.js's improved code splitting and routing.

**Working directory**: `e:\Dev\GitHub\asf-2-next`  
**Reference files**: Read from `e:\Dev\GitHub\asf-2\src\pages\landing\`

### Pages to migrate

| Source | Destination | Notes |
|--------|-------------|-------|
| `Cart.tsx` | `src/app/(customer)/cart/page.tsx` | Add `"use client"` |
| `Checkout.tsx` | `src/app/(customer)/checkout/page.tsx` | Add `"use client"` |
| `Wishlist.tsx` | `src/app/(customer)/wishlist/page.tsx` | Add `"use client"` |
| `OrderDetail.tsx` | `src/app/(customer)/order-details/[orderId]/page.tsx` | `useParams` → `params` prop |
| `notifications.tsx` | `src/app/(customer)/notifications/page.tsx` | Add `"use client"` |
| `Settings.tsx` | `src/app/(customer)/settings/page.tsx` | Add `"use client"` |
| `Goal.tsx` | `src/app/(customer)/goal/page.tsx` | Add `"use client"` |
| `Chat.tsx` | `src/app/(customer)/support-chat/page.tsx` | Add `"use client"` — also wrap with CommunityContextBundle |
| `sign-in.tsx` | `src/app/authentication/sign-in/page.tsx` | No customer layout needed |
| `privacy.tsx` | `src/app/legal/privacy/page.tsx` | Can be server component |

Also migrate Stripe callback pages (no customer layout needed):

| Source | Destination |
|--------|-------------|
| `components/stripe/OrderSuccess.tsx` | `src/app/order-success/page.tsx` |
| `components/stripe/OrderCancel.tsx` | `src/app/order-cancel/page.tsx` |

### Migration pattern for each client page

1. Add `"use client";` as the first line
2. Replace `import { Link } from "react-router-dom"` → `import Link from "next/link"`
3. Replace `import { useNavigate } from "react-router-dom"` → `import { useRouter } from "next/navigation"`; replace `navigate("/path")` → `router.push("/path")`
4. Replace `import { useParams } from "react-router-dom"` → read from the page's `params` prop
5. Replace `import { useLocation } from "react-router-dom"` → `import { usePathname, useSearchParams } from "next/navigation"`
6. Remove any `ProtectedRoute` wrappers — auth is now handled by middleware

### For pages with `useParams` (e.g. order-details)

```tsx
// Destination: src/app/(customer)/order-details/[orderId]/page.tsx
"use client";
import { useEffect } from "react";
// ... existing imports with react-router swaps

// The page component receives params as a prop in Next.js App Router
export default function OrderDetailPage({
  params,
}: {
  params: { orderId: string };
}) {
  const { orderId } = params;
  // ... rest of the component using orderId (was previously from useParams())
}
```

### Verification

Run `npm run dev`. Navigate to each migrated page. Pages should render correctly. Cart and wishlist should still work if the user is logged in.

---

---

## Agent 5 — Migrate Admin Pages Part 1 (Dashboard, Products, Posts, Stocks)

### Your Task

Migrate the admin pages for Dashboard, Products, Posts, and Stocks sections. All admin pages stay as client components (`"use client"`) — no SSR needed since only authenticated staff use them.

**Working directory**: `e:\Dev\GitHub\asf-2-next`  
**Reference files**: Read from `e:\Dev\GitHub\asf-2\src\pages\`

### Mapping

| Source path | Next.js destination | Context wrapper |
|-------------|---------------------|-----------------|
| `pages/index.tsx` (dashboard) | `src/app/dashboard/page.tsx` | None (uses PostContextBundle internally if needed) |
| `pages/products/list.tsx` | `src/app/products/list/page.tsx` | `ProductContextBundle` |
| `pages/products/create-product-page.tsx` | `src/app/products/create/[[...slugs]]/page.tsx` | `ProductContextBundle` |
| `pages/products/category-page.tsx` | `src/app/products/categories/page.tsx` | `ProductContextBundle` |
| `pages/products/deleted-products.tsx` | `src/app/products/deleted/page.tsx` | `ProductContextBundle` |
| `pages/products/schedule-product-page.tsx` | `src/app/products/schedule/[[...productId]]/page.tsx` | `ProductContextBundle` |
| `pages/products/stock.tsx` | `src/app/products/stock/[productId]/page.tsx` | `ProductContextBundle` |
| `pages/posts/list.tsx` | `src/app/posts/list/page.tsx` | `PostContextBundle` |
| `pages/posts/create-post-page.tsx` | `src/app/posts/create/[[...slugs]]/page.tsx` | `PostContextBundle` |
| `pages/posts/schedule-post-page.tsx` | `src/app/posts/schedule/[[...postId]]/page.tsx` | `PostContextBundle` |
| `pages/stocks/overview.tsx` | `src/app/stocks/overview/page.tsx` | `ProductContextBundle` |
| `pages/stocks/list.tsx` | `src/app/stocks/all/page.tsx` | `ProductContextBundle` |
| `pages/stocks/event-list.tsx` | `src/app/stocks/events/page.tsx` | `ProductContextBundle` |
| `pages/stocks/report.tsx` | `src/app/stocks/reports/page.tsx` | `ProductContextBundle` |
| `pages/stocks/good-stocks.tsx` | `src/app/stocks/good/page.tsx` | `ProductContextBundle` |
| `pages/stocks/create-report.tsx` | `src/app/stocks/report/create/[[...slugs]]/page.tsx` | `ProductContextBundle` |
| `pages/stocks/view-report.tsx` | `src/app/stocks/report/[reportId]/page.tsx` | `ProductContextBundle` |
| `pages/stocks/create-purchase-order.tsx` | `src/app/stocks/purchase-orders/create/[[...slugs]]/page.tsx` | `ProductContextBundle` |
| `pages/stocks/view-purchase-order.tsx` | `src/app/stocks/purchase-orders/[purchaseOrderId]/page.tsx` | `ProductContextBundle` |

### Migration pattern for admin pages

Each admin page should look like this:

```tsx
"use client";
import { ProductContextBundle } from "../../../context/RouteContextBundles";
// ... all other existing imports with react-router swaps

// Wrap the page in its context bundle directly
export default function ProductListPage() {
  return (
    <ProductContextBundle>
      <ProductListPageContent />
    </ProductContextBundle>
  );
}

function ProductListPageContent() {
  // ... entire existing page component body goes here (copied from source)
  // Apply react-router → next/navigation swaps
}
```

> **Why wrap context inside the page?** In the original app, context bundles were applied in `App.tsx` via layout routes. In Next.js, since these are all `"use client"` pages anyway, it's simpler to wrap each admin page with its own context bundle directly.

### React Router → Next.js swaps (apply to every admin page)

```ts
// FROM                                  // TO
import { Link } from "react-router-dom"  import Link from "next/link"
import { useNavigate }                   import { useRouter } from "next/navigation"
navigate("/path")                        router.push("/path")
import { useParams }                     // Remove — use params prop instead
const { id } = useParams()               // params.id from page props
import { useLocation }                   import { usePathname, useSearchParams } from "next/navigation"
```

### Verification

`npx tsc --noEmit` — must pass. Run dev server and open each page while logged in. Confirm data loads correctly.

---

---

## Agent 6 — Migrate Remaining Admin Pages + Final Wiring

### Your Task

Migrate the remaining admin pages (Orders, Payments, Analytics, Users, Support) and do the final project wiring (error pages, 404, home-page-builder).

**Working directory**: `e:\Dev\GitHub\asf-2-next`

### Mapping

| Source | Destination | Context |
|--------|-------------|---------|
| `pages/orders/list.tsx` | `src/app/orders/page.tsx` | `OrderContextBundle` |
| `pages/orders/detail.tsx` | `src/app/orders/[orderId]/page.tsx` | `OrderContextBundle` |
| `pages/payments/index.tsx` (PaymentListPage) | `src/app/payments/page.tsx` | `OrderContextBundle` |
| `pages/payments/index.tsx` (PaymentDetailPage) | `src/app/payments/[paymentId]/page.tsx` | `OrderContextBundle` |
| `pages/analytics/users.tsx` | `src/app/analytics/users/page.tsx` | `AnalyticsContextBundle` |
| `pages/analytics/products.tsx` | `src/app/analytics/products/page.tsx` | `AnalyticsContextBundle` |
| `pages/analytics/products-inner.tsx` | `src/app/analytics/products-inner/[productId]/page.tsx` | `AnalyticsContextBundle` |
| `pages/analytics/categories.tsx` | `src/app/analytics/categories/page.tsx` | `AnalyticsContextBundle` |
| `pages/analytics/categories-inner.tsx` | `src/app/analytics/categories-inner/[categoryId]/page.tsx` | `AnalyticsContextBundle` |
| `pages/analytics/support.tsx` | `src/app/analytics/support/page.tsx` | `AnalyticsContextBundle` |
| `pages/users/list.tsx` | `src/app/users/list/page.tsx` | `UserProvider` |
| `pages/users/settings.tsx` | `src/app/users/settings/page.tsx` | `UserProvider` |
| `pages/support/index.tsx` | `src/app/support/page.tsx` | `CommunityContextBundle` |
| `pages/internal-chat/index.tsx` | `src/app/internal-chat/page.tsx` | `CommunityContextBundle` |
| `pages/home-page-builder/index.tsx` | `src/app/home-page-builder/page.tsx` | `HomePageElementProvider` |

Use the same pattern as Agent 5 (wrap each page in its context bundle, add `"use client"`, swap react-router imports).

### Error / utility pages

| Source | Destination |
|--------|-------------|
| `pages/pages/404.tsx` | `src/app/not-found.tsx` (Next.js convention) |
| `pages/pages/500.tsx` | `src/app/error.tsx` (Next.js convention, add `"use client"`) |
| `pages/pages/maintenance.tsx` | `src/app/maintenance/page.tsx` |
| `pages/pages/loading.tsx` | `src/app/loading.tsx` |

### Final next.config.js / next.config.ts

Open `e:\Dev\GitHub\asf-2-next\next.config.ts` and ensure it has:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from Supabase storage
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
```

### Final verification

1. `npx tsc --noEmit` — 0 errors
2. `npm run build` — build must succeed with no errors
3. Check home page View Source — actual product HTML must be present
4. Test full customer flow: home → product → cart → checkout
5. Test admin flow: login → /dashboard → /products/list
6. Test auth guard: try visiting `/dashboard` while logged out → should redirect to sign-in
7. Open Chrome DevTools on mobile simulation → scroll the home page → no white areas
