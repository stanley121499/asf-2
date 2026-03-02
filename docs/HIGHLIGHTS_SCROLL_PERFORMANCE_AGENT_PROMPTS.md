# Highlights Page — Scroll & Image Performance Agent Prompts

**Last Updated:** March 2026
**Purpose:** Two focused agent prompts to implement the smart image preloading and scroll performance improvements described in `HIGHLIGHTS_SCROLL_PERFORMANCE_ISSUE.md`
**Model:** Gemini 1.5 Pro (High context)
**Execution Order:** Run Agent 1 first, then Agent 2 (Agent 2 depends on the `SmartImage` component created in Agent 1)

---

## AGENT 1 — Create Smart Image Loading Infrastructure

**Priority:** High
**Files to Create:** `src/hooks/useImagePreloader.ts`, `src/components/SmartImage.tsx`
**Files to Read (context only):** `src/pages/landing/Highlights.tsx`
**Depends On:** Nothing (standalone new files)
**Must Complete Before:** Agent 2

---

### Prompt

You are implementing a smart two-tier image preloading system for a React + TypeScript application. The project uses Tailwind CSS for styling and strict TypeScript (no `any` types, no `!` non-null assertions, no `unknown` casts). All strings use double quotes. All comments must use JSDoc-style headers on functions and clear inline comments on logic.

---

**TASK 1 of 2 — Create `src/hooks/useImagePreloader.ts`**

Create a custom React hook that programmatically preloads an array of image URLs by creating hidden `Image` objects in memory. The browser caches these requests under the same URL key, so when the corresponding `<img>` element later renders with the same `src`, the browser serves it from cache instantly.

Requirements:
- The hook accepts a `string[]` of image URLs.
- It filters out empty strings and URLs containing `"via.placeholder.com"` — these are fallback placeholders and should not be preloaded.
- It creates one `new Image()` per valid URL and sets its `src`, triggering a background browser fetch.
- The `useEffect` cleanup function sets each `img.src` to `""` so garbage collection can reclaim memory.
- The `useEffect` dependency array must only contain the `urls` parameter.
- The hook returns `void`.
- Include a JSDoc comment on the function explaining what it does and when to use it.

---

**TASK 2 of 2 — Create `src/components/SmartImage.tsx`**

Create a `SmartImage` React functional component that is a drop-in replacement for a plain `<img>` tag. It uses `IntersectionObserver` to begin loading an image well before it enters the viewport, shows a skeleton shimmer while loading, and fades the image in smoothly once it is loaded.

Requirements:

Define a `SmartImageProps` interface with these fields (all strictly typed, no `any`):
- `src: string` — the image URL
- `alt: string` — alt text for accessibility
- `className?: string` — Tailwind classes forwarded to the inner `<img>` element (optional, default `""`)
- `rootMargin?: string` — how far before the viewport to begin loading (optional, default `"600px 0px"`)
- `eager?: boolean` — if `true`, skip the IntersectionObserver and load immediately (for above-fold images); default `false`

Component behaviour:
1. Maintain two pieces of state: `isVisible: boolean` (has the element come within `rootMargin` of the viewport) and `isLoaded: boolean` (has the image `onLoad` fired).
2. Attach a `ref` to a wrapper `div`.
3. In a `useEffect`, if `eager` is `true` skip the observer entirely (set `isVisible` to `true` by default). Otherwise create an `IntersectionObserver` with the provided `rootMargin`. When the element enters the observer's bounds, set `isVisible` to `true` and call `observer.disconnect()`. The cleanup function must call `observer.disconnect()`.
4. Render a wrapper `div` with `position: relative` and `overflow: hidden`. The `className` prop should be applied to this wrapper.
5. While `isLoaded` is `false`, render an absolutely-positioned `div` covering the full wrapper (`absolute inset-0`) with Tailwind classes `bg-gray-200 animate-pulse` as the skeleton.
6. When `isVisible` is `true`, render the `<img>` with `src`, `alt`, `decoding="async"`, `w-full h-full object-cover`, and a `transition-opacity duration-500` plus `opacity-0` / `opacity-100` toggle driven by `isLoaded`. Set `isLoaded` to `true` in the `onLoad` handler.
7. When `isVisible` is `false`, do not render the `<img>` at all (return `null` for that branch) — this prevents the browser from seeing the `src` before it is time.

Include a JSDoc header on the component explaining what it does.

Export the component as the default export.

---

## AGENT 2 — Refactor `Highlights.tsx` to Use Smart Loading

**Priority:** High
**Files to Modify:** `src/pages/landing/Highlights.tsx`
**Files to Read (context only):**
- `src/hooks/useImagePreloader.ts` (created by Agent 1)
- `src/components/SmartImage.tsx` (created by Agent 1)
- `src/context/post/PostContext.tsx` (to understand the `Post` type and `loading` flag)
- `src/context/post/PostMediaContext.tsx` (to understand `loading` flag)
**Depends On:** Agent 1 must be complete

---

### Prompt

You are refactoring `src/pages/landing/Highlights.tsx` in a React + TypeScript application. The project uses Tailwind CSS and strict TypeScript (no `any` types, no `!` non-null assertions, no `unknown` casts). All strings use double quotes. All comments must be clear inline comments or JSDoc headers.

Read the full current content of `src/pages/landing/Highlights.tsx` before making any changes.

Also read:
- `src/hooks/useImagePreloader.ts` — understand what the hook does and its signature
- `src/components/SmartImage.tsx` — understand the props interface and when to pass `eager={true}`
- `src/context/post/PostContext.tsx` — note the `Post` type (it has `id`, `caption`, `created_at`, `medias: PostMedia[]`) and the `loading: boolean` export
- `src/context/post/PostMediaContext.tsx` — note the `loading: boolean` export

Apply ALL of the following changes to `Highlights.tsx`. Do not change any other file.

---

**CHANGE 1 — Fix the type of `featuredPosts`**

Replace the `any[]` type with the correct `Post[]` type imported from `PostContext`. The `Post` type is already exported from `src/context/post/PostContext.tsx`.

```
// Before
const [featuredPosts, setFeaturedPosts] = useState<any[]>([]);

// After — remove the useState entirely, use useMemo (see Change 2)
```

---

**CHANGE 2 — Replace `useEffect` + `useState` sort with `useMemo`**

Remove the `featuredPosts` state variable and its `useEffect` entirely. Replace them with a `useMemo` that sorts the posts array and returns the result directly. This eliminates the extra render cycle that was causing image `src` attributes to be re-evaluated twice per data update.

```tsx
// Remove this:
const [featuredPosts, setFeaturedPosts] = useState<any[]>([]);
useEffect(() => {
  const sortedPosts = [...posts].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  setFeaturedPosts(sortedPosts);
}, [posts]);

// Add this instead (type must be Post[], import Post from PostContext):
const featuredPosts = useMemo<Post[]>(
  () =>
    [...posts].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
  [posts]
);
```

Also remove `useState` from the React import since it is no longer used (keep `useEffect` removed; keep `useMemo` since it was already imported).

---

**CHANGE 3 — Consume the `loading` flags from both contexts**

Destructure `loading` from both `usePostContext()` and `usePostMediaContext()`, giving them distinct names:

```tsx
const { posts, loading: postsLoading } = usePostContext();
const { postMedias, loading: mediaLoading } = usePostMediaContext();
```

---

**CHANGE 4 — Add a skeleton loading screen**

After all hooks and `useMemo` declarations, add an early return that renders a skeleton while either context is loading. The skeleton must match the page structure (full-width `NavbarHome` + two 75vh shimmer blocks below it):

```tsx
if (postsLoading || mediaLoading) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <NavbarHome />
      <div className="w-full h-[75vh] bg-gray-200 animate-pulse" />
      <div className="w-full h-[75vh] bg-gray-200 animate-pulse mt-2" />
    </div>
  );
}
```

Place this immediately after all `useMemo` declarations and before the main `return`.

---

**CHANGE 5 — Build the above-fold URL list and call `useImagePreloader`**

After the `postMediaMap` useMemo, build an array of the first 5 image URLs to preload immediately. Then call `useImagePreloader` with that array.

```tsx
/** Collect above-fold and near-fold image URLs to programmatically preload */
const preloadUrls = useMemo<string[]>(
  () =>
    featuredPosts.slice(0, 5).map(
      (post) =>
        post.medias?.[0]?.media_url ??
        postMediaMap.get(post.id) ??
        ""
    ),
  [featuredPosts, postMediaMap]
);

useImagePreloader(preloadUrls);
```

Import `useImagePreloader` from `"../../hooks/useImagePreloader"`.

---

**CHANGE 6 — Replace all `<img>` tags with `<SmartImage>`**

Import `SmartImage` from `"../../components/SmartImage"`.

Replace every `<img>` element in the file with `<SmartImage>`, following these rules:

- The hero banner image (index 0, currently `loading="eager" fetchPriority="high"`) must receive `eager={true}`. Do not pass `loading` or `fetchPriority` — `SmartImage` handles this internally.
- All other images must NOT receive `eager` (it defaults to `false`), so they use the `IntersectionObserver` path.
- The `className` passed to `SmartImage` must be the same className string that was on the original `<img>` tag (e.g. `"w-full h-[75vh] object-cover"`). The wrapper `div` inside `SmartImage` applies these, and the inner `<img>` always gets `w-full h-full object-cover`.
- Keep the `src` and `alt` logic identical to what it was on the original `<img>`.
- Remove the `loading`, `decoding`, and `fetchPriority` attributes — they are handled inside `SmartImage`.

Example for the hero banner:
```tsx
// Before:
<img
  src={featuredPosts[0].medias?.[0]?.media_url ||
    postMediaMap.get(featuredPosts[0].id) ||
    "https://via.placeholder.com/800x600?text=Featured+Highlight"}
  alt="Featured Collection"
  className="w-full h-[75vh] object-cover"
  loading="eager"
  fetchPriority="high"
  decoding="async"
/>

// After:
<SmartImage
  src={
    featuredPosts[0].medias?.[0]?.media_url ??
    postMediaMap.get(featuredPosts[0].id) ??
    "https://via.placeholder.com/800x600?text=Featured+Highlight"
  }
  alt="Featured Collection"
  className="w-full h-[75vh] object-cover"
  eager={true}
/>
```

Note: Replace all `||` fallback chains in `src` with `??` (nullish coalescing) for correctness — `||` would incorrectly skip an empty string as falsy.

---

**CHANGE 7 — Add scroll-snap to the horizontal carousel**

Find the "Trending Products" horizontal scroll container `div` (the one with `overflow-x-auto`). Add the following Tailwind classes to it:
- `scroll-smooth`
- `snap-x`
- `snap-mandatory`
- `overscroll-x-contain`

Also add `snap-start` to each card `Link` inside the carousel map (the one with `flex-shrink-0 w-[60vw]`).

---

**IMPORTANT — Do not change anything else.** Do not modify the section text (e.g., "DREAMY PASTELS"), the layout structure, the `Link` destinations, the button labels, or any logic in the contexts. Only apply the 7 changes listed above.

After all changes, verify the file has no TypeScript errors by reviewing that:
- `Post` is imported from `"../../context/post/PostContext"`
- `useImagePreloader` is imported from `"../../hooks/useImagePreloader"`
- `SmartImage` is imported from `"../../components/SmartImage"`
- `useState` is removed from the React import (it is no longer used)
- `useEffect` is removed from the React import (it is no longer used)
- `useMemo` remains in the React import

---

## Summary

| Agent | Creates / Modifies | Key Outcome |
|-------|-------------------|-------------|
| Agent 1 | Creates `useImagePreloader.ts` and `SmartImage.tsx` | Reusable infrastructure for smart image loading |
| Agent 2 | Modifies `Highlights.tsx` | Page uses the new infrastructure; smooth loading, no blank screen, snappy carousel |
