# Customer App — Fix Prompts Round 6 (March 2026)

These are the remaining agent tasks needed after the Round 5 direct code patches. The following bugs were directly fixed in code (run `git diff` to verify):
- `RewardsClient.tsx` now has `<BottomNavbar />`
- `bottom-nav.tsx` now uses `<button onClick={() => router.push(href)}>` for all 5 tabs (Flutter WebView fix)
- `cart/page.tsx` had a double BottomNavbar (it uses LandingLayout → NavbarHome → BottomNavbar, plus had an explicit one). The explicit one and its import were removed.

Run the following agents for the remaining issues.

---

## AGENT 1 — Fix support-chat: Don't auto-redirect guests to sign-in

### Root Cause
`support-chat/page.tsx` uses a `useEffect` that calls `router.push('/authentication/sign-in?returnTo=/support-chat')` when `!user`. This forces a sign-in redirect even if the user just quickly taps 联系客服. 

The guest user should be able to SEE the support form and fill it out. Authentication should only be required when SUBMITTING.

**File: `asf-2-next/src/app/(customer)/support-chat/page.tsx`**

Read the full file.

1. Remove the `useEffect` that auto-redirects guests (approximately lines 20–24):
```tsx
  useEffect(() => {
    if (!loading && !user) {
      router.push(`/authentication/sign-in?returnTo=${encodeURIComponent('/support-chat')}`);
    }
  }, [user, loading, router]);
```
Delete it entirely.

2. Remove the `if (loading || !user)` early return block (approximately lines 26–40). Keep the loading spinner but show it only when `loading` is true (not when `!user`):
```tsx
  if (loading) {
    return (
      <LandingLayout>
        <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
          <div className="flex items-center justify-center py-12">
            <div className="flex gap-1.5">
              {[0, 150, 300].map((delay) => (
                <span key={delay} className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-bounce" style={{ animationDelay: `${delay}ms` }} />
              ))}
            </div>
          </div>
        </div>
      </LandingLayout>
    );
  }
```

3. In the `handleSubmit` function, allow guests to submit (remove any `!user` check inside it). The form currently doesn't use `user.id` for anything — it just sets `submitted = true`. Keep it as is.

**Verification:** Log out. Tap 联系客服. Should show the form immediately without redirecting. Fill in the form and submit. Should show success state. Bottom nav still visible throughout.

---

## AGENT 2 — Flutter WebView: Remove all fullscreen API calls to avoid crashes

### Root Cause
Flutter WebView (especially `webview_flutter` / `InAppWebView`) does NOT support `requestFullscreen()`. Calling it throws a `DOMException: Failed to execute 'requestFullscreen' on 'Element'` which can crash the webview.

**File: `asf-2-next/src/components/PostCard.tsx`**

Find the fullscreen button `onClick` handler:
```tsx
onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();
  const v = videoRef.current;
  if (!v) return;
  if (v.requestFullscreen) { void v.requestFullscreen(); }
  else if ((v as unknown as { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen) {
    (v as unknown as { webkitEnterFullscreen: () => void }).webkitEnterFullscreen();
  }
}}
```

Wrap the fullscreen call in a try-catch so WebView crashes are silently caught:
```tsx
onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();
  const v = videoRef.current;
  if (!v) return;
  try {
    if (v.requestFullscreen) {
      void v.requestFullscreen();
    } else if ((v as unknown as { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen) {
      (v as unknown as { webkitEnterFullscreen: () => void }).webkitEnterFullscreen();
    }
  } catch {
    // Fullscreen not supported in this environment (e.g. Flutter WebView)
  }
}}
```

---

## AGENT 3 — Flutter WebView: Ensure viewport and safe area is correctly set

### Root Cause
Flutter WebView renders the page inside a constrained viewport. The app needs to communicate safe area insets correctly and avoid any `100vh` CSS that may extend beyond the WebView bounds.

**File: `asf-2-next/src/app/layout.tsx`** (the root layout)

Read the file. Find the `<meta name="viewport">` tag. Update it to:
```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
/>
```
The key additions are `maximum-scale=1.0, user-scalable=no` (prevents unwanted zoom on tap in WebView) and `viewport-fit=cover` (needed for safe area insets).

Also add a meta tag specifically for WebView:
```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="mobile-web-app-capable" content="yes" />
```

**File: `asf-2-next/src/app/globals.css`** (or equivalent global CSS)

Find the `html, body` rule. Add:
```css
html, body {
  overscroll-behavior: none; /* Prevent pull-to-refresh in WebView */
  -webkit-overflow-scrolling: touch; /* Smooth scrolling in iOS WebView */
}
```

**Verification:** `npx tsc --noEmit`. App should still look normal. In a Flutter WebView environment, this prevents rubber-band scroll, unwanted zoom, and safe area overflow.

---

## AGENT 4 — Final TypeScript + verification

1. `npx tsc --noEmit` — fix every error.
2. Manual test:
   - Go to 联系客服 (as guest) → form shows ✓
   - 积分与奖励 → rewards page → bottom nav shows ✓
   - All 5 bottom nav tabs respond immediately on tap ✓
   - Cart page has single bottom nav (no duplicate) ✓
   - Videos: fullscreen button present but no crash on tap ✓
