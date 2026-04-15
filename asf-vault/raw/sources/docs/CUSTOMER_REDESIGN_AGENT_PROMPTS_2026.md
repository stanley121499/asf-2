# Customer App — Full Redesign Agent Prompts (2026)

Run agents **in order**. Each agent builds on the previous. Before starting any agent, read `docs/CUSTOMER_REDESIGN_PLAN_2026.md` for the full design system, constraints, and context.

---

## SHARED CONTEXT (Read before every agent)

**Project:** `e:\Dev\GitHub\asf-2\asf-2-next\` — Next.js 14 App Router, TypeScript strict, Tailwind CSS, Supabase, react-icons, Flowbite React.

**Non-negotiable rules for every agent:**
- No `any`, no `!` non-null assertion, no `as unknown as T`
- Double quotes for all strings
- Complete files only — no `// ... rest of code` placeholders
- All user-visible text in **Simplified Chinese** — no English labels
- Never use `router.back()` — always `router.push('/explicit-route')`
- No "Buy Now" / 立即购买 anywhere — only "加入购物袋"
- Minimum 56×56px touch targets; bottom nav 64px height
- Body text minimum 16px, secondary text minimum 14px
- Import Google Fonts via `next/font/google`: `Cormorant_Garamond` (serif) + `Inter` (sans)
- CSS variables defined in Phase 1 (Agent 1): `--color-bg #FFFFFF`, `--color-text #0A0A0A`, `--color-panel #F5F5F3`, `--color-accent #C9A96E`, `--color-danger #E8453C`, `--color-muted #6B7280`, `--color-border #E5E5E3`
- Run `npx tsc --noEmit` at end and fix all errors before declaring done

---

## AGENT 1 — Design System + Navigation Components

**Files to touch:**
- `src/app/globals.css`
- `src/app/layout.tsx` (customer layout, add Google Fonts)
- `src/app/(customer)/layout.tsx`
- `src/components/home/bottom-nav.tsx` — full replacement
- `src/components/navbar-home.tsx` — full replacement

**Task: globals.css**
Add CSS custom properties at `:root`:
```css
--color-bg: #FFFFFF;
--color-text: #0A0A0A;
--color-panel: #F5F5F3;
--color-accent: #C9A96E;
--color-danger: #E8453C;
--color-muted: #6B7280;
--color-border: #E5E5E3;
```
Add utility classes: `.btn-primary` (full-width black 56px button), `.btn-secondary` (outlined 56px button), `.skeleton` (animated pulse gray block), `.card-panel` (white bg, border `--color-border`, rounded-2xl).

**Task: layout.tsx**
Load `Inter` and `Cormorant_Garamond` from `next/font/google`. Apply `Inter` as default body font. Make `Cormorant_Garamond` available via a CSS class `font-display`. Ensure `<html>` and `<body>` use `var(--color-bg)` and `var(--color-text)`.

**Task: bottom-nav.tsx — Full Replacement**

Design: Fixed bottom bar, 64px height, `backdrop-blur-md bg-white/80 border-t border-[--color-border]`, safe-area-inset-bottom padding. 4 tabs only:

| Tab | Icon (react-icons) | Label | Route |
|---|---|---|---|
| 首页 | `HiOutlineHome` | 首页 | `/` |
| 购物 | `HiOutlineShoppingBag` | 购物 | `/product-section` |
| 已收藏 | `HiOutlineHeart` | 已收藏 | `/wishlist` |
| 我的 | `HiOutlineUser` | 我的 | `/settings` |

- **Always show both icon AND label** on all tabs (active and inactive) — never icon-only
- Active tab: icon + label in `var(--color-accent)`
- Inactive tab: icon + label in `var(--color-muted)`
- Each tab link is a `<Link>` with `min-h-[56px] min-w-[56px]` flex column center
- Remove the old Trophy/GoGoal button entirely
- Use `usePathname()` to determine active state

**Task: navbar-home.tsx — Full Replacement**

Design: Sticky top bar, 56px height. Two modes controlled by a scroll listener:
- **Transparent mode** (hero overlap, home page only): `bg-transparent`
- **Solid mode** (scrolled, or any non-home page): `bg-white border-b border-[--color-border]`

Layout: `[flex row, items-center, justify-between, px-4]`
- Left: Brand name text in `font-display` serif (replace old logo + "SYSTEM APP FORMULA")
- Right: Three icon buttons (each min 44×44px): Search `HiOutlineSearch` → opens search overlay; Cart `HiOutlineShoppingCart` with item count badge → `router.push('/cart')`; Bell `HiOutlineBell` with unread dot → `router.push('/notifications')`
- Remove hamburger menu and `CategoryPreviewSidebar` entirely
- Keep `SearchOverlay` import and open trigger; remove `isSidebarVisible` state

Cart item count: get from `useAddToCartContext` if available. Show a small `var(--color-accent)` filled circle badge with white number when count > 0.

Unread notification dot: hardcoded `true` for now (demo) — just show a small dot.

**Verification:** `npx tsc --noEmit`. Hot reload at localhost:3000, confirm bottom nav shows 4 tabs with labels, top nav shows brand name + 3 icons.

---

## AGENT 2 — Authentication Pages

**Files to touch:**
- `src/app/authentication/sign-in/page.tsx` — redesign
- `src/app/authentication/sign-up/page.tsx` — **create new**

Both pages use NO bottom nav, NO top navbar component. They are standalone full-screen pages.

**Task: sign-in/page.tsx — Redesign**

Layout: Full-screen mobile-first. Two sections stacked vertically:

1. **Top hero (40vh):** Dark overlay on a background image or gradient (`from-[#1a1a1a] to-[#2d2417]`). Centered brand name in `font-display` serif, white. Subtext: 「优选品质，触手可及」in small muted white.

2. **Bottom form panel (60vh):** White background, rounded-tl-3xl rounded-tr-3xl, pulled up to overlap hero slightly. Contains:
   - Serif headline: 「欢迎回来」
   - Email input (56px height, labeled 「邮箱地址」, placeholder 「请输入邮箱」, `inputMode="email"`, `autoComplete="username email"`)
   - Password input (56px height, labeled 「密码」, placeholder 「••••••••」, show/hide toggle button inside right side of input)
   - Error strip (red bg, Chinese plain-language error — not raw Supabase message; map "Invalid login credentials" → 「邮箱或密码不正确，请重试」)
   - Full-width black 56px 「登录」button (loading state: 「登录中…」 + spinner)
   - 「忘记密码？」right-aligned small link (for now just a `<span>` — no functionality needed)
   - Bottom: 「还没有账号？」+ 「立即注册 →」link → `router.push('/authentication/sign-up')`
   - Very bottom: 「游客浏览」text link → `router.push('/')`

Remove: Flowbite `<Card>`, `<Button>`, `<Label>`, `<TextInput>` component imports. Replace with plain HTML + Tailwind styled to match design system.
Keep: All existing logic (`signIn`, `returnTo`, `useMemo`, loading/user redirect). Keep dev credentials in useState defaults (do not change).
Fix: Back button changes from `router.back()` → `router.push('/')` labeled 「← 返回首页」.

**Task: sign-up/page.tsx — Create New**

Page at route `/authentication/sign-up`. No backend wiring needed for Supabase register — use the existing `useAuthContext` which should expose a `signUp` method. If it doesn't exist, just wire form state and show a TODO comment in a non-visible location while the UI is fully complete.

Layout: Same two-section layout as sign-in.

Hero: Same brand hero as sign-in. Subtext: 「加入我们，开启您的专属购物体验」.

Form panel contains:
- Serif headline: 「创建账号」
- Small text: 「注册即获得积分，每次购物都有回报」(sand accent color)
- Optional name input (labeled 「您的称呼（选填）」, placeholder 「请输入您的名字」)
- Email input (same as sign-in)
- Password input with show/hide toggle (labeled 「密码」, placeholder 「至少8位字符」)
- Confirm password input (labeled 「确认密码」). Show ✓ in green when both passwords match and non-empty.
- Inline validation message: if passwords typed and don't match show 「两次密码不一致」in red below field
- Full-width black 56px 「注册」button
- Error strip (same pattern as sign-in)
- Bottom: 「已有账号？」+ 「立即登录 →」→ `router.push('/authentication/sign-in')`
- Very bottom: 「游客浏览」→ `router.push('/')`
- Back button top-left: 「← 返回登录」→ `router.push('/authentication/sign-in')`

On successful register: `router.push('/')`.

**Verification:** `npx tsc --noEmit`. Visit both pages at localhost:3000, confirm mobile-first layout, all text Chinese, back buttons route correctly.

---

## AGENT 3 — Onboarding Overlay + Home Page

**Files to touch:**
- `src/components/OnboardingOverlay.tsx` — **create new**
- `src/app/(customer)/_components/HomePageClient.tsx` — major rework

**Task: OnboardingOverlay.tsx — Create New**

A 3-step full-screen overlay shown on first app launch.

Gate: Check `localStorage.getItem('onboarding_v1_done')` on mount. If set, render nothing. On complete or skip, `localStorage.setItem('onboarding_v1_done', '1')`.

Design: Fixed inset-0 z-50, dark background `bg-[#0A0A0A]`.

**Step 1 — Brand Welcome:**
- Full-screen dark panel with brand name in large `font-display` serif, white
- Tagline: 「优选品质，触手可及」
- Progress: 「第 1 步 / 共 3 步」small muted text at top
- Large black outline → filled white button: 「开始体验 →」(advances to step 2)
- Top-right: 「跳过」small text link (closes overlay)

**Step 2 — Loyalty Hook:**
- Three tier icons in a row: Bronze 🥉 Silver 🥈 Gold 🥇 with labels (铜牌 银牌 金牌)
- Headline: 「每次购物，积分回馈」
- Body: 「消费即积分，积分兑换专属奖励。等级越高，福利越多。」
- Progress: 「第 2 步 / 共 3 步」
- Button: 「下一步 →」
- 「跳过」top-right

**Step 3 — Auth Decision:**
- Headline: 「开始您的购物旅程」
- Two buttons (full width, stacked):
  1. Black filled: 「登录 / 注册」→ `router.push('/authentication/sign-in')`
  2. Outlined black: 「游客浏览」→ close overlay (sets localStorage)
- Small text: 「登录后可保存收藏、追踪订单并获取积分」
- No skip on this step — the two buttons ARE the exit

**Task: HomePageClient.tsx — Major Rework**

Read the existing file before editing. Preserve all data fetching logic and context usage. Only replace the JSX/render output. All existing state and effect hooks should be kept unless they powered a removed UI element.

New layout structure:

1. **Lookbook Hero (55vh, full-bleed):**
   - Use the first post's media as background image (`object-cover`). If no posts loaded, use a dark gradient fallback
   - Dark gradient overlay at bottom (for text readability)
   - On top of overlay: post caption text in white serif, small
   - Bottom-left: 「探索新品 →」white text link → `router.push('/product-section')`
   - Whole hero is tappable → navigates to `/highlights`
   - Do NOT render the old purple gradient dashboard

2. **「新品上市」section:**
   - Section title: 「新品上市」in `font-display` serif, 24px, black, left-aligned with horizontal rule
   - 2-column grid of product cards (no borders, no card shadows)
   - Product card: full-width 3:4 aspect-ratio image, product name (Inter 16px, 1 line truncate), price in `--color-accent`, heart icon (wishlist toggle) right-aligned next to price
   - Show first 6 products sorted by created_at descending
   - Skeleton: 2-col grid of 6 gray pulse blocks while loading

3. **「商品分类」category pills:**
   - Section title: 「商品分类」
   - Horizontal scrollable row of pill chips from `categories` data
   - Each pill: tapping routes to `/product-section/[categoryId]`
   - Active pill: black bg, white text. Inactive: white bg, border, black text
   - Hide if categories empty

4. **「精选推荐」posts strip:**
   - Section title: 「精选推荐」
   - Horizontal scroll, cards 80vw wide, 1.5 cards peeking
   - Each card: 4:5 image, caption below, bookmark icon top-right (saves to localStorage)
   - Tapping card → `router.push('/highlights')`
   - Remove: red bell dismiss buttons entirely

5. **Points status strip (if user logged in):**
   - Slim strip `bg-[--color-panel]` at bottom of scroll
   - Text: 「您有 {points} 积分 · 距{nextTier}还差 {gap} 积分」
   - Tap → `router.push('/goal')`
   - If no user: hide completely

**Remove from current HomePageClient:** Purple gradient hero, wallet balance display, QR code button, all red bell badge icons, 品牌/departments/ranges horizontal carousels (keep only categories + products + posts).

Add `<OnboardingOverlay />` at the top of the return, before everything else.

**Verification:** `npx tsc --noEmit`. Check home page at localhost:3000 on mobile viewport. Onboarding shows on first visit. Hero displays. No purple gradient visible.

---

## AGENT 4 — PostCard Component + Highlights Feed

**Files to touch:**
- `src/components/PostCard.tsx` — **create new**
- `src/app/(customer)/highlights/_components/` — update highlight components to use PostCard
- `src/app/(customer)/highlights/page.tsx` — update to vertical feed layout

**Task: PostCard.tsx — Create New**

Props: `post: Tables<"posts">`, `medias: Tables<"post_medias">[]`, `showActions?: boolean` (default true)

Layout (full-width card, no border, white bg, mb-8):

1. **Image/Video block** (4:5 aspect ratio, full width):
   - Use first media from `medias` array sorted by arrangement
   - `next/image` with `object-cover`, `fill` inside aspect-ratio wrapper
   - If no media: dark gray placeholder block

2. **Caption** (below image, px-4, Inter 16px): `post.caption` or empty

3. **Social action bar** (px-4, py-3, flex row, gap-6) — only if `showActions` is true:
   - ❤️ Like: icon button. On tap: toggle in `localStorage['liked_posts']` (JSON array of post IDs). Show filled red heart if liked, outline if not. Show count (demo: start at 12, +1 if liked).
   - 💬 Comment: icon button. On tap: open a bottom sheet. Bottom sheet has a textarea 「写下您的留言…」and a 「发送」button (no backend — just closes sheet and shows toast 「留言已提交」). Bottom sheet has `×` close.
   - 🔖 Save: icon button. On tap: toggle in `localStorage['saved_posts']` (JSON array of post IDs). Show filled bookmark if saved, outline if not.
   - All three buttons are labeled: 「喜欢」「留言」「收藏」small text below icon

4. **CTA Button** (px-4, pb-4): If `post.cta_text` is set, show an outlined black button full-width with that text → `router.push('/product-section')`. Otherwise hide.

**Task: Highlights page — Vertical Feed**

Read existing `highlights/page.tsx` and its `_components`. Replace the rendering with a vertical scroll of `<PostCard>` components. Pass `showActions={true}`. Add `← 返回` top bar button → `router.push('/')`. No bottom nav on this page (it's a full-screen feed — bottom nav is rendered by the layout but that's fine; just ensure the last post is not cut off by adding `pb-20`).

Page title bar: 「精选推荐」serif headline left. Top bar sticky white bg.

If no posts: centered message 「暂无内容，敬请期待」.

**Verification:** `npx tsc --noEmit`. Visit `/highlights`, confirm PostCard renders, like/save/comment are all functional (localStorage), CTA button visible where applicable.

---

## AGENT 5 — Product Section

**Files to touch:**
- `src/app/(customer)/product-section/[[...categoryId]]/_components/ProductSectionClient.tsx` — major rework
- `src/components/home/ProductCard.tsx` — visual redesign (keep all existing logic, only change JSX/styles)

**Task: ProductCard.tsx — Visual Redesign**

Keep all existing logic (wishlist toggle, add to cart navigation). Only change the visual output:

New card layout (no border, no shadow, white bg):
- Full-width 3:4 aspect-ratio image via `next/image` `fill`. Skeleton pulse bg while loading.
- Below image: product name (Inter 16px, `font-medium`, 1-line truncate, color `--color-text`)
- Price row: `RM {price}` in `--color-accent` color, flex row with heart icon button right-aligned
- Heart icon: `HiHeart` filled in `--color-accent` if saved, `HiOutlineHeart` in `--color-muted` if not
- No card border, no `rounded-lg border border-gray-200`
- The card is a `<Link href="/product-details/{id}">` wrapper with the add-to-wishlist button `e.preventDefault(); e.stopPropagation()` on its click

**Task: ProductSectionClient.tsx — Rework**

Keep all existing data filtering and sort logic. Replace the JSX:

1. **Sticky search bar** (top, below navbar): Full-width input with search icon left `HiOutlineSearch`. Placeholder 「搜索商品…」. `bg-[--color-panel]` rounded-full style. `min-h-[48px]`.

2. **Category pills** (horizontal scrollable row, below search): Pills from `categories` prop. Active = `bg-[--color-text] text-white`. Inactive = `border border-[--color-border] text-[--color-text] bg-white`. Plus a 「全部」pill at start. Tapping routes to `/product-section/[categoryId]` or `/product-section` for All.

3. **Sort & Filter** strip (right-aligned row above grid): One pill button 「筛选 ⚙」opens a bottom sheet. Bottom sheet contains: sort options (最新 / 价格从低到高 / 价格从高到低) as radio-style rows, done button 「完成」. Bottom sheet has `×` close and sits above bottom nav.

4. **2-column product grid** (no gutters except `gap-3`): Uses redesigned `ProductCard`. Skeleton: 6 pulse blocks on initial load.

5. **Empty state**: centered 「暂无相关商品」with a 「回到首页」button → `router.push('/')`.

6. **Quick-View bottom sheet**: On tapping a product card (in addition to navigating): actually, keep the navigation behavior (tap goes to PDP). The quick-view is a secondary action — add a small 「快速查看」text button below each product card's price row. Tapping it opens a bottom sheet showing: product image (2:3), name, price, color swatches if any (static, from `productColors` loaded via context), size options if any, and a 「加入购物袋」button. If product has variants, 「加入购物袋」routes to PDP. If no variants, it adds to cart directly using the existing add-to-cart logic.

Remove: Old `<Select>` dropdown filter, sidebar, breadcrumb nav, Flowbite `<Select>` component.

**Verification:** `npx tsc --noEmit`. Check `/product-section` — pills visible, 2-col grid, filter sheet opens, quick-view sheet works.

---

## AGENT 6 — Product Details Page

**Files to touch:**
- `src/app/(customer)/product-details/[productId]/_components/ProductDetailsClient.tsx` — major rework

Read the existing file fully before starting. Keep all business logic (stock check, variant selection, add to cart, wishlist toggle). Only replace the JSX layout.

**New layout:**

1. **Full-screen image carousel (top):**
   - `position: relative`, height `60vh` on mobile
   - `next/image` with `object-cover` `fill`, swipeable via touch events (track `touchStart`/`touchEnd` to detect swipe)
   - Dot indicator centered below image (one dot per media, filled `--color-accent` for active)
   - No thumbnail strip on mobile
   - Back button: top-left absolute, white circle button `←`, `router.push('/product-section')` (not `router.back()`)
   - Save/wishlist: top-right absolute, white circle button with `HiHeart` / `HiOutlineHeart`

2. **Floating info panel (slides up from bottom, overlaps image by ~80px):**
   - `bg-[--color-bg] rounded-tl-3xl rounded-tr-3xl` sticky below the carousel
   - Contains: product name (`font-display` 22px serif), price (`--color-accent` 20px bold)
   - Stock indicator: small text, green if in stock, red if not
   - Color swatches section (if `requiresColor`): label 「颜色」+ round color swatches. Each swatch is a circle 36×36px with the color name as `title`. Selected = sand accent ring outline.
   - Size grid section (if `requiresSize`): label 「尺码」+ grid of size pill buttons. Each 56px min height. Selected = black bg white text.
   - Description accordion: 「商品详情」with `▼`/`▲` toggle. Collapsed by default.
   - Warranty accordion: 「质保信息」if present. Same pattern.
   - **「为您推荐」section (Complete the Look — demo):** Show 4 random products from the same category using already-loaded data passed as a prop or fetched via the existing product context. Display as horizontal scroll of mini product cards (image + name + price). Heading: 「为您推荐」.

3. **Sticky action bar (fixed bottom, above bottom nav):**
   - `fixed bottom-[64px] left-0 right-0 z-40` (64px = bottom nav height)
   - Padding bottom = `env(safe-area-inset-bottom, 0px)`
   - White bg, subtle top border
   - Layout: `[♡ 收藏] [————加入购物袋————]`
   - 「收藏」: square button left ~64px wide. Icon only with label below.
   - 「加入购物袋」: flex-1 black filled button, 56px height, Chinese text
   - **No "Buy Now" button** — remove `<CheckoutButton>` from mobile action bar entirely
   - If `disableActions` (out of stock): both buttons `opacity-40 cursor-not-allowed`

Remove from desktop-only section: The `hidden sm:flex` div with desktop buy buttons. Replace the whole bottom with the sticky bar (it works on all screen sizes).

**Verification:** `npx tsc --noEmit`. Check `/product-details/[any-valid-id]` — full-screen image, swipe works, sticky bar visible above nav, no "Buy Now".

---

## AGENT 7 — Cart + Wishlist

**Files to touch:**
- `src/app/(customer)/cart/page.tsx` — restyle
- `src/app/(customer)/wishlist/page.tsx` — restyle + add tabs

### Cart

Keep all existing logic (qty update, remove, points, Stripe checkout). Replace JSX only.

**New layout:**

1. **Top bar:** White, sticky. Left: 「← 继续购物」→ `router.push('/product-section')`. Center: 「购物袋 ({count} 件)」serif headline. No router.back() anywhere.

2. **Item rows:** For each cart item:
   - Row: `[thumbnail 80×80px] [name, variant, price] [qty stepper] [× remove]`
   - Thumbnail: rounded-lg `next/image`
   - Qty stepper: `[-] [2] [+]` inline, each button 40×40px min
   - Remove: small `×` button top-right of row, 44×44px tap target. On tap: show undo toast 3s (use useState for a `removedItem` state), actually remove from cart after 3s OR immediately if user taps elsewhere.

3. **Points section (collapsible):**
   - Collapsed row: 「使用积分 (您有 {n} 积分)」+ chevron
   - Expanded: slider (HTML range input) from 0 to available points. Show discount calculated. 「全部使用」button.

4. **Order summary:** `小计 / 积分折扣 / 合计` clean rows. Small text: 「此订单可获得 {n} 积分」.

5. **Trust strip:** 3 items: `🔒 安全支付` · `📦 正品保障` · `💳 Stripe结算`. Small icons + text.

6. **「去结算」button:** Full-width, black, 56px, fixed bottom above nav OR at bottom of scroll.

7. **Empty cart state:** Editorial feel — large `🛍` emoji or simple illustration, 「购物袋还是空的」serif text, 「去选购 →」button → `router.push('/product-section')`.

8. **Guest state:** 「登录后查看购物袋」+ 「登录 / 注册」button → sign-in; 「游客浏览」link.

Remove: green 「测试立即支付」test button if present in the JSX. Remove Flowbite `<Badge>` and `<Card>` from visible customer UI.

### Wishlist

Keep existing data loading (wishlist context + localStorage saved posts). Replace JSX only.

**New layout:**

1. **Top bar:** `← 返回` → `router.push('/')`. Title: 「我的收藏」.

2. **Tabs:** Two pill tabs at top: 「商品」and 「帖子」. Controlled by local state `activeTab`.

3. **商品 tab:** 2-column grid using the redesigned `ProductCard`. Each card has a remove button (small `×` overlaid top-right corner). On remove: undo toast 3s.

4. **帖子 tab:** Vertical list of saved posts from localStorage `saved_posts`. Use a simplified `PostCard` with `showActions={false}`. Remove button top-right of each card.

5. **Empty states:** For each tab, editorial empty state — serif text + CTA button routing to `/product-section` (商品 tab) or `/highlights` (帖子 tab).

Remove: Old sort/filter dropdowns. Old separate "saved posts" section mixed with products.

**Verification:** `npx tsc --noEmit`. Cart: check count in header, item rows, empty state, no test button. Wishlist: check tabs switch, saved items render.

---

## AGENT 8 — Search Overlay

**Files to touch:**
- `src/components/SearchOverlay.tsx` — full replacement

Read the existing file to understand its props interface. Keep the same props: `isOpen: boolean`, `onClose: () => void`.

**New design — Full-screen slide-up overlay:**

```
State:
- query: string (search input value)
- recentSearches: string[] (from localStorage['recent_searches'], max 8)
- results: { products: Products[], posts: Posts[] } (filtered from props/context data)
```

The overlay receives products and posts data via context (use existing contexts). Filter client-side with 250ms debounce.

**Layout (fixed inset-0 z-50, white bg, flex column):**

1. **Top bar:** 
   - `×` close button left (44×44px). On click: `onClose()`.
   - Search input right of ×: full-width, `autofocus`, placeholder 「搜索商品、内容…」, no border just bottom border.
   - `×` clear button inside input right side (shows only when query non-empty).

2. **Empty state (no query typed):**
   - 「最近搜索」section: pill chips from `recentSearches`, each tappable to set query. 「清除」text button right of section title.
   - 「热门搜索」section: hardcoded chips: 「手袋」「夏季新品」「运动鞋」「连衣裙」「配饰」. Tapping sets query.

3. **Results (query non-empty):**
   - 「商品」section: up to 4 product results. Each row: `[60px thumbnail] [name] [RM price]`. Tapping: `router.push('/product-details/{id}')`, `onClose()`.
   - 「内容」section: up to 4 post results. Each row: `[60px thumbnail] [caption truncated]`. Tapping: `router.push('/highlights')`, `onClose()`.
   - 「查看全部 {n} 个结果 →」link below each section if more than 4 results.

4. **No results:** 「没有找到 "{query}" 相关内容」centered. Suggestion: 「试试这些：」+ hardcoded suggestions.

On submitting a search (press enter / tap result): add query to `localStorage['recent_searches']` (prepend, deduplicate, keep max 8).

Animation: overlay slides up from bottom (`translate-y-full` → `translate-y-0`, `transition-transform duration-300`).

**Verification:** `npx tsc --noEmit`. Open search from nav icon, type a product name, confirm client-side results appear. Close with ×.

---

## AGENT 9 — Goal / Rewards Page

**Files to touch:**
- `src/app/(customer)/goal/page.tsx` — full replacement

Keep the stamp card localStorage logic (`scratchCardProgress`). Remove the horizontal swiper carousel. Replace with a vertical scrolling page.

**New layout (vertical scroll, `pb-24` for bottom nav clearance):**

**Top bar:** Solid white. Left: 「← 返回」→ `router.push('/settings')`. Center: 「我的奖励」serif headline.

**Section 1 — Membership Card:**
Dark matte card `bg-gradient-to-br from-[#1a1a1a] to-[#2d2417] rounded-3xl p-6 mx-4 mt-4`. Contains:
- Tier name top-left in `font-display` gold/accent color: 「银牌会员」(hardcoded for now or derive from points)
- Points balance: large white number `{userPoints.toLocaleString()}` + 「积分」small text
- Horizontal line
- User email or name bottom-left (small muted white text)
- QR code icon or placeholder box bottom-right (demo — render a simple bordered box with 「二维码」text inside if no real QR component available)

**Section 2 — Tier Progress:**
White panel `card-panel mx-4 mt-4 p-4`.
- Label: 「距离金牌会员还差 {gap} 积分」(`--color-accent` text)
- Progress bar: HTML `<progress>` or custom div with `bg-[--color-accent]` fill, percentage calculated from `userPoints / goldThreshold * 100`. Cap at 100%.
- Three tier markers below bar: 铜牌 (0) / 银牌 (500) / 金牌 (1000) — hardcoded thresholds for now.

**Section 3 — Stamp Card:**
White panel `card-panel mx-4 mt-4 p-4`. Title: 「每日集章」serif.
Keep all existing `StampCard` component logic. Just restyle it to match design system:
- Round stamps on white/panel background
- Completed stamps: filled `--color-accent` circle with white ✓
- Gift positions (3, 6, 9): 🎁 icon in accent color
- Current tappable stamp: pulsing accent ring
- Footer text: 「已集 {n}/9 枚 · {remaining} 枚可获奖励」

**Section 4 — Annual Goal:**
White panel `card-panel mx-4 mt-4 p-4`. Title: 「年度目标」serif.
- Progress bar (same style, different data: `card.sale / card.goal * 100`)
- Text: 「已消费 RM{sale} / 目标 RM{goal}」
- Reward text in `--color-accent`: 「达成后享八折优惠！」

**Section 5 — Points History (demo):**
White panel `card-panel mx-4 mt-4 p-4`. Title: 「积分记录」serif.
5 hardcoded rows:
```
+20 积分  订单 #8821   3天前
+50 积分  注册奖励     7天前
-30 积分  兑换折扣     10天前
+15 积分  订单 #8742   14天前
+20 积分  订单 #8633   18天前
```
Each row: left green/red `+/-` badge, description, right timestamp. Muted "查看全部" link at bottom (no functionality needed).

**Section 6 — How to Earn More:**
White panel `card-panel mx-4 mt-4 mb-6 p-4`. Title: 「如何获取更多积分」serif.
Three rows with icon + description + points badge:
- 🛍 每消费 RM1 → +1 积分
- ✍️ 撰写商品评价 → +50 积分 (「即将推出」badge)
- 👥 邀请朋友注册 → +100 积分 (「即将推出」badge)

**Verification:** `npx tsc --noEmit`. Visit `/goal`. Confirm vertical scroll layout, membership card, stamp card tappable, progress bars visible.

---

## AGENT 10 — Notifications + Settings + Support Chat

**Files to touch:**
- `src/app/(customer)/notifications/page.tsx` — restyle
- `src/app/(customer)/settings/page.tsx` — restyle
- `src/app/(customer)/support-chat/page.tsx` — restyle form + chat header

### Notifications

Keep mock data or existing data. Replace JSX:

**Top bar:** No explicit back (accessible from bell icon, which is in top navbar). Title: 「通知」. Right: 「全部已读」text button (mark all as read via state).

Group notifications by: 「今天」「昨天」「更早」(use `timestamp` field, mock dates accordingly).

Each notification row (min 64px height): 
- Left icon circle (48px): Bag (order), Tag (offer), Bell (system)
- Text: title bold 16px, message muted 14px below
- Right: timestamp small muted, unread dot in `--color-accent` if unread
- Left border: 3px solid `--color-accent` if unread, transparent if read
- Tapping any row: marks as read (local state), for demo all route to `/` (home)

Empty state: centered ✓ icon + 「暂无通知」text.

### Settings

Keep all existing logic (avatar upload, profile save, password update, logout, dark mode, points fetch). Replace JSX only.

Structure: Vertical scroll `pb-24`. No top nav (already has one from layout). Top bar: Title 「我的」center, no back (this is a bottom tab).

**Section: Profile card** (`card-panel mx-4 mt-4 p-4 flex items-center gap-4`):
- Avatar circle 64×64px (show `user_detail.profile_image` or default person icon)
- Right: Name (bold 18px), Email (muted 14px), Tier badge 「银牌会员」small pill in `--color-accent`

**Optional nudge** (if `!user_detail?.first_name`): Slim yellow strip below card: 「完善资料可获得 10 积分 →」→ opens profile accordion.

**Section: 我的账户** (`card-panel mx-4 mt-3`): Rows with icon + label + chevron:
- 我的订单 → `router.push('/order-details')`
- 我的收藏 → `router.push('/wishlist')`
- 积分与奖励 → `router.push('/goal')`

**Section: 账户设置** (`card-panel mx-4 mt-3`): Accordion rows (chevron down when open):
- 编辑资料 (name, email readonly, phone): keep existing form logic + Supabase save
- 修改密码: keep existing form logic
- 更换头像: keep existing file input + upload logic

**Section: 偏好设置** (`card-panel mx-4 mt-3`):
- 深色模式: inline toggle (existing `useThemeMode` logic)
- 语言 row: 「中文」text right-side, chevron. Tapping: demo only — bottom sheet with 「简体中文」(selected) and 「English」(grayed out, 「即将推出」badge). Store choice in `localStorage['lang']`.

**Section: 帮助与支持** (`card-panel mx-4 mt-3`):
- 联系客服 → `router.push('/support-chat')`
- 常见问题: tapping opens a bottom sheet with 5 hardcoded FAQ items:
  1. 如何获取积分？
  2. 如何使用积分抵扣？
  3. 如何退换货？
  4. 支持哪些支付方式？
  5. 如何修改收货地址？
  Each item is expandable in the sheet (accordion). Close button at top of sheet.

**Section: 退出登录** (`card-panel mx-4 mt-3 mb-6`):
- Single row, red text 「退出登录」, no icon, no chevron. On tap: call `signOut()`, then `router.push('/')`.

Remove: Old accordion toggle for "sign out as separate section", Flowbite `<Badge>`, `<ToggleSwitch>` (replace with a plain checkbox-style div).

### Support Chat

Keep all existing logic (ticket creation, chat window, rating modal). Restyle only:

**Top bar:** White sticky. Left: 「← 返回」→ `router.push('/settings')` (not `router.back()`). Center: 「联系客服」.

**Ticket form (TicketForm component):** Remove Flowbite `<Select>`, `<TextInput>`, `<Textarea>`, `<Button>`. Replace with native HTML inputs styled to match design system (same 56px input style as auth pages). Labels in Chinese (already Chinese). Submit button: black full-width 「开始对话」. Cancel button: outlined 「取消」→ `router.push('/settings')`.

**Chat window:** Keep `<ChatWindow>` component as-is (do not touch its internal styling in this task). Just ensure the top bar is correct and the rating modal shows properly.

**Verification:** `npx tsc --noEmit`. Check all three pages. Settings logout routes to `/`. Settings support chat button routes to `/support-chat`. Notification rows clickable.

---

## AGENT 11 — Order Details + Order Success + Auth Pages Wrap-Up

**Files to touch:**
- `src/app/(customer)/order-details/[orderId]/page.tsx` (or its client component) — restyle
- `src/app/(customer)/order-success/page.tsx` — restyle
- Final TypeScript pass across all changed files

### Order Details

Read the existing file to understand data shape. Keep all existing data fetching. Replace JSX.

**Top bar:** White sticky. Left: 「← 我的订单」→ `router.push('/order-details')`. Center: 「订单详情」.

**Status Timeline (demo):**
4 steps: 「已下单」→「已确认」→「已发货」→「已完成」
Map order `status` field to current step: `pending`=1, `confirmed`=2, `shipped`=3, `delivered`/`completed`=4.
Render: horizontal row, each step has a circle (filled `--color-accent` if reached, gray if not) + label below + connector line between circles.

**Estimated delivery (demo):** 「预计送达：{created_at + 5 business days}」in card below timeline.

**Items list:** Same compact row style as cart (thumbnail + name + qty + price). No quantity controls (order is placed).

**Delivery address block:** `card-panel p-4`. Show address if available on order record, else 「地址信息不可用」.

**Action buttons:**
- 「联系客服」full-width outlined button → `router.push('/support-chat')`
- 「再次购买」full-width black button (demo: adds all order items to cart via cart context, then `router.push('/cart')`). Only show if order has items still available.

### Order Success

Read existing file. Keep Stripe/payment logic. Replace JSX.

Full-screen centered layout:
- Large ✓ in `--color-accent` circle (animated scale-up on mount)
- Serif headline: 「订单已确认」
- Subtext: 「感谢您的购买！我们将尽快处理您的订单。」
- Order ID if available: small muted text 「订单编号：#XXXX」
- Points earned: 「本次订单获得 {n} 积分」in accent color
- Full-width black button: 「返回首页」→ `router.push('/')`
- Outlined button: 「查看订单」→ `router.push('/order-details')`
- No back button (user should not back to payment page)

### Final TS Pass

Run `npx tsc --noEmit`. Fix any remaining type errors introduced across all agents. Check for:
- Any remaining `router.back()` calls → replace with explicit routes
- Any English strings visible in customer UI → translate
- Any remaining Flowbite `<Button color="blue">` or `<Button color="green">` remaining in customer pages → replace with plain styled buttons
- Any `Buy Now` or `buynow` references remaining → remove

**Verification:** Full flow test — open localhost:3000 on mobile viewport:
1. Onboarding shows → skip → land on home
2. Browse to product section → open quick view → add to bag
3. Go to cart → proceed to checkout link visible
4. Go to `/settings` → logout → routes to home
5. Go to `/authentication/sign-in` → back button routes to home (not crashes)
6. All bottom nav tabs route correctly
