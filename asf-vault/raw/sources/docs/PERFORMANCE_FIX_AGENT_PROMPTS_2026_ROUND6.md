# Performance Fix Agent Prompts — Round 6 (2026)

**Status**: Ready for Implementation  
**Audit Date**: March 14, 2026  
**Companion Plan**: `PERFORMANCE_FIX_PLAN_2026_ROUND6.md`

> ⚠️ **IMPORTANT**: Both agents have a very small, surgical scope. Round 6 is a cleanup-verification round — the vast majority of issues from Rounds 1–5 were already applied by prior agents. Only 2 files need changes.

---

## Agent 1: Guard console calls in OrderSuccess.tsx

### Overview

You are a senior TypeScript developer. Your task is to wrap 3 bare console calls in `src/components/stripe/OrderSuccess.tsx` with `process.env.NODE_ENV === "development"` guards so they do not fire in production.

**No other changes.** Do not refactor logic, rename variables, or change any behavior.

---

### Files to Modify

- `src/components/stripe/OrderSuccess.tsx`

---

### Complete Change Specification

Open `src/components/stripe/OrderSuccess.tsx` and make **exactly 3 changes**:

---

#### Change 1 — Line ~62: catch block in JSON parse of fake session data

**FIND this exact code block:**
```ts
            try {
              sessionData = JSON.parse(local) as Session;
            } catch (e) {
              console.error(e);
            }
```

**REPLACE with:**
```ts
            try {
              sessionData = JSON.parse(local) as Session;
            } catch (e) {
              if (process.env.NODE_ENV === "development") {
                console.error(e);
              }
            }
```

---

#### Change 2 — Line ~144: console.warn in points creation race condition catch

**FIND this exact code:**
```ts
                    } catch (createError) {
                      // If creation fails (e.g., due to race condition), try fetching again
                      console.warn("Failed to create user_points, attempting to fetch again:", createError);
                      currentUserPoints = await pointsAPI.getUserPointsByUserId(user.id);
```

**REPLACE with:**
```ts
                    } catch (createError) {
                      // If creation fails (e.g., due to race condition), try fetching again
                      if (process.env.NODE_ENV === "development") {
                        console.warn("Failed to create user_points, attempting to fetch again:", createError);
                      }
                      currentUserPoints = await pointsAPI.getUserPointsByUserId(user.id);
```

---

#### Change 3 — Line ~192: console.error in outer catch block

**FIND this exact code block:**
```ts
              } catch (err) {
                console.error(err);
              } finally {
```

**REPLACE with:**
```ts
              } catch (err) {
                if (process.env.NODE_ENV === "development") {
                  console.error(err);
                }
              } finally {
```

---

### Verification

After making changes:
1. Run `npx tsc --noEmit` — must show 0 TypeScript errors.
2. Run `grep "console\." src/components/stripe/OrderSuccess.tsx` — all results should be inside `if (process.env.NODE_ENV === "development")` blocks.
3. The file should still compile and the order success page should function identically.

---

---

## Agent 2: Fix key={index} in orders/detail.tsx

### Overview

You are a senior TypeScript developer. Your task is to fix a React key anti-pattern in `src/pages/orders/detail.tsx`. The order items list uses `key={index}` (array index as key), which degrades React reconciliation performance. Replace it with `key={item.id}` which uses the stable database primary key.

**No other changes.** Do not refactor logic, rename variables, or change any behavior.

---

### Files to Modify

- `src/pages/orders/detail.tsx`

---

### Complete Change Specification

Open `src/pages/orders/detail.tsx` and find the order items `.map()` call.

**FIND this exact code:**
```tsx
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-4 border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0"
                    >
```

**REPLACE with:**
```tsx
                  {order.items.map((item, index) => (
                    <div
                      key={item.id ?? String(index)}
                      className="flex items-center space-x-4 border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0"
                    >
```

> **Note**: We use `item.id ?? String(index)` as a safe fallback in case `item.id` is ever undefined (though it should never be, as it is the database primary key). The `index` parameter should be kept in the `.map()` callback signature since it's used for the fallback.

---

### Verification

After making changes:
1. Run `npx tsc --noEmit` — must show 0 TypeScript errors.
2. Navigate to any order detail page in the browser — order items should render correctly with no React key warnings in the console.
3. Run `grep "key={index}" src/pages/orders/detail.tsx` — should return no results.

---

---

## Summary of Changes

| Agent | File | Lines Changed | Nature of Change |
|-------|------|---------------|------------------|
| Agent 1 | `src/components/stripe/OrderSuccess.tsx` | 62, 144, 192 | Wrap 3 console calls with `NODE_ENV` guard |
| Agent 2 | `src/pages/orders/detail.tsx` | 393 | `key={index}` → `key={item.id ?? String(index)}` |

**Total changes**: 4 line modifications across 2 files. No logic changes. No new imports needed.
