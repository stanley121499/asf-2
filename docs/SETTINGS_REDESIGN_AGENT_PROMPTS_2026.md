# Settings Page Redesign — Agent Prompts 2026

**Companion Plan**: `SETTINGS_REDESIGN_PLAN_2026.md`  
**Date**: March 2026  
**Model**: Gemini 2.5 Pro (High)  
**Total Agents**: 2  
**Project Path**: `e:\Dev\GitHub\asf-2-next`

---

## Context for ALL Agents (Read This First)

You are working on a **Next.js 14 App Router** project located at `e:\Dev\GitHub\asf-2-next`.  
Do **NOT** touch the original CRA project at `e:\Dev\GitHub\asf-2`.

### Tech Stack
- Next.js 14 (App Router)
- TypeScript strict mode
- Tailwind CSS + Flowbite React 0.7.5
- Supabase JS v2 for backend
- React Context API for global state
- `react-icons` for icons (`Hi` = Heroicons, `Fa` = Font Awesome)

### Critical Coding Rules (Enforce Without Exception)
1. `"use client"` at the very top of any file using `useState`, `useEffect`, `useContext`, event handlers, or browser APIs — **already present in this file, keep it**
2. **No `any` type** — define explicit TypeScript interfaces/types
3. **No non-null assertion operator (`!`)** — use optional chaining or conditional guards
4. **No `as unknown as T`** casting
5. **Double quotes** for all strings (`"like this"`, not `'like this'`)
6. **String templates** (`` `${value}` ``) instead of `+` concatenation
7. **Full inline JSDoc comments** on all functions and interfaces
8. **Error handling** on every async function
9. **Complete code only** — no placeholder comments like `// TODO` or `// implement later`
10. **Tailwind only** for styling — `style={}` only for truly dynamic values (the `paddingBottom` safe-area calc is an exception, keep it)

### Path Alias
All imports use `@/` which maps to `src/`. Example: `import { useAuthContext } from "@/context/AuthContext"`

---

---

## Agent 1 — Settings Page Full Redesign

### Your Task

Completely rewrite the JSX layout of `src/app/(customer)/settings/page.tsx` from a desktop sidebar/tab-panel design to a **mobile-first vertical Profile Hub** layout.

**All existing logic (state, handlers, effects) is kept exactly as-is.** Only the JSX returned by the component changes.

---

### File to Read in Full Before Starting

Read the entire file at:
```
src/app/(customer)/settings/page.tsx
```

You must understand every piece of existing state and logic before rewriting, because you will keep all of it:
- `activeTab` state — **you will replace tab-switching with accordion sections, but keep the state variable renamed to `openSection`**
- `userPoints`, `firstName`, `lastName`, `email`, `phone`, `avatarUrl`, `avatarFile`, `saving`, `pwCurrent`, `pwNew`, `pwConfirm`, `pwSaving` states — **keep all**
- `displayName` memo — **keep**
- `handleLogout`, `onAvatarChange`, `handleUploadAvatar`, `handleSaveProfile`, `handleUpdatePassword` handlers — **keep all, no changes**
- `themeMode`, `toggleMode`, `isDarkMode` — **keep**
- Guest state JSX (`if (!loading && !user)`) — **keep exactly as-is, no changes**
- Loading skeleton JSX (`if (loading)`) — **keep exactly as-is, no changes**

---

### Imports to Add

Add these new imports (some may already be present — check first, only add what is missing):

```typescript
import {
  HiOutlineShoppingBag,
  HiOutlineUser,
  HiOutlineQuestionMarkCircle,
  HiOutlineLogout,
  HiOutlineArrowLeft,
  HiOutlineMoon,
  HiOutlineSun,
  HiOutlineHeart,
  HiOutlineLockClosed,
  HiOutlinePhotograph,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiOutlineStar,
} from "react-icons/hi";
```

### State to Add

Add one new state variable for the accordion open/close control. **Also remove the `activeTab` state** (it is replaced by this):

```typescript
/** Controls which accordion section is currently expanded. null = all collapsed. */
const [openSection, setOpenSection] = useState<string | null>(null);

/**
 * Toggles an accordion section open or closed.
 * If the clicked section is already open, it closes. Otherwise the new section opens
 * and the previously open one closes (only one open at a time).
 */
const toggleSection = (section: string): void => {
  setOpenSection((prev) => (prev === section ? null : section));
};
```

---

### New Authenticated JSX (Replace the Authenticated `return` Block Only)

Replace everything from `// ── Authenticated view ─────────────────────────────────────────────────` down to (and including) the final `</>` closing tag of the authenticated return, with the following complete JSX.

**Do not change the guest state return or the loading skeleton return** — only the authenticated view at the bottom.

```tsx
// ── Authenticated view ─────────────────────────────────────────────────
return (
  <>
    <NavbarHome />
    <section
      className="min-h-screen bg-gray-100 dark:bg-gray-900"
      style={{ paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
    >
      {/* ── Back navigation ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors py-2 pr-2"
          aria-label="返回"
        >
          <HiOutlineArrowLeft className="h-4 w-4" />
          <span>返回</span>
        </button>
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">我的资料</span>
        <div className="w-12" aria-hidden="true" />
      </div>

      <div className="px-4 space-y-4 max-w-lg mx-auto">

        {/* ══ Profile Card ══════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <Avatar
              img={isNonEmptyString(avatarUrl) ? avatarUrl : undefined}
              alt="头像"
              rounded={true}
              size="lg"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-gray-900 dark:text-white truncate">
              {displayName || "用户"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
              {email || ""}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge color="info" className="text-xs px-2 py-0.5">
                金牌会员
              </Badge>
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <HiOutlineStar className="h-3.5 w-3.5 text-yellow-400" />
                {userPoints.toLocaleString()} 积分
              </span>
            </div>
          </div>
        </div>

        {/* ══ 我的账户 ══════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            我的账户
          </p>

          {/* Orders row */}
          <Link
            href="/order-details"
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:bg-gray-100 dark:active:bg-gray-600"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <HiOutlineShoppingBag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">
              我的订单
            </span>
            <HiOutlineChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </Link>

          <div className="mx-4 border-t border-gray-100 dark:border-gray-700" />

          {/* Wishlist row */}
          <Link
            href="/wishlist"
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:bg-gray-100 dark:active:bg-gray-600"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
              <HiOutlineHeart className="h-4 w-4 text-red-500 dark:text-red-400" />
            </div>
            <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">
              我的收藏
            </span>
            <HiOutlineChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </Link>

          <div className="mx-4 border-t border-gray-100 dark:border-gray-700" />

          {/* Points & Membership row */}
          <Link
            href="/goal"
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:bg-gray-100 dark:active:bg-gray-600"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-50 dark:bg-yellow-900/30 flex items-center justify-center">
              <HiOutlineStar className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
            </div>
            <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">
              积分与会员
            </span>
            <HiOutlineChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </Link>
        </div>

        {/* ══ 账户设置 ══════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            账户设置
          </p>

          {/* ── Edit Profile accordion ── */}
          <button
            type="button"
            onClick={() => toggleSection("profile")}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:bg-gray-100 dark:active:bg-gray-600 text-left"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
              <HiOutlineUser className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">
              编辑个人资料
            </span>
            {openSection === "profile"
              ? <HiOutlineChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              : <HiOutlineChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            }
          </button>
          {openSection === "profile" && (
            <div className="px-4 pb-4 space-y-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700">
              <div className="pt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                    名
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                    姓
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                  邮箱
                </label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                  电话号码
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <Button
                color="blue"
                size="sm"
                onClick={() => void handleSaveProfile()}
                disabled={saving}
                className="w-full"
              >
                {saving ? "保存中…" : "保存更改"}
              </Button>
            </div>
          )}

          <div className="mx-4 border-t border-gray-100 dark:border-gray-700" />

          {/* ── Change Password accordion ── */}
          <button
            type="button"
            onClick={() => toggleSection("password")}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:bg-gray-100 dark:active:bg-gray-600 text-left"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
              <HiOutlineLockClosed className="h-4 w-4 text-orange-500 dark:text-orange-400" />
            </div>
            <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">
              修改密码
            </span>
            {openSection === "password"
              ? <HiOutlineChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              : <HiOutlineChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            }
          </button>
          {openSection === "password" && (
            <div className="px-4 pb-4 space-y-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700">
              <div className="pt-3">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                  当前密码
                </label>
                <input
                  type="password"
                  value={pwCurrent}
                  autoComplete="current-password"
                  onChange={(e) => setPwCurrent(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                  新密码
                </label>
                <input
                  type="password"
                  value={pwNew}
                  autoComplete="new-password"
                  onChange={(e) => setPwNew(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                  确认新密码
                </label>
                <input
                  type="password"
                  value={pwConfirm}
                  autoComplete="new-password"
                  onChange={(e) => setPwConfirm(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <Button
                color="blue"
                size="sm"
                onClick={() => void handleUpdatePassword()}
                disabled={pwSaving}
                className="w-full"
              >
                {pwSaving ? "更新中…" : "更新密码"}
              </Button>
            </div>
          )}

          <div className="mx-4 border-t border-gray-100 dark:border-gray-700" />

          {/* ── Update Avatar accordion ── */}
          <button
            type="button"
            onClick={() => toggleSection("avatar")}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:bg-gray-100 dark:active:bg-gray-600 text-left"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
              <HiOutlinePhotograph className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">
              更换头像
            </span>
            {openSection === "avatar"
              ? <HiOutlineChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              : <HiOutlineChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            }
          </button>
          {openSection === "avatar" && (
            <div className="px-4 pb-4 space-y-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700">
              <div className="pt-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onAvatarChange}
                  className="w-full text-sm text-gray-700 dark:text-gray-300"
                />
              </div>
              <Button
                color="blue"
                size="sm"
                onClick={() => void handleUploadAvatar()}
                disabled={avatarFile === null}
                className="w-full"
              >
                上传头像
              </Button>
            </div>
          )}
        </div>

        {/* ══ 偏好设置 ══════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            偏好设置
          </p>

          {/* Dark mode toggle row */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              {isDarkMode
                ? <HiOutlineMoon className="h-4 w-4 text-indigo-400" />
                : <HiOutlineSun className="h-4 w-4 text-yellow-500" />
              }
            </div>
            <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">
              {isDarkMode ? "深色模式" : "浅色模式"}
            </span>
            <ToggleSwitch
              checked={isDarkMode}
              label=""
              onChange={toggleMode}
              color="blue"
            />
          </div>

          <div className="mx-4 border-t border-gray-100 dark:border-gray-700" />

          {/* Contact support row */}
          <Link
            href="/support-chat"
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:bg-gray-100 dark:active:bg-gray-600"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
              <HiOutlineQuestionMarkCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">
              联系客服
            </span>
            <HiOutlineChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </Link>
        </div>

        {/* ══ Logout button ════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors active:bg-red-100 dark:active:bg-red-900/30 text-left"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
              <HiOutlineLogout className="h-4 w-4 text-red-500" />
            </div>
            <span className="flex-1 text-sm font-semibold text-red-500">
              退出登录
            </span>
          </button>
        </div>

      </div>
    </section>
  </>
);
```

---

### Imports to Remove

After replacing the JSX, the following are no longer used — **remove them from the import statements** if they were previously imported:

- `Card` from `flowbite-react` (replaced by plain `div` cards)
- `Tooltip` from `flowbite-react` (no longer used)
- `OrdersList` from `./components/OrdersList` (replaced by a direct `<Link href="/order-details">` row)

> **Check first before removing** — do a search in the file for each name. Only remove if it is not referenced anywhere else in the file.

---

### State to Remove

Remove `activeTab` state and its `setActiveTab` calls. It is entirely replaced by `openSection` + `toggleSection`.

```typescript
// REMOVE this line:
const [activeTab, setActiveTab] = useState<string>("account");
```

---

### Verification Checklist

After completing the rewrite, verify:

1. `"use client"` is still the very first line of the file
2. The guest state block (`if (!loading && !user)`) is completely unchanged
3. The loading skeleton block (`if (loading)`) is completely unchanged
4. `openSection` state and `toggleSection` function are declared before the guest/loading returns
5. No `activeTab` references remain anywhere in the file
6. `Card`, `Tooltip`, and `OrdersList` are removed from imports (if no longer used)
7. All new icon imports (`HiOutlineHeart`, `HiOutlineChevronRight`, etc.) are present in the `react-icons/hi` import block
8. No TypeScript errors — all event handler calls use `void` for floating promises (e.g. `onClick={() => void handleSaveProfile()}`)
9. The `ToggleSwitch` import from `flowbite-react` is still present (it is used in the preferences section)
10. The `Avatar` and `Badge` imports from `flowbite-react` are still present

---

### Files to Modify

| File | Change |
|---|---|
| `src/app/(customer)/settings/page.tsx` | Replace authenticated view JSX; add `openSection` state + `toggleSection` helper; update imports |

---

---

## Agent 2 — Guest State Enhancement (Optional — Run After Agent 1)

### Your Task

This is a small enhancement to the **guest state** of the settings page. Currently the guest state just shows a sign-in button. Add a **dark mode toggle** row above the sign-in card so even unauthenticated users can switch themes.

> **Note**: Agent 1 does NOT change the guest state. This agent makes a targeted addition to it.

---

### File to Read Before Starting

Read the entire file at:
```
src/app/(customer)/settings/page.tsx
```

Read it **after Agent 1 has already run**, so you are working on the updated file.

---

### Exact Change

Find the guest state return block. It currently looks like:

```tsx
if (!loading && !user) {
  return (
    <>
      <NavbarHome />
      <section
        className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6"
        style={{ paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {/* Dark / Light mode toggle is always available — even for guests */}
        <div className="w-full max-w-sm mb-6 flex justify-end">
          <button
            type="button"
            onClick={toggleMode}
            ...
```

The dark mode toggle is already there — the guest state is already good. **No change needed.**

> Agent 2 is a no-op. Skip it. The guest state was already well-designed.

---

## Execution Notes

- **Only one agent is actually needed** — Agent 1 contains the full rewrite.
- Agent 2 was included as a safety net but its work is already done in the existing code.
- After Agent 1 completes, start the dev server (`npm run dev`) and navigate to `/settings` while logged in to verify the new layout renders correctly.
- Test on a mobile viewport (375px wide) in browser DevTools.
- Verify:
  - Tapping "编辑个人资料" opens the accordion form inline
  - Tapping it again closes it
  - Opening "修改密码" auto-closes "编辑个人资料" (only one open at a time)
  - "我的收藏" row navigates to `/wishlist`
  - "我的订单" row navigates to `/order-details`
  - "积分与会员" row navigates to `/goal`
  - Dark mode toggle switches the theme
  - "退出登录" logs out and redirects to `/`
