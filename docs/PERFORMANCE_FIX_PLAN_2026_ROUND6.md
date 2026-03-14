# Performance Fix Plan — Round 6 (2026)

**Status**: Ready for Implementation  
**Audit Date**: March 14, 2026  
**Author**: Senior Dev Code Review  
**Related Docs**: `PERFORMANCE_FIX_PLAN_2026_ROUND5.md`, `PERFORMANCE_FIX_AGENT_PROMPTS_2026_ROUND5.md`

---

## Executive Summary

This Round 6 audit performed a **thorough verification scan** of all files from Rounds 1–5 to confirm fix completion. The result: **Round 4 and Round 5 agents applied their fixes almost completely.** Files previously flagged as unguarded (deleted-products.tsx, chat-window.tsx, ProductDetails.tsx, OrderDetail.tsx, OrdersList.tsx, ProductPurchaseOrderContext.tsx, schedule-product-page.tsx, schedule-post-page.tsx, create-product-page.tsx, create-set-modal.tsx, etc.) **have all been correctly fixed** by prior agents.

**Truly remaining issues (Round 6 scope) are minimal:**

| Priority | Issue | File | Lines |
|----------|-------|------|-------|
| 🟡 Med | 2 `console.error` + 1 `console.warn` without `NODE_ENV` guard | `OrderSuccess.tsx` | 62, 144, 192 |
| 🔵 Low | `key={index}` on order items list — should use stable `item.id` | `orders/detail.tsx` | 393 |

There are only **2 files** and **4 line changes** needed in Round 6.

---

## ✅ Fully Fixed (Do Not Redo) — All Rounds

| Round | Fix | File(s) |
|-------|-----|---------|
| R1 | Route-scoped providers, code splitting, realtime fix, N+1 batch | `App.tsx`, `RouteContextBundles.tsx`, `OrderContext.tsx`, etc. |
| R1 | `ConfirmDeleteModal` move, productMedias O(n²) fix | `products/list.tsx` |
| R1 | `SmartImage`, `ReactDOM.createRoot`, `React.StrictMode` | `index.tsx`, `SmartImage.tsx` |
| R2 | Admin API N+1 removed, `PaymentContext`, `ConversationContext` | `PaymentContext.tsx`, `ConversationContext.tsx` |
| R2 | Sidebar inner components to module scope | `sidebar.tsx` |
| R3 | `makePlaceholderImageUrl`, `Math.random()` price fallback, via.placeholder.com | `home.tsx`, `HomeHighlightsCard.tsx` |
| R4 | `crypto.randomUUID()` for storage uploads | `category-page.tsx` |
| R4 | `console.error` dev-guarded | `Settings.tsx`, `Cart.tsx`, `payments/detail.tsx`, `orders/list.tsx`, `orders/detail.tsx`, `add-stock-modal.tsx`, `add-return-modal.tsx`, `internal-chat/index.tsx`, `landing/Chat.tsx`, `CheckoutButton.tsx` |
| R4 | `console.error` dev-guarded | `schedule-product-page.tsx`, `schedule-post-page.tsx`, `deleted-products.tsx`, `chat-window.tsx`, `ProductDetails.tsx`, `OrderDetail.tsx`, `OrdersList.tsx`, `ProductPurchaseOrderContext.tsx` |
| R5 | `crypto.randomUUID()` in upload handlers | `create-product-page.tsx`, `create-set-modal.tsx`, `create-post-page.tsx` |
| R5 | `console.error/log` dev-guarded | `post-editor.tsx` |
| R5 | `console.error/warn` dev-guarded | `WishlistContext.tsx` |

---

## 🔧 Remaining Issues — Round 6

### Issue 1 — OrderSuccess.tsx: 3 Unguarded Console Calls

**File**: `src/components/stripe/OrderSuccess.tsx`  
**Severity**: 🟡 Medium — This is a critical user-facing payment success flow. Console noise in production leaks error details.

| Line | Call | Context |
|------|------|---------|
| 62 | `console.error(e)` | JSON parse error for fake session data |
| 144 | `console.warn("Failed to create user_points, attempting to fetch again:", createError)` | Points record creation race condition |
| 192 | `console.error(err)` | Catch block for order-creation failure |

**Fix**: Wrap each call with `if (process.env.NODE_ENV === "development") { ... }`.

---

### Issue 2 — orders/detail.tsx: key={index} Anti-pattern

**File**: `src/pages/orders/detail.tsx`  
**Severity**: 🔵 Low — React key anti-pattern causes degraded reconciliation performance when order items are reordered or updated.  
**Line**: 393  
**Context**: `{order.items.map((item, index) => (<div key={index} ...>`

**Fix**: Change `key={index}` to `key={item.id}`. The `id` field is the primary key on `OrderItemRow` and is always present.

---

## Agent Task Breakdown

### Agent 1 — OrderSuccess.tsx console guards

**File**: `src/components/stripe/OrderSuccess.tsx`

Change these 3 calls:

```ts
// Line 62 — BEFORE:
} catch (e) {
  console.error(e);
}

// Line 62 — AFTER:
} catch (e) {
  if (process.env.NODE_ENV === "development") {
    console.error(e);
  }
}
```

```ts
// Line 144 — BEFORE:
console.warn("Failed to create user_points, attempting to fetch again:", createError);

// Line 144 — AFTER:
if (process.env.NODE_ENV === "development") {
  console.warn("Failed to create user_points, attempting to fetch again:", createError);
}
```

```ts
// Line 192 — BEFORE:
} catch (err) {
  console.error(err);
} finally {

// Line 192 — AFTER:
} catch (err) {
  if (process.env.NODE_ENV === "development") {
    console.error(err);
  }
} finally {
```

---

### Agent 2 — orders/detail.tsx key fix

**File**: `src/pages/orders/detail.tsx`

```tsx
// Line 393 — BEFORE:
{order.items.map((item, index) => (
  <div
    key={index}

// Line 393 — AFTER:
{order.items.map((item, index) => (
  <div
    key={item.id ?? String(index)}
```

Note: The `index` parameter is no longer used after this change so it can optionally be removed from the map callback signature: `.map((item) => (`. However, if TypeScript shows any complaints, keeping `index` as an unused parameter is acceptable.

---

## Verification Plan

After both agents apply their fixes:

1. Run `npm run build` (or `npx tsc --noEmit`) — must compile with 0 errors.
2. Search the entire project: `grep -r "console\." src/ | grep -v "NODE_ENV"` — should return **0 results**.
3. Inspect `OrderSuccess.tsx` in browser devtools in production build — no console noise on the success page.
4. Confirm `orders/detail.tsx` renders order items correctly (no React key warnings in devtools).

---

## File Reference

| File | Agent | Change |
|------|-------|--------|
| `src/components/stripe/OrderSuccess.tsx` | Agent 1 | 3 console guards |
| `src/pages/orders/detail.tsx` | Agent 2 | `key={index}` → `key={item.id}` |
