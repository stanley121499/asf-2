# Highlights Page — Scroll & Image Load Performance Issue

**Date:** March 2026
**Reported By:** User (customer-facing)
**Symptom:** App feels laggy, scrolling is choppy, images take a long time to appear — even with lazy loading already applied
**File Affected:** `src/pages/landing/Highlights.tsx`

---

## Executive Summary

Despite native `loading="lazy"` being present on most images in `Highlights.tsx`, users still experience slow image loads and choppy scrolling. The root cause is a combination of **three separate problems** that compound each other: a data architecture flaw that delays image URLs from being available at all, an unnecessary re-render cycle caused by misusing `useEffect` for a computation that belongs in `useMemo`, and the absence of any intelligent preloading strategy that loads images ahead of the scroll position. The scroll choppiness is a downstream symptom of these — images paint suddenly mid-scroll because they were not loaded early enough, causing layout shifts and jank.

---

## Problem 1 — Image URLs Are Not Available on First Render (Data Architecture)

### What Is Happening

`Highlights.tsx` consumes two separate contexts: `PostContext` and `PostMediaContext`. Posts arrive with `medias: []` (an intentional design choice in `PostContext.tsx` — medias are attached elsewhere). This means every image `src` attribute relies on the `postMediaMap` fallback, which is only populated after `PostMediaContext` finishes its own separate Supabase fetch.

The result is a three-step waterfall before any image appears:

```
Step 1 → PostContext fetches posts (medias: [] on all posts)
Step 2 → PostMediaContext fetches post_medias separately
Step 3 → postMediaMap is built → React re-renders → src is now a real URL
Step 4 → Browser finally starts downloading the image
```

This means the `src` attribute on every image starts as `undefined`, falls through to a placeholder (`via.placeholder.com`), and only updates to the real URL after both context fetches complete. The browser sees a placeholder URL, then receives a completely different URL on re-render, and starts the download from scratch. The user sees nothing for several seconds even though the page has already rendered.

### Code Evidence

```tsx
// In Highlights.tsx — this chain always resolves to placeholder first:
src={
  featuredPosts[0].medias?.[0]?.media_url   // always undefined (medias: [])
  || postMediaMap.get(featuredPosts[0].id)   // only available after postMedias loads
  || "https://via.placeholder.com/..."       // shown until postMedias arrives
}
```

---

## Problem 2 — Extra Re-Render Cycle from `useEffect` Misuse

### What Is Happening

The component sorts posts using `useEffect` + `setState`, which is the wrong tool for a synchronous derived computation. Every time `posts` updates (including when `PostMediaContext` triggers a re-render), this pattern fires: first the component renders with the previous `featuredPosts`, then the `useEffect` runs synchronously after paint, then `setFeaturedPosts` triggers a second render. This means every single image re-evaluates its `src` twice per data update cycle, and every `useMemo` and downstream expression re-runs an extra time.

### Code Evidence

```tsx
// ❌ Wrong tool — causes two renders every time posts changes
const [featuredPosts, setFeaturedPosts] = useState<any[]>([]);

useEffect(() => {
  const sortedPosts = [...posts].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  setFeaturedPosts(sortedPosts); // ← triggers a second render
}, [posts]);
```

The correct tool is `useMemo`, which computes the sorted array synchronously during the render that already has new `posts` data — no second render needed.

---

## Problem 3 — No Smart Preloading Strategy

### What Is Happening

The current approach uses native `loading="lazy"` on all below-fold images. This is better than eager loading, but the browser's built-in lazy load threshold is conservative — it typically starts fetching images only when they are within ~0–200px of the viewport. On a page as tall as `Highlights.tsx` (two 75vh hero banners, multiple grid sections), this means images just below the current scroll position are not yet loading. The moment the user scrolls to them, the download begins — and then the user waits.

There are two additional sub-problems here:

**Sub-problem A — No skeleton while contexts are loading.** The `loading` flags from both `PostContext` and `PostMediaContext` are available but unused. During the initial fetch (which can take 1–3 seconds), the page renders a blank white area. The user has no visual feedback that content is coming.

**Sub-problem B — No smooth image fade-in.** When an image does load, it paints instantly at full opacity. If the user is scrolling at the exact moment, the abrupt paint contributes to the perceived jankiness.

---

## Problem 4 — Horizontal Carousel Has No Scroll UX Polish

### What Is Happening

The "Trending Products" horizontal scroll container (line 164) is a plain `overflow-x-auto` `div`. On mobile it has no `scroll-snap` behaviour, meaning the cards do not cleanly stop at card boundaries — the scroll momentum continues and cards land at arbitrary offsets. There is also no `overscroll-behavior-x: contain`, so horizontal scroll can inadvertently bleed into vertical page scroll.

---

## Proposed Fix Strategy

### Tier 1 — Immediate Programmatic Preload (above fold + near fold)

As soon as image URLs are known from context (after the data waterfalls resolve), programmatically create `new Image()` objects for the **first 4–5 images** in memory. The browser fetches and caches these in the background. By the time the user sees the `<img>` element on screen, the browser serves it from cache — instantly.

This is implemented as a `useImagePreloader` custom hook that accepts an array of URL strings and fires off in-memory Image requests as a side effect.

### Tier 2 — IntersectionObserver with Early Trigger (below fold)

Replace native `loading="lazy"` with a `SmartImage` component that uses `IntersectionObserver` with a `rootMargin` of `"600px 0px"`. This means images begin downloading **600px before** they enter the viewport — a full screen-height ahead on most mobile devices. By the time the user scrolls to any image, it is already loaded.

The `SmartImage` component also provides:
- A **skeleton shimmer** (`animate-pulse`) while the image is loading or the URL is not yet available
- A **smooth fade-in** (`opacity-0 → opacity-100`) when the image is ready, eliminating jarring paints mid-scroll

### Supporting Fixes

| Fix | File | Why |
|-----|------|-----|
| Replace `useEffect` + `setState` sort with `useMemo` | `Highlights.tsx` | Eliminates the extra render cycle |
| Add skeleton loading state while contexts load | `Highlights.tsx` | Eliminates blank white page on first load |
| Add `scroll-snap-type` to horizontal carousel | `Highlights.tsx` | Smooth card-stopping behaviour |
| Fix `any[]` type on `featuredPosts` | `Highlights.tsx` | Type safety compliance |

---

## Files to Be Created or Modified

| Action | File |
|--------|------|
| **Create** | `src/hooks/useImagePreloader.ts` |
| **Create** | `src/components/SmartImage.tsx` |
| **Modify** | `src/pages/landing/Highlights.tsx` |

---

## Expected Outcome After Fixes

| Symptom | Before | After |
|---------|--------|-------|
| Blank white page on load | Visible for 1–3s | Replaced with skeleton shimmer |
| Hero image load time | After both DB fetches complete | Same (data waterfall unchanged), but skeleton hides the wait |
| Below-fold image load | Starts when image enters viewport | Starts 600px before viewport |
| Image paint mid-scroll | Abrupt full-opacity pop-in | Smooth 500ms fade-in |
| Horizontal carousel scroll | Lands at arbitrary offsets | Snaps cleanly to each card |
| Extra re-render on data update | 2 renders per posts change | 1 render per posts change |
