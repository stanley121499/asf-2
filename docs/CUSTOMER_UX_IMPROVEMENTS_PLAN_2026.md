# Customer UX Improvements — Plan (March 2026)

## Background

The app has been migrated to Next.js (`asf-2-next`). This plan covers 9 UX improvements
requested for the **customer-facing** side of the app (`src/app/(customer)/`) in preparation
for a client demo. Some changes are permanent product improvements; a few are demo-only
shortcuts flagged explicitly below.

---

## Project Structure (relevant paths)

```
asf-2-next/src/
├── app/
│   ├── (customer)/
│   │   ├── layout.tsx                        ← Wraps SlimLandingContextBundle (all contexts)
│   │   ├── page.tsx                          ← Home page server component
│   │   ├── _components/
│   │   │   └── HomePageClient.tsx            ← Home page client component (643 lines)
│   │   ├── product-section/[[...categoryId]]/
│   │   │   └── _components/ProductSectionClient.tsx
│   │   ├── product-details/[productId]/
│   │   │   └── _components/ProductDetailsClient.tsx
│   │   └── ...other customer pages
│   └── authentication/sign-in/page.tsx       ← Sign-in page
├── components/
│   ├── navbar-home.tsx                       ← Customer navbar (logo + search + hamburger)
│   ├── SearchOverlay.tsx                     ← Full-screen search overlay
│   ├── home/
│   │   ├── HomeHighlightsCard.tsx            ← Card used in all horizontal sections
│   │   └── ProductCard.tsx                   ← Product card in product-section grid
│   └── product/CategoryPreviewSidebar.tsx
└── layouts/LandingLayout.tsx                 ← Wraps NavbarHome + main content
```

---

## The 9 Changes

### 1. Back Button on `/product-section` and `/product-details`

**Problem:** Mobile users have no way to navigate back — OS back gesture is unreliable in
WebView contexts.

**Solution:** Add a `← 返回` back button row immediately below the `<NavbarHome />` component
in both `ProductSectionClient.tsx` and `ProductDetailsClient.tsx`. Use `router.back()`.
Both files already import `useRouter`.

**Files:** `ProductSectionClient.tsx`, `ProductDetailsClient.tsx`

---

### 2. Remove Search Icon from Navbar

**Problem:** The search icon in the top navbar is being moved to section headers (see item 4).
Having it in two places is redundant.

**Solution:** In `navbar-home.tsx`:
- Remove the `<button>` search icon (calls `setIsSearchOpen(true)`)
- Remove `isSearchOpen` state
- Remove `SearchOverlay` render
- Remove `FaSearch` import
- Remove `SearchOverlay` import

The `SearchOverlay` component itself is NOT deleted — it moves to `HomePageClient` (see item 4).

**Files:** `navbar-home.tsx`

---

### 3. Remove Login Button from Points Card

**Problem:** The points/wallet hero card on the home page shows a login CTA for
unauthenticated users. For the demo, the client does not want this shown.

**Solution:** In `HomePageClient.tsx`, delete the entire `{!user && (...)}` block
(the `<Link href="/authentication/sign-in?returnTo=%2F">` block inside the hero card).

**Demo-only:** No — this is a permanent UX decision.

**Files:** `HomePageClient.tsx`

---

### 4. Add Search Button After "See All" in Each Section

**Problem:** The only way to search was through the navbar icon (which is being removed).

**Solution:**
- In `HomePageClient.tsx`, add an optional `onSearch?: () => void` prop to the local
  `ScrollableSection` component
- When provided, render a small search icon button (`FaSearch`) immediately after the
  "查看全部" link in the section header row
- Manage `isSearchOpen` state in `HomePageClient` itself (moved from `navbar-home.tsx`)
- Import and render `<SearchOverlay>` in `HomePageClient`
- Pass `onSearch={() => setIsSearchOpen(true)}` to every `ScrollableSection` call

**Files:** `HomePageClient.tsx`

---

### 5. Save Button on Bottom-Right of All Home Page Cards

**Problem:** Users cannot save items from the home page.

**Solution:** Add a toggleable bookmark/save button (Instagram-style bookmark icon —
`FaBookmark` / `FaRegBookmark` from `react-icons/fa`) to the bottom-right of:

- **Inline highlight post cards** (in `HomePageClient` renders): button after "了解更多 →"
  text. Must call `e.stopPropagation()` since it sits inside a `<MediaAwareLink>`.
  Save state via **localStorage** (posts are not in the `wishlist` DB table).
- **`HomeHighlightsCard`** (categories, depts, ranges, brands): add `isSaved` and
  `onSave` props; render bookmark button after "Discover More →" span in the card footer.
  Must call `e.stopPropagation()` since it sits inside a `<Link>`. Save state via
  **localStorage**.
- **Inline product cards** (the "商品" section): add bookmark button to the bottom-right
  of the card footer (after the `+` circle icon). Wire to the real `useWishlistContext`
  (`addToWishlist` / `removeFromWishlist`) since these are actual products.

**localStorage key format:** `saved_items` — a JSON array of strings in the format
`"type:id"` (e.g. `"post:abc123"`, `"category:def456"`).

**Demo-only:** Partially. Product saves are real (backed by DB `wishlist` table).
Saves for posts/categories/brands/depts/ranges are localStorage-only for the demo.
A future DB migration would add proper persistence.

**Files:** `HomeHighlightsCard.tsx`, `HomePageClient.tsx`

---

### 6. Replace Badge Text with Dismissible Bell Icon on Cards

**Problem:** Highlight cards show a Chinese text badge (精选) at the top-right.
This should be replaced with a bell icon that acts as a "new content" indicator.

**Solution:**
- In `HomeHighlightsCard.tsx`: replace `badgeText` prop with `showBell: boolean` and
  `onBellDismiss: () => void` props. Render `<FaBell>` icon button at top-right (same
  position as the old badge). Button calls `e.stopPropagation()` then `onBellDismiss`.
- In the inline highlight post cards in `HomePageClient.tsx`: replace the hardcoded
  "精选" `<div>` badge with the same bell button pattern.
- In `HomePageClient.tsx`: maintain a `Set<string>` of dismissed item IDs in state,
  initialised from localStorage key `dismissed_bells`. When a bell is dismissed, add
  the item ID to the set and persist to localStorage. Pass
  `showBell={!dismissedBells.has(item.id)}` and `onBellDismiss={() => dismissBell(item.id)}`
  to every card.

**Demo-only:** Yes — state lives in localStorage only. Full implementation would use a
`user_seen_items` Supabase table (see full-implementation plan if needed).

**Files:** `HomeHighlightsCard.tsx`, `HomePageClient.tsx`

---

### 7. Remove Cart Button from Product Section Grid

**Problem:** The `ProductCard` component shows an "Add to Cart" button overlay. The
client wants this removed from the product browsing grid.

**Solution:** In `ProductCard.tsx`:
- Remove the cart `<button>` element (bottom-right overlay circle with `FaShoppingCart`)
- Remove `cartState` state variable
- Remove `handleAddToCart` function
- Remove now-unused imports: `FaShoppingCart`, `FaCheck`, `useAddToCartContext`,
  `useAddToCartLogContext`

The wishlist heart button (top-left) is kept intact.

**Files:** `ProductCard.tsx`

---

### 8. Change Save Icon and Position in Product Details Page

**Problem:** The wishlist button on the product details page uses a heart icon with text
label ("收藏"), positioned as a standalone block below the product title. The icon should
match the bookmark style used on the home page (Instagram-style).

**Solution:** In `ProductDetailsClient.tsx`:
- Change `FaHeart` / `FaRegHeart` to `FaBookmark` / `FaRegBookmark`
- Remove the text label ("已收藏" / "收藏")
- Restructure the product name section to `flex justify-between items-start`:
  - `<h1>` (product name) on the left
  - Save bookmark `<button>` on the right, inline with the title

**Files:** `ProductDetailsClient.tsx`

---

### 9. Auth Page: Chinese Translation + Prefilled Demo Credentials

**Problem:** The sign-in page is entirely in English. For a Chinese-speaking client demo,
all labels and copy must be in Chinese. Additionally, testers need an easy way to log in
without memorising credentials.

**Solution:** In `sign-in/page.tsx`:
- Translate all visible text to Chinese:
  - "Back" → "返回"
  - "Sign in to platform" → "登录平台"
  - "Your Username / Email" → "邮箱地址"
  - "Your password" → "密码"
  - "Login to your account" → "登录账户"
  - "Signing in…" → "登录中…"
  - `aria-label="Go back"` → `aria-label="返回"`
- Prefill credentials for the test account:
  - Email: `stanley121499@gmail.com`
  - Password: `12345678`
  - Use `useState` initial values (not `defaultValue` to keep controlled inputs)

**Demo-only:** The prefilled credentials are demo-only. In production, initialise state
with empty strings `""`.

**Files:** `src/app/authentication/sign-in/page.tsx`

---

## File → Change Mapping Summary

| File | Items |
|------|-------|
| `navbar-home.tsx` | #2 |
| `ProductCard.tsx` | #7 |
| `sign-in/page.tsx` | #9 |
| `ProductSectionClient.tsx` | #1 |
| `ProductDetailsClient.tsx` | #1, #8 |
| `HomeHighlightsCard.tsx` | #5, #6 |
| `HomePageClient.tsx` | #3, #4, #5, #6 |

---

## Agent Batching Strategy

Changes are grouped into 4 sequential agent prompts to keep each task focused:

| Prompt | Title | Files | Items |
|--------|-------|-------|-------|
| **Prompt 1** | Cleanup Pass | `navbar-home.tsx`, `ProductCard.tsx`, `sign-in/page.tsx` | #2, #7, #9 |
| **Prompt 2** | Back Buttons + Detail Save Icon | `ProductSectionClient.tsx`, `ProductDetailsClient.tsx` | #1, #8 |
| **Prompt 3** | HomeHighlightsCard Component | `HomeHighlightsCard.tsx` | #5, #6 |
| **Prompt 4** | HomePageClient | `HomePageClient.tsx` | #3, #4, #5, #6 |

Run prompts **in order**. Prompt 4 depends on the updated `HomeHighlightsCard` from Prompt 3.

---

## TypeScript / Code Standards

All generated code must follow these rules:
- Strict TypeScript — no `any` type, no non-null assertion (`!`), no `as unknown as T`
- Double quotes `"` for all strings
- String templates or `.join()` instead of `+` concatenation
- Full code — no placeholders or `// ... rest of code`
- Comments only for non-obvious logic, not narration
