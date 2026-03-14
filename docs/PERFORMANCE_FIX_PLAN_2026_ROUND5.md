# Performance Fix Plan — Round 5 (2026)

**Status**: Ready for Implementation  
**Audit Date**: March 2026  
**Author**: Senior Dev Code Review  
**Related Docs**: `PERFORMANCE_FIX_PLAN_2026_ROUND4.md`, `PERFORMANCE_FIX_AGENT_PROMPTS_2026_ROUND4.md`

---

## Executive Summary

**Round 4 was a massive success.** The agents successfully eliminated the `Math.random()` collision risks from Supabase storage uploads across 24 files, wiped out the `Array(1).fill(null)` rendering anti-patterns, and secured almost the entirety of the application's `console.error` logs behind development environment guards. 

**Round 5** is the final "polishing" pass. A deep scan revealed:
1. **Three stray `Math.random()` occurrences**: Used for IDs in the support chat attachment handler and two fake checkout flows. All will be ported to `crypto.randomUUID()` or `Math.floor(Date.now() * Math.random())` safely.
2. **Three un-guarded `console.warn` calls**: Located in `internal-chat/index.tsx`, `WishlistContext.tsx`, and `OrderSuccess.tsx`.
3. **Four lingering `eslint-disable` comments**: Round 4 Agent 3 successfully added dev guards in `Cart.tsx`, but forgot to delete the `// eslint-disable-next-line no-console` comments above them.

This round involves a **single agent** since the total footprint is just 6 files with minor string replacements.

---

## ✅ Already Fixed (Do Not Redo)

| Round | Fix | Status |
|-------|-----|--------|
| R1-R2 | Base performance (Providers, Code Splitting, N+1 APIs) | Completed |
| R3 | Module scope extractions, strict error catches | Completed |
| R4 | `crypto.randomUUID()` for Supabase Storage uploads (24 files) | Completed |
| R4 | `console.log` / `console.error` dev guards across all critical paths | Completed |

---

## 🔧 Final Polishing Issues — Round 5

### Priority C — Minor Anti-Patterns & Console Warnings

| # | Sev | Issue | File | Agent |
|---|-----|-------|------|-------|
| C1 | 🔵 Low | `Math.random().toString(36)` used for front-end attachment ID generation. Should use `crypto.randomUUID()`. | `src/pages/support/chat-window.tsx:153` | Agent 1 |
| C2 | 🔵 Low | Fake Stripe session ID uses `Date.now()_Math.random()`. Switch to `crypto.randomUUID()`. | `src/pages/landing/Cart.tsx:349` | Agent 1 |
| C3 | 🔵 Low | Random order number uses `Math.floor(100000 + Math.random() * 900000)`. Switch to a safer random approach or leave it if purely visual. We'll update to `Math.floor(Date.now() % 900000 + 100000)` to eliminate `Math.random` entirely. | `src/pages/landing/Checkout.tsx:153` | Agent 1 |
| C4 | 🔵 Low | 4 lingering `// eslint-disable-next-line no-console` comments resting inside dev guards. Need removal. | `src/pages/landing/Cart.tsx:150-168` | Agent 1 |
| C5 | 🔵 Low | `console.warn` call not guarded. | `src/pages/internal-chat/index.tsx:269` | Agent 1 |
| C6 | 🔵 Low | `console.warn` call not guarded. | `src/context/WishlistContext.tsx:134` | Agent 1 |
| C7 | 🔵 Low | `console.warn` call not guarded. | `src/components/stripe/OrderSuccess.tsx:144` | Agent 1 |

---

## Agent Task Breakdown

### Agent 1 — The Final Polish

**Files:**
- `src/pages/support/chat-window.tsx`
- `src/pages/landing/Cart.tsx`
- `src/pages/landing/Checkout.tsx`
- `src/pages/internal-chat/index.tsx`
- `src/context/WishlistContext.tsx`
- `src/components/stripe/OrderSuccess.tsx`

**Key changes:**
1. Replace `Math.random` string slices with `crypto.randomUUID()` where IDs are required.
2. Replace `Math.random` in the visual order number with a combination of `Date.now()` modulus.
3. Remove the specific `eslint-disable-next-line` comments in `Cart.tsx`.
4. Wrap all 3 `console.warn` calls with `if (process.env.NODE_ENV === "development") { ... }`.
