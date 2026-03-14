# Performance Fix Agent Prompts — Round 3 (2026)

> **For the implementer:** Each section below is a self-contained prompt for a separate agent run. Copy the full section content when passing to the agent. Each agent works on a distinct set of files with no overlap.

---

## AGENT 1 — Home Page: Placeholder Image + Math.random() Price Fix

### Your Task

You are a senior TypeScript/React developer. Fix two code quality issues in the customer-facing home page and one component:

1. Move `makePlaceholderImageUrl` from inside the `HomePage` component body to **module scope** — it has no closure dependencies and is currently recreated on every render.
2. Replace `Math.random()` used as a price fallback in JSX with a static string `"—"`.
3. Replace the `"https://via.placeholder.com/300x200?text=Image"` last-resort string in `HomeHighlightsCard.tsx` with an inline SVG data URI, same as the existing `makePlaceholderImageUrl` pattern.

### Background

- `home.tsx` already has a `makePlaceholderImageUrl` function (lines 106–113) that builds an SVG data URI — but it is defined **inside** the `HomePage` component, so React recreates a new function reference every render. It should be at module scope.
- On line ~726 in `home.tsx`, product price has a fallback: `product.price?.toFixed(2) || (Math.random() * 100).toFixed(2)`. This causes a different price to render on every re-render cycle. Replace with the static string `"—"`.
- `HomeHighlightsCard.tsx` has a `resolveImageUrl` helper that returns `"https://via.placeholder.com/300x200?text=Image"` as a last resort (line 53). This fires an external HTTP request every time a card has no image and no fallback. Replace with the same SVG data URI approach.

### SVG data URI pattern to use (use this exact template):

```ts
/**
 * Generates a local SVG data-URI placeholder image with centred text.
 * No external HTTP requests — the SVG is embedded directly.
 */
function makePlaceholderImageUrl(text: string): string {
  const safeText = text.replace(/[<>&"]/g, (ch) => {
    const escapes: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", "\"": "&quot;" };
    return escapes[ch] ?? ch;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="#e5e7eb"/><text x="150" y="105" font-family="sans-serif" font-size="14" fill="#6b7280" text-anchor="middle">${safeText}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
```

### File 1: `src/pages/landing/home.tsx`

**Change 1:** Move `makePlaceholderImageUrl` from inside `HomePage` (currently at lines 106–113) to **module scope** — place it between the `formatProductCount` helper and the `ScrollableSection` component definition, or at the very top after imports. The function body and JSDoc do not change.

**Change 2:** Find the Products section `renderItem` in the JSX (around line 726):
```tsx
// BEFORE:
RM {product.price?.toFixed(2) || (Math.random() * 100).toFixed(2)}

// AFTER:
RM {product.price?.toFixed(2) ?? "—"}
```

**What stays the same:** All other logic, hooks, memoized values, effects, and JSX are unchanged.

### File 2: `src/components/home/HomeHighlightsCard.tsx`

**Change:** Add a module-scoped constant for the fallback placeholder, and use it in `resolveImageUrl`:

```ts
// Add at module scope, before resolveImageUrl:
const FALLBACK_PLACEHOLDER_IMAGE = makePlaceholderImageUrl("Image");

// The makePlaceholderImageUrl function (module-scoped):
function makePlaceholderImageUrl(text: string): string {
  const safeText = text.replace(/[<>&"]/g, (ch) => {
    const escapes: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", "\"": "&quot;" };
    return escapes[ch] ?? ch;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="#e5e7eb"/><text x="150" y="105" font-family="sans-serif" font-size="14" fill="#6b7280" text-anchor="middle">${safeText}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// In resolveImageUrl, replace:
//   return "https://via.placeholder.com/300x200?text=Image";
// with:
  return FALLBACK_PLACEHOLDER_IMAGE;
```

**What stays the same:** The `HomeHighlightsCardProps` interface, `resolveImageUrl` function signature, and the JSX component are otherwise unchanged.

---

### CODING STANDARDS (mandatory)
1. Output the complete modified file(s) — no placeholders or `// ... rest of code` comments.
2. TypeScript strict — no `any`, no `!` non-null assertion, no `as unknown as T`.
3. Double quotes `"` for all strings. Template literals for string concatenation.
4. JSDoc comments on all exported functions and complex logic blocks.
5. All async operations must have proper `try/catch` error handling.
6. `process.env.NODE_ENV === "development"` guard around all `console.error` / `console.log` calls.
7. No `// eslint-disable` comments in output — fix the root cause instead.

---

---

## AGENT 2 — Chat & Wishlist: console.error Cleanup

### Your Task

You are a senior TypeScript/React developer. Guard bare `console.error` and `console.warn` calls in two files so they only run in development mode.

### Background

Round 2 already guarded the `console.log` calls in `Chat.tsx`, but left three `console.error` calls unguarded. `WishlistContext.tsx` was not touched in previous rounds and has raw `console.warn` and `console.error` calls that fire in production.

The fix pattern in both cases is:
```tsx
// BEFORE:
console.error("Error message", someData);

// AFTER:
if (process.env.NODE_ENV === "development") {
  console.error("Error message", someData);
}
```

### File 1: `src/pages/landing/Chat.tsx`

The following three `console.error` calls are **not yet guarded** (the `console.log` calls above them were guarded in Round 2 — do not change those):

**Line ~246:**
```tsx
// BEFORE:
if (!ticket?.id) {
  console.error("Failed to create ticket");
  return;
}

// AFTER:
if (!ticket?.id) {
  if (process.env.NODE_ENV === "development") {
    console.error("Failed to create ticket");
  }
  return;
}
```

**Line ~258:**
```tsx
// BEFORE:
if (!created?.id) {
  console.error("Failed to create conversation");
  return;
}

// AFTER:
if (!created?.id) {
  if (process.env.NODE_ENV === "development") {
    console.error("Failed to create conversation");
  }
  return;
}
```

**Line ~278:**
```tsx
// BEFORE:
} catch (error) {
  console.error("Error creating ticket and conversation:", error);
}

// AFTER:
} catch (error) {
  if (process.env.NODE_ENV === "development") {
    console.error("Error creating ticket and conversation:", error);
  }
}
```

**Do not change** any other logic, hooks, imports, or JSX.

### File 2: `src/context/WishlistContext.tsx`

Four logging calls need dev guards:

**Line ~133 in `fetchWishlist`:**
```tsx
// BEFORE:
console.warn("Wishlist table does not exist yet. Skipping fetch.");

// AFTER:
if (process.env.NODE_ENV === "development") {
  console.warn("Wishlist table does not exist yet. Skipping fetch.");
}
```

**Line ~137 in `fetchWishlist`:**
```tsx
// BEFORE:
console.error("Failed to fetch wishlist:", error);

// AFTER:
if (process.env.NODE_ENV === "development") {
  console.error("Failed to fetch wishlist:", error);
}
```

**Line ~182 in `addToWishlist`:**
```tsx
// BEFORE:
console.error("Failed to add to wishlist:", error);

// AFTER:
if (process.env.NODE_ENV === "development") {
  console.error("Failed to add to wishlist:", error);
}
```

**Line ~223 in `removeFromWishlist`:**
```tsx
// BEFORE:
console.error("Failed to remove from wishlist:", error);

// AFTER:
if (process.env.NODE_ENV === "development") {
  console.error("Failed to remove from wishlist:", error);
}
```

**Do not change** anything else in `WishlistContext.tsx` — all the `useCallback`, `useMemo`, realtime subscriptions, and functional setState patterns are already correct.

---

### CODING STANDARDS (mandatory)
1. Output the complete modified file(s) — no placeholders or `// ... rest of code` comments.
2. TypeScript strict — no `any`, no `!` non-null assertion, no `as unknown as T`.
3. Double quotes `"` for all strings. Template literals for string concatenation.
4. JSDoc comments on all exported functions.
5. All async operations must have proper `try/catch` error handling.
6. `process.env.NODE_ENV === "development"` guard around all `console.error` / `console.log` / `console.warn`.
7. No `// eslint-disable` comments in output.

---

---

## AGENT 3 — Stock Pages & Context: console Cleanup

### Your Task

You are a senior TypeScript/React developer. Remove or guard `console.log` and `console.error` calls in four files related to the stock management module.

### Background

Several stock-related files have bare console calls that run in production:
- `ProductStockLogContext.tsx` has ~9 bare `console.error` calls.
- `stocks/report.tsx` has 2 `console.log` calls at the TOP of the component body (they fire on every render).
- `stocks/list.tsx` has 1 bare `console.log(products)` call.
- `stocks/create-purchase-order.tsx` has 1 bare `console.log(productId, productEventId)`.

Remove the debug-only ones (component-body dumps that serve no production purpose) and guard the error-handling ones.

### File 1: `src/context/product/ProductStockLogContext.tsx`

Wrap all bare `console.error(...)` calls with dev guards. The calls occur at approximately these locations:
- Inside `fetchProductStockLogs`: `console.error(logError)` and `console.error(stockError)` and `console.error("Failed to fetch product stock logs:", error)`
- Inside `handleRealtimeChanges`: `console.error(error)` in the INSERT branch
- Inside `createProductStockLog`: `console.error(error)` after insert error, `console.error(stockError)` after stock fetch error, `console.error("Failed to create product stock log:", error)` in catch
- Inside `updateProductStockLog`: `console.error(error)` and `console.error("Failed to update product stock log:", error)`
- Inside `deleteProductStockLog`: `console.error(error)` and `console.error("Failed to delete product stock log:", error)`

Pattern for each:
```tsx
// BEFORE:
console.error(logError);

// AFTER:
if (process.env.NODE_ENV === "development") {
  console.error(logError);
}
```

### File 2: `src/pages/stocks/report.tsx`

**Lines 22–23:** Remove the two top-level debug logs entirely (they dump context state on every render):
```tsx
// REMOVE THESE LINES:
console.log("product_reports", product_reports);
console.log("product_purchase_orders", product_purchase_orders);
```

There is also a `.flatMap(report => Array(10).fill(null).map(...))` rendering pattern that is suspicious but is existing behaviour — do NOT change the rendering logic. Only remove the console.log lines.

### File 3: `src/pages/stocks/list.tsx`

**Line 22:** Remove the component-body debug dump:
```tsx
// REMOVE THIS LINE:
console.log(products);
```

The line appears right after the `if (loading) return <LoadingPage />` early return. Simply delete it.

### File 4: `src/pages/stocks/create-purchase-order.tsx`

**Line 40:** Remove the debug log that fires on every render:
```tsx
// REMOVE THIS LINE:
console.log(productId, productEventId);
```

The line appears right after the `useParams()` call. Simply delete it.

---

### CODING STANDARDS (mandatory)
1. Output the complete modified file(s) — no placeholders or `// ... rest of code` comments.
2. TypeScript strict — no `any` types added (existing `any` in `create-purchase-order.tsx` for `formData.terms` and `productOrderEntries` are pre-existing — do NOT change them).
3. Double quotes `"` for all strings.
4. JSDoc on all exported functions.
5. `process.env.NODE_ENV === "development"` guard around any remaining `console.error` / `console.log`.
6. No `// eslint-disable` comments in output.

---

---

## AGENT 4 — Analytics, Posts & Products: console Cleanup

### Your Task

You are a senior TypeScript/React developer. Remove bare `console.log` calls from five pages in the analytics, posts, and products admin sections.

### Background

These are leftover debug statements from development that have no production value. They run on every render (some are in the component body directly) or on user interactions.

### File 1: `src/pages/analytics/products-inner.tsx`

**Line 17:** Remove `console.log(products)` from the component body. This file renders analytics data for internal use — no other logic changes are needed.

```tsx
// REMOVE THIS LINE:
console.log(products);
```

### File 2: `src/pages/analytics/categories.tsx`

**Line 82:** Remove `console.log(products)` from the component body.

```tsx
// REMOVE THIS LINE:
console.log(products);
```

### File 3: `src/pages/posts/post-editor.tsx`

**Lines 66–67:** Guard the two console calls inside the save handler:
```tsx
// BEFORE:
console.log("Save post");
console.log(postData);

// AFTER:
if (process.env.NODE_ENV === "development") {
  console.log("Save post");
  console.log(postData);
}
```

### File 4: `src/pages/products/add-stock-modal.tsx`

**Line 25:** Remove the commented-out `// console.log(productStocks);` entirely (dead code).

**Line 48:** Guard `console.log(stockLogs)`:
```tsx
// BEFORE:
console.log(stockLogs);

// AFTER:
if (process.env.NODE_ENV === "development") {
  console.log(stockLogs);
}
```

### File 5: `src/pages/products/add-return-modal.tsx`

**Line 48:** Guard `console.log(stockLogs)`:
```tsx
// BEFORE:
console.log(stockLogs);

// AFTER:
if (process.env.NODE_ENV === "development") {
  console.log(stockLogs);
}
```

---

### CODING STANDARDS (mandatory)
1. Output the complete modified file(s) — no placeholders or `// ... rest of code` comments.
2. TypeScript strict — no `any` types added; pre-existing `any` types are OK to keep.
3. Double quotes `"` for all strings.
4. JSDoc on all exported functions.
5. `process.env.NODE_ENV === "development"` guard around all `console.error` / `console.log`.
6. No `// eslint-disable` comments in output.

---

---

## AGENT 5 — Category Page & Internal Chat: Correctness + Log Cleanup

### Your Task

You are a senior TypeScript/React developer. Fix two correctness bugs and clean up logging in three files:

1. `category-page.tsx`: Replace `Math.random()` used for Supabase storage upload file IDs with `crypto.randomUUID()`, and guard the 4 bare `console.error` upload-error calls.
2. `internal-chat/index.tsx`: Wrap all bare `console.log` and `console.error` calls with dev guards.
3. `components/stripe/CheckoutButton.tsx`: Guard 2 bare `console.log` debug dumps.

### Background

**`Math.random()` for file IDs is a correctness bug.** `Math.random().toString(36).substring(2)` produces short strings (~8 chars) with very high collision probability when multiple uploads happen in the same session. `crypto.randomUUID()` generates a proper UUID (36 chars) with negligible collision risk and is available natively in all modern browsers and Node.js 14+. No import is needed.

**`console.log` in `internal-chat/index.tsx`** fires on every direct message creation, group invite, group creation, and community creation action — high-frequency paths that spam the DevTools in production.

### File 1: `src/pages/products/category-page.tsx`

There are **four** upload handlers, each using the same `Math.random()` pattern. Fix all of them:

**Pattern in `handleUpdateCategory` (line ~79), `handleSaveBrand` (line ~176), `handleSaveDepartment` (line ~215), and `handleSaveRange` (line ~254):**

```tsx
// BEFORE (in every handler):
const randomId = Math.random().toString(36).substring(2);
const { data, error } = await supabase.storage
  .from("product_medias")
  .upload(`${randomId}`, file, {
    cacheControl: "3600",
    upsert: false,
  });
if (error) {
  console.error(error);
  showAlert("Failed to upload file", "error");
  return;
}

// AFTER:
const uploadId = crypto.randomUUID();
const { data, error } = await supabase.storage
  .from("product_medias")
  .upload(uploadId, file, {
    cacheControl: "3600",
    upsert: false,
  });
if (error) {
  if (process.env.NODE_ENV === "development") {
    console.error(error);
  }
  showAlert("Failed to upload file", "error");
  return;
}
```

Apply this change to all four handlers. The rest of the file (category tree logic, form handlers, branded/department/range CRUD, JSX rendering) stays exactly the same.

**Also fix line ~357:**
```tsx
// BEFORE:
<Button color={"info"} onClick={() => handleUpdateCategory(selectedCategory!)} className="mt-4 w-full">Save</Button>

// AFTER — remove the non-null assertion:
<Button color={"info"} onClick={() => { if (selectedCategory) handleUpdateCategory(selectedCategory); }} className="mt-4 w-full">Save</Button>
```

### File 2: `src/pages/internal-chat/index.tsx`

Wrap the following bare console calls. Do **not** remove them entirely — they are useful in development:

**Lines ~63–65 (`[DirectChat Debug]`):**
```tsx
// BEFORE:
console.log("[DirectChat Debug]", {
  ...
});

// AFTER:
if (process.env.NODE_ENV === "development") {
  console.log("[DirectChat Debug]", {
    ...
  });
}
```

**Lines ~92–95 (`[DirectChat Debug - Names]`):**
```tsx
if (process.env.NODE_ENV === "development") {
  console.log("[DirectChat Debug - Names]", { ... });
}
```

**Lines ~259, ~267 (`[InternalChat] Creating direct conversation` / `ready`):**
```tsx
if (process.env.NODE_ENV === "development") {
  console.log("[InternalChat] Creating direct conversation", { ... });
}
// and:
if (process.env.NODE_ENV === "development") {
  console.log("[InternalChat] Direct conversation ready", { ... });
}
```

**Lines ~279, ~286 (`console.error` — no group selected, no conversation for group):**
```tsx
if (process.env.NODE_ENV === "development") {
  console.error("[InternalChat] No group selected for invitation");
}
// and:
if (process.env.NODE_ENV === "development") {
  console.error("[InternalChat] No conversation found for group", selectedChat.id);
}
```

**Lines ~293, ~305 (`[InternalChat] User already in group`, `[InternalChat] User invited`):**
```tsx
if (process.env.NODE_ENV === "development") {
  console.log("[InternalChat] User already in group");
}
if (process.env.NODE_ENV === "development") {
  console.log("[InternalChat] User invited to group successfully", { ... });
}
```

**Lines ~853, ~882 (`[InternalChat] Group created`, `[InternalChat] Community created`):**
```tsx
if (process.env.NODE_ENV === "development") {
  console.log("[InternalChat] Group created", row);
}
if (process.env.NODE_ENV === "development") {
  console.log("[InternalChat] Community created", row);
}
```

**Lines ~272, ~310 (`console.error` — error paths):**
```tsx
if (process.env.NODE_ENV === "development") {
  console.error("[InternalChat] Error starting direct message", e);
}
if (process.env.NODE_ENV === "development") {
  console.error("[InternalChat] Error inviting user to group", e);
}
```

**Line ~479 (`console.error` — error creating group conversation):**
```tsx
if (process.env.NODE_ENV === "development") {
  console.error("[InternalChat] Error creating group conversation:", error);
}
```

Apply the dev guard to **every** bare `console.log` or `console.error` call in this file. Do not change any other logic.

### File 3: `src/components/stripe/CheckoutButton.tsx`

**Lines 79–80:**
```tsx
// BEFORE:
console.log(env, appUrl, portEnv, isDev);
console.log("Condition Check:", isDev);

// AFTER:
if (process.env.NODE_ENV === "development") {
  console.log(env, appUrl, portEnv, isDev);
  console.log("Condition Check:", isDev);
}
```

Do not change any other logic in this file.

---

### CODING STANDARDS (mandatory)
1. Output the complete modified file(s) — no placeholders or `// ... rest of code` comments.
2. TypeScript strict — no `any` types added; pre-existing `any` types in category-page (the `children?: any` in `CategoryUpdate` cast and `any` in `eslint-disable` for unused togglers) must be preserved.
3. Double quotes `"` for all strings. Template literals for string concatenation.
4. JSDoc comments on all exported functions.
5. All async operations must have proper `try/catch` error handling.
6. `process.env.NODE_ENV === "development"` guard around all `console.error` / `console.log`.
7. No `// eslint-disable` comments in output — fix root causes instead.
