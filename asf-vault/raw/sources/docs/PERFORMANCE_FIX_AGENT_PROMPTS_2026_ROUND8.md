# Performance Fix Agent Prompts — Round 8 (2026): White Scroll Blank Sections

**Status**: Ready for Implementation  
**Audit Date**: March 14, 2026  
**Companion Plan**: `PERFORMANCE_FIX_PLAN_2026_ROUND8.md`

> **The Problem**: Already-rendered sections turn completely white/blank during fast scroll — even content that was visible a moment ago. Cards get cut in half. Scrolling feels very laggy.  
> **Root Cause**: Too many GPU compositor layers from `transition-all`, `scale` transforms, and `transition-opacity` gradient overlays on every card. The browser's GPU tile cache fills up and evicts off-screen tiles, which appear white until re-painted.  
> **Not fixed by**: IntersectionObserver changes, lazy loading, or realtime subscription reductions.

---

## Agent 1 — Fix HomeHighlightsCard GPU Layer Explosion

### Overview

You are a senior React/TypeScript developer. You will make three CSS changes to `src/components/home/HomeHighlightsCard.tsx` to dramatically reduce the GPU compositor layer count on the homepage.

**Every card on the home page carousels creates approximately 4-5 GPU compositor layers due to:**
1. `transition-all` on the outer Link → promotes entire card to GPU layer
2. `group-hover:scale-105` on the image → promotes image to GPU layer  
3. `transition-opacity` on the hover gradient overlay → another GPU layer
4. The static dark gradient overlay → another GPU layer

With 5 carousels × 10 cards each, this is **200+ GPU layers** on a single page, exhausting the GPU tile cache and causing the browser to evict tiles for off-screen content (which appears as white/blank when scrolled back to).

---

### File to Modify

`src/components/home/HomeHighlightsCard.tsx`

---

### Change 1 — Replace `transition-all` with `transition-shadow` on the outer Link

**FIND** (line ~92):
```tsx
      className={[
        "flex-shrink-0 w-68 bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 relative group",
        className,
      ].join(" ")}
```

**REPLACE WITH:**
```tsx
      className={[
        "flex-shrink-0 w-68 bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-100 relative group",
        className,
      ].join(" ")}
```

> **Why**: `transition-all` causes the browser to speculatively promote the element to a GPU compositor layer because it includes `transform` in all transitions. `transition-shadow` only transitions `box-shadow`, which is composited on the CPU and does NOT create a GPU layer.

---

### Change 2 — Remove the hover scale from the image and merge gradient overlays

**FIND** the entire image/video section (lines ~107–115):
```tsx
      {/* Image / Video */}
      <div className="h-48 bg-gray-100 relative">
        <MediaThumb
          src={resolvedImageUrl}
          alt={resolvedAlt}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-30"></div>
      </div>
```

**REPLACE WITH:**
```tsx
      {/* Image / Video */}
      <div className="h-48 bg-gray-100 relative overflow-hidden">
        <MediaThumb
          src={resolvedImageUrl}
          alt={resolvedAlt}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"></div>
      </div>
```

> **Why**: `group-hover:scale-105` + `transition-transform` makes the browser create a GPU compositor layer for this element anticipating the transform. Since the wrapper now has `overflow-hidden`, removing the scale doesn't change the visual much, but saves one GPU layer per card = ~50 layers saved. The gradient overlay is simplified and made static (no `transition-opacity`) to eliminate another layer.

---

### Change 3 — Remove the animated hover gradient overlay entirely

**FIND** (line ~97–98):
```tsx
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-30 transition-opacity duration-500 rounded-xl"></div>
```

**DELETE THIS ENTIRE LINE / BLOCK** (remove it completely).

> **Why**: `transition-opacity` on an `absolute inset-0` full-card div creates a GPU compositor layer for the entire card area. Since opacity transitions are composited, the browser needs a separate GPU texture covering the full card (17rem × card-height). With 50 cards this is ~50 large GPU textures. The hover effect is subtle and not worth the cost.

---

### Final Result for HomeHighlightsCard

The render section should look like this after all changes:

```tsx
  return (
    <Link
      to={to}
      className={[
        "flex-shrink-0 w-68 bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-100 relative group",
        className,
      ].join(" ")}
      style={{ width: "17rem" }}
    >
      {/* Optional badge */}
      {typeof badgeText === "string" && badgeText.trim().length > 0 && (
        <div className="absolute top-3 right-3 bg-gradient-to-r from-indigo-700 to-purple-800 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10">
          {badgeText}
        </div>
      )}

      {/* Image / Video */}
      <div className="h-48 bg-gray-100 relative overflow-hidden">
        <MediaThumb
          src={resolvedImageUrl}
          alt={resolvedAlt}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"></div>
      </div>

      {/* Text content */}
      <div className="p-5 relative">
        <h3 className="font-bold text-gray-900 truncate">{title}</h3>
        <p className="text-sm text-gray-600 line-clamp-2 mt-2 leading-relaxed">{subtitle}</p>
        <div className="mt-4 flex justify-end">
          <span className="text-xs text-indigo-700 font-medium">{ctaText}</span>
        </div>
      </div>
    </Link>
  );
```

---

### Verification

1. `npx tsc --noEmit` — must pass with 0 errors.
2. Open the home page. The horizontal carousels should still look correct.
3. Open Chrome DevTools → **Layers panel** (More tools → Layers). The home page should show significantly fewer GPU layers than before.
4. Scroll up and down fast — the white/blank section issue should be reduced or eliminated.

---

---

## Agent 2 — Fix home.tsx Product Card GPU Layers + Add content-visibility

### Overview

You are a senior React/TypeScript developer. You will make two changes to `src/pages/landing/home.tsx`:

1. Remove `group-hover:scale-110` and `transition-transform` from inline product cards (same fix as Agent 1 applied to HomeHighlightsCard)
2. Add `content-visibility: auto` to each ScrollableSection wrapper so off-screen sections don't consume GPU tile cache budget

---

### File to Modify

`src/pages/landing/home.tsx`

---

### Change 1 — Remove scale hover effect on product card images

**FIND** (in the products `renderItem`, around line 708–713):
```tsx
                  <div className="h-44 bg-gray-100 relative">
                    <MediaThumb
                      src={productMediaUrl || "/default-image.jpg"}
                      alt={product.name || `商品 ${index + 1}`}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
```

**REPLACE WITH:**
```tsx
                  <div className="h-44 bg-gray-100 relative overflow-hidden">
                    <MediaThumb
                      src={productMediaUrl || "/default-image.jpg"}
                      alt={product.name || `商品 ${index + 1}`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
```

---

### Change 2 — Replace `transition-all` on product card Link

**FIND** (in the products `renderItem`, around line 703–706):
```tsx
                <Link
                  to={`/product-details/${product.id}`}
                  key={`product-${product.id || index}`}
                  className="flex-shrink-0 w-44 bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 transform hover:-translate-y-1 group"
                >
```

**REPLACE WITH:**
```tsx
                <Link
                  to={`/product-details/${product.id}`}
                  key={`product-${product.id || index}`}
                  className="flex-shrink-0 w-44 bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-100 group"
                >
```

> **Why**: Remove `transform hover:-translate-y-1` (creates GPU layer), `transition-all` (promotes to GPU layer), keep only `transition-shadow`.

---

### Change 3 — Add `content-visibility: auto` to each ScrollableSection wrapper

`content-visibility: auto` lets the browser skip rendering off-screen sections entirely. This is the single most effective fix for the tile eviction problem: if a section isn't rendered, it has zero GPU layers and zero tile cost.

The `ScrollableSection` component renders:
```tsx
<div className="mb-6">
  ...
</div>
```

**FIND** the `ScrollableSection` component definition (around lines 32–72) and add `content-visibility: auto` via inline style to prevent off-screen sections from creating GPU tiles:

```tsx
// FIND:
  return (
    <div className="mb-6">

// REPLACE WITH:
  return (
    <div className="mb-6" style={{ contentVisibility: "auto", containIntrinsicSize: "0 300px" }}>
```

> **Why**: `content-visibility: auto` tells the browser it does not need to render this element's contents if it is not near the viewport. `containIntrinsicSize: "0 300px"` gives the browser a size hint (300px tall) so the scrollbar doesn't jump when sections are skipped. This is supported in all modern browsers (Chrome 85+, Firefox 125+, Safari 18+).

---

### Verification

1. `npx tsc --noEmit` — must pass with 0 errors.
2. Open the home page in Chrome DevTools → Layers panel. Sections that are not near the viewport should no longer appear as compositor layers.
3. Scroll up and down fast — the white/blank section issue should be resolved.
4. Product card hover should still show `shadow-xl` lift effect (just no scale transform).

---

---

## Summary

| Agent | Files | GPU Layers Saved |
|-------|-------|-----------------|
| Agent 1 | `HomeHighlightsCard.tsx` | ~150 layers (transition-all, scale, opacity overlay per card × 50 cards) |
| Agent 2 | `home.tsx` | ~50+ layers (product cards) + off-screen section layers (content-visibility) |

**Combined result**: The home page should have dramatically fewer GPU compositor layers, allowing the browser's tile cache to comfortably hold all on-screen and near-screen content without eviction. The white/blank section problem should be eliminated.
