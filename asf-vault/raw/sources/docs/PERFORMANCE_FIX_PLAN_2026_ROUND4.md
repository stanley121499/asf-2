# Performance Fix Plan — Round 4 (2026)

**Status**: Ready for Implementation  
**Audit Date**: March 2026  
**Author**: Senior Dev Code Review  
**Related Docs**: `PERFORMANCE_FIX_PLAN_2026_ROUND3.md`, `PERFORMANCE_FIX_AGENT_PROMPTS_2026_ROUND3.md`

---

## Executive Summary

Round 3 agents were partially applied — several targets (Chat.tsx, internal-chat, CheckoutButton, add-stock-modal, add-return-modal, post-editor) were not touched. Additionally, the codebase audit revealed that the `Math.random()` storage upload ID pattern, partially fixed in Round 3 for `category-page.tsx`, also exists in **four additional files** that handle product and post media uploads, plus in a shared utility `upload.ts`. New coverage of landing and admin pages also uncovered a large surface area of unguarded `console.error` calls in Settings, Cart, payments, schedule, and support pages.

Round 4 is a **comprehensive cleanup** that completes all Round 3 residue AND fixes the newly found production issues.

**Top issues this round:**
1. **`Math.random()` for storage IDs** in `create-set-modal.tsx`, `create-product-page.tsx`, `create-category-modal.tsx`, `create-post-page.tsx`, and `upload.ts` — all need `crypto.randomUUID()`.
2. **`console.log` in `orders/detail.tsx:236`** fires on every status change update (not guarded).
3. **`eslint-disable` comments around `console.error`** in `Cart.tsx:147-161` — wrong approach; should use dev guard instead.
4. **7 bare `console.error`in `Settings.tsx`** — fires in production on avatar upload, profile save, and password update failures.
5. **`Array(1).fill(null)` anti-pattern** in `create-post-page.tsx` — copied from the unfixed version of `create-product-page.tsx`.

---

## ✅ Already Fixed (Do Not Redo)

| Round | Fix | File(s) |
|-------|-----|---------|
| R1 | Route-scoped providers, code splitting, memoization, realtime, N+1 | Many files |
| R2 | Admin API removal, `PaymentContext` name, stale closures | Many files |
| R3 | `makePlaceholderImageUrl` → module scope | `home.tsx` |
| R3 | `Math.random()` price fallback → `"—"` | `home.tsx` |
| R3 | `via.placeholder.com` → SVG URI in `HomeHighlightsCard` | `HomeHighlightsCard.tsx` |
| R3 | `orders/detail.tsx` console.error → dev-guarded | `orders/detail.tsx` |
| R2 | `ProductStockLogContext.tsx` structured and correct | `ProductStockLogContext.tsx` |

---

## 🔧 Remaining / New Issues — Round 4

### Priority A — Correctness

| # | Sev | Issue | File | Agent |
|---|-----|-------|------|-------|
| A1 | 🟠 High | `Math.random().toString(36).substring(2)` used as Supabase storage upload ID — collision-prone | `create-set-modal.tsx:32` | Agent 1 |
| A2 | 🟠 High | Same `Math.random()` upload ID issue | `create-category-modal.tsx:35` | Agent 1 |
| A3 | 🟠 High | Same `Math.random()` upload ID in bulk upload handler (called for every file in a folder drop) | `create-product-page.tsx:89` | Agent 1 |
| A4 | 🟠 High | Same `Math.random()` upload ID | `create-post-page.tsx:73` | Agent 1 |
| A5 | 🟡 Med | `upload.ts:18`: shared utility uses `Math.random().toString(36).slice(2, 8)` as part of file path | `utils/upload.ts:18` | Agent 1 |
| A6 | 🟡 Med | `create-post-page.tsx:161,217`: `Array(1).fill(null).map(...)` anti-pattern for post folder and post list rendering — extra array overhead with no purpose | `create-post-page.tsx:161,217` | Agent 1 |

### Priority B — Round 3 Residue (Agents not applied)

| # | Sev | Issue | File | Agent |
|---|-----|-------|------|-------|
| B1 | 🟡 Med | 3 bare `console.error` left after Round 3 (only `console.log` was done) | `Chat.tsx:247,261,283` | Agent 2 |
| B2 | 🟡 Med | 15+ bare `console.log`/`console.error` in DM/group/community hot paths | `internal-chat/index.tsx` | Agent 2 |
| B3 | 🟡 Med | 2 bare `console.log` env-dump debug calls | `CheckoutButton.tsx:80,81` | Agent 2 |
| B4 | 🔵 Low | `console.log(stockLogs)` unguarded | `add-stock-modal.tsx:48` | Agent 2 |
| B5 | 🔵 Low | `console.log(stockLogs)` unguarded | `add-return-modal.tsx:49` | Agent 2 |
| B6 | 🔵 Low | `console.log("Save post")` + `console.log(postData)` in save handler | `post-editor.tsx:67,68` | Agent 2 |

### Priority C — New Pages: console.error Cleanup

| # | Sev | Issue | File | Agent |
|---|-----|-------|------|-------|
| C1 | 🟡 Med | 7 bare `console.error` in avatar upload, profile save, password update flows | `Settings.tsx:75,136,148,154,171,184,192,206,213` | Agent 3 |
| C2 | 🟡 Med | 4 `console.error` with `// eslint-disable-next-line no-console` → should be dev-guarded instead; these fire in prod on cart hydration failures | `Cart.tsx:148,152,156,160` | Agent 3 |
| C3 | 🟡 Med | 3 bare `console.error` in payment detail fetch and status update | `payments/detail.tsx:271,302,343` | Agent 3 |
| C4 | 🟡 Med | 3 bare `console.error` in order list fetch | `orders/list.tsx:207,227,265` | Agent 3 |
| C5 | 🟡 Med | `console.log(...)` at line 236 in status update handler — unguarded (the `console.error` calls are already guarded in the same file) | `orders/detail.tsx:236` | Agent 3 |
| C6 | 🔵 Low | 2 bare `console.error` in schedule upload handlers | `schedule-product-page.tsx:152,168` | Agent 4 |
| C7 | 🔵 Low | 2 bare `console.error` in post schedule upload handlers | `schedule-post-page.tsx:145,161` | Agent 4 |
| C8 | 🔵 Low | 2 bare `console.error` in deleted products fetch and restore | `deleted-products.tsx:43,67` | Agent 4 |
| C9 | 🔵 Low | 1 bare `console.error` in support chat attachment upload | `support/chat-window.tsx:50` | Agent 4 |
| C10 | 🔵 Low | 1 bare `console.error` in product availability check | `ProductDetails.tsx:106` | Agent 4 |
| C11 | 🔵 Low | 1 bare `console.error` in order detail fetch | `landing/OrderDetail.tsx:86` | Agent 4 |
| C12 | 🔵 Low | 1 bare `console.error` in order items fetch | `landing/components/OrdersList.tsx:40` | Agent 4 |
| C13 | 🔵 Low | 1 bare `console.error` in purchase order entry fetch | `ProductPurchaseOrderContext.tsx:165` | Agent 4 |

---

## Agent Task Breakdown

### Agent 1 — `Math.random()` Upload IDs + `Array(1).fill()` Anti-Pattern

**Files:**
- `src/pages/products/create-set-modal.tsx` — 1 upload handler
- `src/pages/products/create-category-modal.tsx` — 1 upload handler
- `src/pages/products/create-product-page.tsx` — 1 upload handler (bulk, per-file)
- `src/pages/posts/create-post-page.tsx` — 1 upload handler + `Array(1).fill()` anti-pattern
- `src/utils/upload.ts` — shared utility

**Key changes:**
1. In all 4 page files: replace `Math.random().toString(36).substring(2)` with `crypto.randomUUID()`. Note: `create-product-page.tsx` appends a file extension after the ID (`${randomId}${ext}`), so change only the `randomId` variable: `const uploadId = crypto.randomUUID();` then use `const storagePath = \`${uploadId}${ext}\`;`.
2. In `upload.ts:18`: replace `${timestamp}-${Math.random().toString(36).slice(2, 8)}-${safeName}` with `${timestamp}-${crypto.randomUUID().slice(0, 8)}-${safeName}` (keep timestamp prefix for ordering; use UUID slice as uniquifier).
3. In `create-post-page.tsx`: fix the `Array(1).fill(null)` rendering anti-patterns:
   - Post folders list (line ~161): Change `postFolders.map((folder) => Array(1).fill(null).map((_, index) => <Card key={\`${folder.id}-${index}\`} ...>))` → simply `postFolders.map((folder) => <Card key={folder.id} ...>)`.
   - Posts list (line ~217): Change `posts.filter(...).flatMap((post) => Array(1).fill(null).map((_, index) => <Card key={\`${post.id}-${index}\`} ...>))` → `posts.filter(...).map((post) => <Card key={post.id} ...>)`.

Also guard the `console.error` calls in all 4 files with `process.env.NODE_ENV === "development"`.

---

### Agent 2 — Round 3 Residue: Chat, Internal Chat, CheckoutButton, Post & Stock Modals

**Files:**
- `src/pages/landing/Chat.tsx`
- `src/pages/internal-chat/index.tsx`
- `src/components/stripe/CheckoutButton.tsx`
- `src/pages/products/add-stock-modal.tsx`
- `src/pages/products/add-return-modal.tsx`
- `src/pages/posts/post-editor.tsx`

**Key changes:** These are all identical to the Round 3 Agent 2–5 prompts that were not applied. Wrap every bare `console.log` and `console.error` with `if (process.env.NODE_ENV === "development") { ... }`. Refer to `PERFORMANCE_FIX_AGENT_PROMPTS_2026_ROUND3.md` Agent 2, Agent 4, and Agent 5 for exact line numbers and before/after snippets.

---

### Agent 3 — Settings, Cart, Payments, Orders: console.error Cleanup

**Files:**
- `src/pages/landing/Settings.tsx`
- `src/pages/landing/Cart.tsx`
- `src/pages/payments/detail.tsx`
- `src/pages/orders/list.tsx`
- `src/pages/orders/detail.tsx` (only line 236)

**Key changes:**

1. **`Settings.tsx`** — 9 `console.error` calls: wrap all with dev guards (avatar upload error, profile image update fail, save profile errors ×2, password update error, unexpected errors).

2. **`Cart.tsx`** — Lines 147–161 use `// eslint-disable-next-line no-console` before each `console.error`. Remove the `eslint-disable` comments AND wrap each `console.error` with a dev guard. This gives a cleaner result than the lint suppressor.

3. **`payments/detail.tsx`** — 3 bare `console.error` at lines 271, 302, 343: wrap each with dev guard.

4. **`orders/list.tsx`** — 3 bare `console.error` at lines 207, 227, 265: wrap each with dev guard.

5. **`orders/detail.tsx:236`** — bare `console.log("Status change:", {...})`. Wrap with dev guard.

---

### Agent 4 — Schedule, Deleted Products, Support, Landing: console.error Cleanup

**Files:**
- `src/pages/products/schedule-product-page.tsx`
- `src/pages/posts/schedule-post-page.tsx`
- `src/pages/products/deleted-products.tsx`
- `src/pages/support/chat-window.tsx`
- `src/pages/landing/ProductDetails.tsx`
- `src/pages/landing/OrderDetail.tsx`
- `src/pages/landing/components/OrdersList.tsx`
- `src/context/product/ProductPurchaseOrderContext.tsx`

**Key changes:** Wrap each bare `console.error` call in these files with `if (process.env.NODE_ENV === "development") { ... }`. No logic changes. See issue table for exact line numbers.

**Special note for `ProductPurchaseOrderContext.tsx:165`:** This file was partially fixed in Round 2 (realtime stale closure fix). Line 165 is a `console.log(entriesError)` inside `createProductPurchaseOrder`'s error handling for the entries fetch. Wrap with dev guard.

---

## Estimated Impact Table

| Agent | Severity | Files | Log Calls Fixed |
|-------|----------|-------|-----------------|
| Agent 1 | 🟠 High | 5 | 5 `Math.random()` → UUID; `Array(1).fill()` removed |
| Agent 2 | 🟡 Med | 6 | ~25 (Round 3 residue) |
| Agent 3 | 🟡 Med | 5 | ~17 console calls + 4 eslint-disable removals |
| Agent 4 | 🔵 Low | 8 | ~9 |

---

## File Reference Map

| File | Agent |
|------|-------|
| `src/pages/products/create-set-modal.tsx` | Agent 1 |
| `src/pages/products/create-category-modal.tsx` | Agent 1 |
| `src/pages/products/create-product-page.tsx` | Agent 1 |
| `src/pages/posts/create-post-page.tsx` | Agent 1 |
| `src/utils/upload.ts` | Agent 1 |
| `src/pages/landing/Chat.tsx` | Agent 2 |
| `src/pages/internal-chat/index.tsx` | Agent 2 |
| `src/components/stripe/CheckoutButton.tsx` | Agent 2 |
| `src/pages/products/add-stock-modal.tsx` | Agent 2 |
| `src/pages/products/add-return-modal.tsx` | Agent 2 |
| `src/pages/posts/post-editor.tsx` | Agent 2 |
| `src/pages/landing/Settings.tsx` | Agent 3 |
| `src/pages/landing/Cart.tsx` | Agent 3 |
| `src/pages/payments/detail.tsx` | Agent 3 |
| `src/pages/orders/list.tsx` | Agent 3 |
| `src/pages/orders/detail.tsx` | Agent 3 |
| `src/pages/products/schedule-product-page.tsx` | Agent 4 |
| `src/pages/posts/schedule-post-page.tsx` | Agent 4 |
| `src/pages/products/deleted-products.tsx` | Agent 4 |
| `src/pages/support/chat-window.tsx` | Agent 4 |
| `src/pages/landing/ProductDetails.tsx` | Agent 4 |
| `src/pages/landing/OrderDetail.tsx` | Agent 4 |
| `src/pages/landing/components/OrdersList.tsx` | Agent 4 |
| `src/context/product/ProductPurchaseOrderContext.tsx` | Agent 4 |

---

## Key Notes for Agents

**`crypto.randomUUID()`**: No import needed. Available natively in all modern browsers and Node.js 14+. Returns a string like `"550e8400-e29b-41d4-a716-446655440000"` — globally unique, no collision risk.

**Dev guard pattern**:
```ts
if (process.env.NODE_ENV === "development") {
  console.error("...", someData);
}
```

**`Array(1).fill(null)` anti-pattern**: `Array(1).fill(null).map((_, i) => <Component key={`${id}-${i}`} />)` always produces exactly one element. It's equivalent to just `<Component key={id} />`. Replace with direct `.map(item => <Component key={item.id} />)` pattern.
