# Performance Fix — Agent Prompts

**Reference**: `docs/PERFORMANCE_AUDIT_2026.md`  
**How to use**: Copy one task block at a time and pass it to the model (e.g., Claude Sonnet). Each task is scoped to a small set of files so the model can read them fully and apply changes without hitting context limits. Complete tasks in order since some build on each other.

---

## Task 1 — Fix Critical Correctness Bugs (Quick Wins)

**Estimated files changed**: 2  
**Estimated time**: 15–20 min  
**Dependencies**: None — do this first

---

### Prompt

```
You are a senior React/TypeScript developer. Fix the following two correctness bugs in this codebase. Read each file fully before making changes. Apply all changes in one pass.

---

## Bug 1: ProductContext realtime UPDATE wipes computed fields

**File**: `src/context/product/ProductContext.tsx`

In the `handleRealtimeChanges` function (around line 237), the `UPDATE` event path calls `mapRowToProduct(payload.new)`. The `mapRowToProduct` function resets all computed client-side fields (`medias`, `product_categories`, `product_colors`, `product_sizes`, `stock_status`, `stock_count`) to empty defaults. This means every realtime product update erases the enriched data that was loaded on mount.

**Fix**: In the `UPDATE` branch, instead of calling `mapRowToProduct`, spread the realtime payload over the existing product to preserve computed fields:

```ts
// Replace this:
setProducts((prev) =>
  prev.map((product) =>
    product.id === payload.new.id ? mapRowToProduct(payload.new) : product
  )
);

// With this:
setProducts((prev) =>
  prev.map((product) =>
    product.id === payload.new.id
      ? { ...product, ...payload.new }
      : product
  )
);
```

---

## Bug 2: ConfirmDeleteModal rendered inside the product card loop

**File**: `src/pages/products/list.tsx`

In the `ProductsTable` component, a `ConfirmDeleteModal` is rendered inside every product card, and `isDeleteModalOpen` is a single shared boolean. This creates N modal instances and means the wrong product can be deleted (the `product.id` closure is unreliable with a shared `isOpen` boolean).

**Fix**:
1. Remove `isDeleteModalOpen` state.
2. Add `productToDelete` state: `const [productToDelete, setProductToDelete] = React.useState<string | null>(null);`
3. Remove the `<ConfirmDeleteModal>` from inside the card loop.
4. Change the Delete button's `onClick` to `() => setProductToDelete(product.id)`.
5. Add a single `<ConfirmDeleteModal>` outside the loop (but still inside the `ProductsTable` return), wired to `productToDelete`:

```tsx
<ConfirmDeleteModal
  isOpen={productToDelete !== null}
  onClose={() => setProductToDelete(null)}
  onConfirm={() => {
    if (productToDelete !== null) {
      deleteProduct(productToDelete);
    }
    setProductToDelete(null);
  }}
/>
```

---

## Code quality: Remove console.log calls

**Files**: `src/context/product/ProductContext.tsx`, `src/pages/products/list.tsx`, `src/context/product/OrderContext.tsx`

Remove all `console.log` calls from these files. Keep `console.error` calls that handle actual errors. Do not add any new logging.

---

## Rules
- Do not use the `any` type.
- Do not use the non-null assertion operator (!).
- Use double quotes for strings.
- Include JSDoc comments on any functions you add or modify.
- Generate complete files — no placeholders.
```

---

## Task 2 — Fix OrderContext: Memoization + Stale Closure

**Estimated files changed**: 1  
**Estimated time**: 20–30 min  
**Dependencies**: None

---

### Prompt

```
You are a senior React/TypeScript developer. Rewrite `src/context/product/OrderContext.tsx` to fix the following issues. Read the full file before making changes.

---

## Issues to fix

### 1. Functions not wrapped in useCallback

`fetchOrders`, `refreshOrders`, `createOrderWithItemsAndStock`, and `updateOrderStatus` are plain async functions. Wrap all of them in `useCallback` with correct dependency arrays. Use a `showAlertRef` pattern to avoid including `showAlert` as a dependency (this prevents re-fetch loops when alerts fire):

```ts
// At the top of the provider:
const showAlertRef = useRef<typeof showAlert | null>(null);
useEffect(() => { showAlertRef.current = showAlert; }, [showAlert]);

// Then use showAlertRef.current?.(...) instead of showAlert(...)
// This allows useCallback deps to be [] or [fetchOrders] rather than [showAlert]
```

### 2. useMemo omits functions from dependencies

The current `useMemo` suppresses the exhaustive-deps lint rule and omits all functions. This causes consumers to receive stale function references. Fix it:

```ts
const value = useMemo<OrderContextProps>(
  () => ({
    orders,
    loading,
    createOrderWithItemsAndStock,
    updateOrderStatus,
    refreshOrders,
  }),
  [orders, loading, createOrderWithItemsAndStock, updateOrderStatus, refreshOrders]
);
```

### 3. useEffect depends on showAlert and has a broken isMounted guard

Replace:
```ts
useEffect(() => {
  let isMounted = true;
  const loadOrders = async () => { await fetchOrders(); };
  if (isMounted) { loadOrders(); }
  return () => { isMounted = false; };
}, [showAlert]); // eslint-disable-line react-hooks/exhaustive-deps
```

With:
```ts
useEffect(() => {
  void fetchOrders();
}, [fetchOrders]);
```

The `isMounted` guard only works if `fetchOrders` itself receives and respects it. Since we're using `useCallback` + stable refs now, the simpler form is correct.

### 4. Remove leftover console.log debug statements

The `updateOrderStatus` function has a `console.log("Status change:", {...})` call that logs sensitive order data. Remove it.

---

## Additional rules
- Add `useRef` to the imports if not already present.
- Do not use the `any` type.
- Do not use the non-null assertion operator (!).
- Use double quotes for strings.
- Include JSDoc comments on all functions.
- Generate the complete file — no placeholders or truncation.
```

---

## Task 3 — Fix UserContext N+1 Query + PaymentContext All-Users Fetch

**Estimated files changed**: 2  
**Estimated time**: 25–35 min  
**Dependencies**: None

---

### Prompt

```
You are a senior React/TypeScript developer. Fix two expensive data-fetching bugs. Read each file fully before making changes.

---

## Fix 1: UserContext N+1 query

**File**: `src/context/UserContext.tsx`

### Problem
`fetchUsers` calls `supabase.from("user_details").select("*").eq("id", authUser.id)` inside a `Promise.all(authUsers.map(...))`. This fires one separate database round-trip per user. With 50 users = 51 queries.

### Fix
Replace the per-user queries with a single batch query:

```ts
const fetchUsers = useCallback(async (): Promise<void> => {
  setLoading(true);
  try {
    // Step 1: Fetch all auth users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) {
      showAlertRef.current?.("Error fetching users", "error");
      console.error("Error fetching users:", authError);
      return;
    }
    const authUsers = authData.users ?? [];

    // Step 2: Batch-fetch all user_details in a single query
    const authUserIds = authUsers.map((u) => u.id);
    const { data: allDetails, error: detailsError } = await supabase
      .from("user_details")
      .select("*")
      .in("id", authUserIds);

    if (detailsError) {
      console.error("Error fetching user details:", detailsError);
      showAlertRef.current?.("Error fetching user details", "error");
    }

    // Step 3: Build a lookup map for O(1) access
    const detailsMap = Object.fromEntries(
      (allDetails ?? []).map((d) => [d.id, d])
    );

    // Step 4: Merge auth users with their details
    const usersWithDetails: User[] = authUsers.map((authUser) => {
      const detail = detailsMap[authUser.id];
      const role =
        typeof detail?.role === "string" && detail.role.trim().length > 0
          ? detail.role
          : "USER";
      return {
        id: authUser.id,
        email: authUser.email ?? "",
        password: "",
        user_detail: { ...detail, role },
      };
    });

    setUsers(usersWithDetails);
  } finally {
    setLoading(false);
  }
}, []); // showAlert accessed via ref
```

Also add a `showAlertRef` (same pattern as ProductContext) so you can remove `showAlert` from `fetchUsers` and `useEffect` deps — preventing re-fetch loops when alerts show.

---

## Fix 2: PaymentContext fetches all auth users

**File**: `src/context/PaymentContext.tsx`

### Problem
`fetchPayments` calls `supabaseAdmin.auth.admin.listUsers()` to fetch ALL users, just to get email addresses for payment enrichment. This is expensive and grows with user count.

### Fix
Replace the admin user fetch with a targeted `user_details` query using only the user IDs that appear in the payment data:

```ts
// After extracting userIds from payment data:
let usersData: { id: string; email?: string }[] = [];
if (userIds.length > 0) {
  const { data: details, error: detailsError } = await supabase
    .from("user_details")
    .select("id, email") // Only select what you need
    .in("id", userIds);

  if (detailsError) {
    console.error("Error fetching user details for payments:", detailsError);
  } else {
    usersData = (details ?? []).map((d) => ({
      id: d.id,
      email: typeof d.email === "string" ? d.email : undefined,
    }));
  }
}
```

Note: This requires that the `user_details` table has an `email` column. If it doesn't, the alternative is to keep the admin call but add `.page(1).perPage(1000)` limiting, and only call it once (cache it in a ref so it doesn't re-fetch on every payment refresh). Choose the approach that fits your schema.

Also apply the `showAlertRef` pattern to `fetchPayments` so `showAlert` is not a `useCallback` dependency.

---

## Rules
- Do not use the `any` type.
- Do not use the non-null assertion operator (!).
- Use double quotes for strings.
- Add `useRef` to imports where needed.
- Include JSDoc comments on all functions you modify.
- Generate complete files — no placeholders.
```

---

## Task 4 — Fix ProductListPage Rendering Inefficiencies

**Estimated files changed**: 1  
**Estimated time**: 20–25 min  
**Dependencies**: Task 1 (Bug 2 — ConfirmDeleteModal — must be done first)

---

### Prompt

```
You are a senior React/TypeScript developer. Refactor `src/pages/products/list.tsx` to fix the following rendering performance issues. Read the full file before making changes.

---

## Fix 1: Replace flatMap + Array(1).fill(null) with simple map

In `ProductsTable`, the products are rendered using an unnecessary `flatMap + Array(1).fill(null).map(...)` pattern. Replace it with a plain `.map()`:

```tsx
// Replace:
{products.flatMap((product) =>
  Array(1).fill(null).map((_, index) => (
    <Card key={`${product.id}-${index}`}>
      ...
    </Card>
  ))
)}

// With:
{products.map((product) => (
  <Card key={product.id}>
    ...
  </Card>
))}
```

## Fix 2: Memoize the product media lookup map

`productMedias.find(media => media.product_id === product.id)` is called inside JSX for every card on every render. With 100 products and 500 media rows this is 50,000 comparisons per render.

Build a lookup map once using `useMemo`, then use it in each card:

```tsx
// In ProductsTable, add:
const mediaByProductId = React.useMemo((): Record<string, string | undefined> => {
  const map: Record<string, string | undefined> = {};
  for (const media of productMedias) {
    if (map[media.product_id] === undefined) {
      map[media.product_id] = media.media_url;
    }
  }
  return map;
}, [productMedias]);

// Replace the find() call with:
src={mediaByProductId[product.id]}
```

## Fix 3: Memoize the filtered products in ProductListPage

The `.filter()` call inside the JSX of `ProductListPage` re-filters all products on every render, including unrelated context re-renders.

```tsx
// Add above the return statement in ProductListPage:
const filteredProducts = React.useMemo(
  () =>
    products.filter((product) =>
      product.name.toLowerCase().includes(searchValue.toLowerCase())
    ),
  [products, searchValue]
);

// Then pass filteredProducts to ProductsTable instead of the inline filter:
<ProductsTable products={filteredProducts} setProductData={setProductData} />
```

## Fix 4: Memoize the media lookup in ProductListPage preview panel

In the preview panel (lines ~89–93), `productMedias.filter(media => media.product_id === productData?.id).map(media => media.media_url)` runs on every render. Memoize it:

```tsx
const previewMediaUrls = React.useMemo(
  () =>
    productData
      ? productMedias
          .filter((media) => media.product_id === productData.id)
          .map((media) => media.media_url)
      : ["red", "blue", "green", "yellow"], // fallback matches existing default
  [productMedias, productData]
);
```

---

## Rules
- Do not use the `any` type.
- Do not use the non-null assertion operator (!).
- Use double quotes for strings.
- Preserve all existing functionality and styling.
- Generate the complete file — no placeholders.
```

---

## Task 5 — Fix CreateProductPage + Add Code Splitting to App.tsx

**Estimated files changed**: 2  
**Estimated time**: 30–40 min  
**Dependencies**: None

---

### Prompt

```
You are a senior React/TypeScript developer. Make the following changes. Read each file fully before making changes.

---

## Fix 1: CreateProductPage — Replace flatMap anti-pattern

**File**: `src/pages/products/create-product-page.tsx`

Two places use `flatMap + Array(1).fill(null).map()`. Replace both with simple `.map()`.

### Location 1 — Product Folders list (around line 168):
```tsx
// Replace:
{productFolders.map((folder) =>
  Array(1).fill(null).map((_, index) => (
    <Card key={`${folder.id}-${index}`} ...>

// With:
{productFolders.map((folder) => (
  <Card key={folder.id} ...>
```

### Location 2 — Products sidebar list (around line 224):
```tsx
// Replace:
{products.filter(...).flatMap((product) =>
  Array(1).fill(null).map((_, index) => (
    <Card key={`${product.id}-${index}`} ...>

// With:
{products.filter(...).map((product) => (
  <Card key={product.id} ...>
```

Also fix: the `handleUpload` function uses `acceptedFiles.forEach(async (...) => { ... })`. `forEach` does not await async callbacks, meaning upload errors and `showAlert` calls will fire out of sequence. Replace with `Promise.all`:

```ts
// Replace:
acceptedFiles.forEach(async (file) => {
  // ... upload logic
});

// With:
await Promise.all(
  acceptedFiles.map(async (file) => {
    // ... upload logic
  })
);
```

Also remove the `any` cast on line ~139: `(acceptedFiles[0] as any).path` — use a type assertion comment or a runtime check instead:

```ts
// Replace the unsafe any cast:
const rawPath = (acceptedFiles[0] as unknown as { path?: string }).path ?? "";
let folderName = rawPath.split(/[/\\]/)[1] ?? rawPath.split(/[/\\]/)[0] ?? "New Folder";
```

---

## Fix 2: Add React.lazy + Suspense code splitting to App.tsx

**File**: `src/App.tsx`

### Step 1: Convert all page imports to lazy imports

Replace all static page imports with `React.lazy`. The import statements start around line 33. Convert all of them. Example pattern:

```tsx
// Remove all static page imports like:
// import DashboardPage from "./pages";
// import SignInPage from "./pages/authentication/sign-in";
// ... etc

// Add at the top of the file (keep context/component imports static):
import React, { lazy, Suspense } from "react";
import LoadingPage from "./pages/pages/loading"; // keep this static — used as fallback

// Replace each page import with lazy:
const DashboardPage = lazy(() => import("./pages"));
const SignInPage = lazy(() => import("./pages/authentication/sign-in"));
const HomePage = lazy(() => import("./pages/landing/home"));
// ... convert ALL remaining page imports the same way
```

Do this for every page import in the file. Keep these imports STATIC (not lazy):
- `./components/AlertComponent`
- `./components/FlowbiteWrapper`
- `./components/ProtectedRoute`
- `./components/stripe/OrderSuccess`
- `./components/stripe/OrderCancel`
- All context providers
- `./pages/pages/loading` (used as Suspense fallback)

### Step 2: Wrap Routes in Suspense

Wrap the `<Routes>` element with `<Suspense>`:

```tsx
<Suspense fallback={<LoadingPage />}>
  <Routes>
    {/* all existing routes unchanged */}
  </Routes>
</Suspense>
```

---

## Rules
- Do not use the `any` type.
- Do not use the non-null assertion operator (!).
- Use double quotes for strings.
- Preserve all existing routes, provider ordering, and component structure.
- Generate complete files — no placeholders.
```

---

## Task 6 — Fix ConversationContext Lazy Message Loading

**Estimated files changed**: 1  
**Estimated time**: 30–40 min  
**Dependencies**: None

---

### Prompt

```
You are a senior React/TypeScript developer. Refactor `src/context/ConversationContext.tsx` to stop loading all messages for all conversations on mount.

---

## Problem

The current `fetchConversations` call fetches every conversation with all its messages and participants in one query:

```ts
await supabase.from("conversations").select("*, chat_messages(*), conversation_participants(*)");
```

In production this loads potentially thousands of messages that the user will never read.

---

## Required changes

### 1. Change the initial fetch to NOT load messages

```ts
// Fetch conversations + participants only — no messages
const { data, error } = await supabase
  .from("conversations")
  .select("*, conversation_participants(*)");

// Map to Conversation shape with empty messages array
const mapped: Conversation[] = rows.map((row) => ({
  ...row,
  messages: [], // populated on demand
  participants: Array.isArray(row.conversation_participants)
    ? row.conversation_participants
    : [],
}));
```

### 2. Add a `loadMessages` function to the context

Expose a `loadMessages(conversationId: string)` function that fetches messages for a specific conversation (paginated), sorted oldest-first, and merges them into the local state:

```ts
/**
 * Fetches and caches the most recent 50 messages for the given conversation.
 * Safe to call multiple times — deduplicates by id before storing.
 *
 * @param conversationId - The conversation to load messages for.
 * @returns The fetched messages, or an empty array on error.
 */
const loadMessages = useCallback(async (conversationId: string): Promise<ChatMessageRow[]> => {
  if (!isNonEmptyString(conversationId)) return [];

  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .range(0, 49); // load 50 most recent messages

  if (error) {
    showAlert(error.message, "error");
    return [];
  }

  const fetched = (data ?? []) as ChatMessageRow[];

  // Merge into conversation state, deduplicating by id
  setConversations((prev) =>
    prev.map((c) => {
      if (c.id !== conversationId) return c;
      const existingIds = new Set(c.messages.map((m) => m.id));
      const newMessages = fetched.filter((m) => !existingIds.has(m.id));
      const merged = [...c.messages, ...newMessages].sort((a, b) => {
        const at = a.created_at ? Date.parse(a.created_at) : 0;
        const bt = b.created_at ? Date.parse(b.created_at) : 0;
        return at - bt;
      });
      return { ...c, messages: merged };
    })
  );

  return fetched;
}, [showAlert]);
```

### 3. Update `listMessagesByConversationId` to use `loadMessages`

Replace the existing implementation with:

```ts
const listMessagesByConversationId = useCallback(async (
  conversationId: string
): Promise<ChatMessageRow[]> => {
  if (!isNonEmptyString(conversationId)) return [];

  // Return from cache if already loaded
  const conv = conversations.find((c) => c.id === conversationId);
  if (conv && conv.messages.length > 0) {
    return conv.messages;
  }

  // Otherwise load from DB and cache
  return loadMessages(conversationId);
}, [conversations, loadMessages]);
```

### 4. Add `loadMessages` to the context interface and value

```ts
interface ConversationContextProps {
  // ... existing fields
  loadMessages: (conversationId: string) => Promise<ChatMessageRow[]>;
}

// In useMemo value:
const value = useMemo(() => ({
  // ... existing
  loadMessages,
  listMessagesByConversationId,
}), [/* ... existing deps */, loadMessages, listMessagesByConversationId]);
```

### 5. Keep the realtime subscription for chat_messages unchanged

The existing INSERT/UPDATE/DELETE handlers for chat messages (which update local state) should remain exactly as-is. They ensure real-time messages still appear instantly once a conversation is open.

---

## Rules
- Do not use the `any` type.
- Do not use the non-null assertion operator (!).
- Use double quotes for strings.
- Generate the complete file — no placeholders.
- All existing CRUD functions (createMessage, updateMessage, deleteMessage, etc.) must remain unchanged.
```

---

## Task 7 — Route-Scoped Context Providers (Architecture Refactor)

**Estimated files changed**: 2 (App.tsx + 1 new file)  
**Estimated time**: 45–60 min  
**Dependencies**: Task 5 (lazy loading must be done first so App.tsx is up to date)

> ⚠️ This is the largest architectural change. Read the full `src/App.tsx` before starting.

---

### Prompt

```
You are a senior React/TypeScript developer. Refactor `src/App.tsx` to scope context providers to the routes that need them, instead of wrapping the entire app in all 36 providers. This is the single highest-impact performance change.

---

## Context groupings to create

Create a new file `src/context/RouteContextBundles.tsx` that exports named wrapper components. Each component wraps its children in only the providers that its corresponding route group needs.

### Bundle 1: ProductContextBundle

Needed by: `/products/*`, `/stocks/*`

Providers to include (in this order, innermost to outermost):
`BrandProvider`, `DepartmentProvider`, `RangeProvider`, `CategoryProvider`,
`ProductCategoryProvider`, `ProductSizeProvider`, `ProductColorProvider`,
`ProductMediaProvider`, `ProductFolderMediaProvider`, `ProductFolderProvider`,
`ProductEventProvider`, `ProductStockLogProvider`, `ProductStockProvider`,
`ProductProvider`, `ProductPurchaseOrderProvider`, `ProductReportProvider`

### Bundle 2: PostContextBundle

Needed by: `/posts/*`

Providers: `PostMediaProvider`, `PostFolderMediaProvider`, `PostFolderProvider`, `PostProvider`

### Bundle 3: OrderContextBundle

Needed by: `/orders/*`, `/payments/*`, `/cart`, `/checkout`, `/order-success`, `/order-cancel`, `/order-details/*`

Providers: `AddToCartLogProvider`, `AddToCartProvider`, `OrderProvider`, `PaymentProvider`, `WishlistProvider`

### Bundle 4: CommunityContextBundle

Needed by: `/support`, `/internal-chat`, `/support-chat`

Providers: `CommunityProvider`, `GroupProvider`, `ConversationParticipantProvider`, `TicketProvider`, `TicketStatusLogProvider`, `ConversationProvider`

### Bundle 5: AnalyticsContextBundle

Needed by: `/analytics/*`

Providers: `ProductProvider` (re-use the ProductContextBundle), `OrderProvider`
Note: Analytics pages need product + order data. Nest the relevant sub-bundles.

---

## RouteContextBundles.tsx structure

```tsx
import React from "react";
import { BrandProvider } from "./product/BrandContext";
// ... import all providers

/**
 * Provides all product-related contexts.
 * Used by /products/* and /stocks/* routes.
 */
export const ProductContextBundle: React.FC<React.PropsWithChildren> = ({ children }) => (
  <BrandProvider>
    <DepartmentProvider>
      {/* ... nest all providers in order ... */}
        {children}
      {/* ... */}
    </DepartmentProvider>
  </BrandProvider>
);

// ... repeat pattern for each bundle
```

---

## App.tsx changes

### Step 1: Remove ALL providers from ProviderComposer except these 3 global ones:
- `AuthProvider`
- `PointsMembershipProvider`
- `UserProvider`

### Step 2: Replace ProviderComposer with direct nesting for just those 3:

```tsx
<AlertProvider>
  <AuthProvider>
    <PointsMembershipProvider>
      <UserProvider>
        <AlertComponent />
        <BrowserRouter>
          <DndProvider backend={HTML5Backend}>
            <Suspense fallback={<LoadingPage />}>
              <Routes>
                {/* ... routes with bundles applied ... */}
              </Routes>
            </Suspense>
          </DndProvider>
        </BrowserRouter>
      </UserProvider>
    </PointsMembershipProvider>
  </AuthProvider>
</AlertProvider>
```

### Step 3: Wrap route groups with their bundles

```tsx
{/* Product + Stock routes */}
<Route path="/products/*" element={<ProductContextBundle><Outlet /></ProductContextBundle>} />
<Route path="/stocks/*" element={<ProductContextBundle><Outlet /></ProductContextBundle>} />

{/* Post routes */}
<Route path="/posts/*" element={<PostContextBundle><Outlet /></PostContextBundle>} />

{/* Order / Payment / Cart routes */}
<Route path="/orders/*" element={<OrderContextBundle><Outlet /></OrderContextBundle>} />
<Route path="/payments/*" element={<OrderContextBundle><Outlet /></OrderContextBundle>} />
<Route path="/cart" element={<OrderContextBundle><CartPage /></OrderContextBundle>} />
<Route path="/checkout" element={<OrderContextBundle><CheckoutPage /></OrderContextBundle>} />
<Route path="/order-success" element={<OrderContextBundle><OrderSuccess /></OrderContextBundle>} />
<Route path="/order-cancel" element={<OrderContextBundle><OrderCancel /></OrderContextBundle>} />
<Route path="/order-details/:orderId" element={<OrderContextBundle><CustomerOrderDetailPage /></OrderContextBundle>} />
<Route path="/wishlist" element={<OrderContextBundle><WishlistPage /></OrderContextBundle>} />

{/* Support / Chat routes */}
<Route path="/support" element={<CommunityContextBundle><SupportPage /></CommunityContextBundle>} />
<Route path="/internal-chat" element={<CommunityContextBundle><InternalChat /></CommunityContextBundle>} />
<Route path="/support-chat" element={<CommunityContextBundle><ChatWindow /></CommunityContextBundle>} />

{/* Home page builder needs HomePageElementProvider */}
<Route path="/home-page-builder" element={
  <HomePageElementProvider><HomePageBuilder /></HomePageElementProvider>
} />

{/* Analytics needs product + order data */}
<Route path="/analytics/*" element={
  <ProductContextBundle>
    <OrderContextBundle>
      <Outlet />
    </OrderContextBundle>
  </ProductContextBundle>
} />
```

Routes that don't need any special context (sign-in, landing, legal, 404, etc.) remain as-is with no bundle wrapper.

Remove `ProviderComposer` entirely from App.tsx once all providers are moved to route bundles.

---

## Important: check for cross-bundle dependencies

Before finalising, verify that no component inside a bundle tries to consume a context from a different bundle (e.g., an `/orders` page importing `useProductContext`). If such a dependency exists, either:
a) Add the required provider to the bundle that needs it, or  
b) Add it to the global root providers.

---

## Rules
- Do not use the `any` type.
- Do not use the non-null assertion operator (!).
- Use double quotes for strings.
- Preserve all existing route paths and component assignments exactly.
- Generate complete files for both `src/App.tsx` and `src/context/RouteContextBundles.tsx`.
- No placeholders.
```

---

## Execution Order Summary

| # | Task | Files Changed | Priority |
|---|------|--------------|----------|
| 1 | Correctness bugs + console.log cleanup | `ProductContext.tsx`, `list.tsx`, `OrderContext.tsx` | 🔴 Do first |
| 2 | OrderContext memoization fix | `OrderContext.tsx` | 🔴 Do second |
| 3 | UserContext N+1 + PaymentContext all-users | `UserContext.tsx`, `PaymentContext.tsx` | 🔴 High |
| 4 | ProductListPage rendering fixes | `list.tsx` | 🟠 High |
| 5 | CreateProductPage + App.tsx lazy loading | `create-product-page.tsx`, `App.tsx` | 🟠 High |
| 6 | ConversationContext lazy messages | `ConversationContext.tsx` | 🟠 High |
| 7 | Route-scoped provider bundles | `App.tsx`, `RouteContextBundles.tsx` | 🟠 Do last (largest change) |

> **Tip**: After completing Tasks 1–3, manually test the app to confirm the correctness fixes are working before proceeding to the architectural changes in Tasks 5–7.
