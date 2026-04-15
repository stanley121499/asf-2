# Performance Fix Plan — Round 8 (2026): White/Blank Sections on Fast Scroll

**Status**: Ready for Implementation  
**Audit Date**: March 14, 2026  
**Focus**: Entire sections go blank white on fast scroll (even already-loaded content)  
**Companion Docs**: `PERFORMANCE_FIX_PLAN_2026_ROUND7.md`, `PERFORMANCE_FIX_AGENT_PROMPTS_2026_ROUND8.md`

---

## Root Cause: GPU Compositor Tile Eviction

This is **not** a lazy loading issue. The content has already been painted — it goes white on scroll BACK to content that was previously rendered. This is the browser **evicting GPU compositor paint tiles** for off-screen content because the GPU tile cache is exhausted.

### How it happens

Browsers maintain a tile cache of rasterized (GPU-painted) regions. When the cache fills up, the browser evicts tiles for content far from the current viewport. When the user scrolls back to an evicted area, the browser must re-rasterize it — causing visible white/blank areas until repainting completes.

The tile cache fills up because **this codebase creates an abnormally large number of GPU compositor layers** for a landing page. Every compositor layer consumes GPU VRAM and tile cache budget.

---

## What Creates GPU Compositor Layers (The Problem)

A browser promotes a DOM element to a separate GPU compositor layer whenever it detects the element:
1. Has a CSS transition/animation on any composited property (`opacity`, `transform`)
2. Has `will-change: transform` or `will-change: opacity`
3. Contains a `<video>` or `<canvas>`
4. Uses `position: fixed` or `position: sticky`

**The rule**: once a layer is created, it costs GPU memory for its entire paint region.

---

### 🔴 Cause 1: `transition-all` on Card Link Elements

**File**: `src/components/home/HomeHighlightsCard.tsx`, line 92

```tsx
// VERY BAD — transition-all includes box-shadow, which is rasterized on CPU
// AND includes transform, which promotes to GPU layer
<Link className="... transition-all duration-300 ...">
```

`transition-all` includes `transform`, which **automatically promotes the element to a GPU compositor layer** even before any hover event occurs. The browser creates the GPU layer proactively because it knows a transform might happen. 

With 5 horizontal carousels × 10 cards each = **50+ separate GPU compositor layers** just from card hover transitions. Each of these layers is a full GPU texture (17rem wide × 11rem tall) stored in VRAM.

**Also**: `transition-all` includes `box-shadow` (`transition-shadow`), which actually re-renders on the CPU on every frame during the transition. This is slower, not faster, than just `transition-shadow`.

---

### 🔴 Cause 2: `group-hover:scale-105` and `transition-transform` on Every Card Image

**File**: `src/components/home/HomeHighlightsCard.tsx`, line 112  
**File**: `src/pages/landing/home.tsx` (product cards)

```tsx
<MediaThumb
  className="absolute inset-0 w-full h-full object-cover 
             group-hover:scale-105 transition-transform duration-500"
/>
```

`group-hover:scale-105` uses `transform: scale(1.05)`. Every element that **can be transformed** (has a `transition-transform` + a class that transforms it) gets its own compositor layer. 50 card images + 5 hover overlays = **55+ more GPU layers inside the already-layered cards**.

This also means each `absolute inset-0` image inside a relative container becomes its own GPU texture. At a typical 17rem card with 3x display scaling, each image texture is approximately **816×528 pixels × 4 bytes = ~1.7MB of VRAM per card image**. With 50 cards, that's ~85MB of VRAM just for card thumbnails.

---

### 🟠 Cause 3: Multiple `bg-gradient` Overlay Divs Per Card

**File**: `src/components/home/HomeHighlightsCard.tsx`, lines 98, 114

```tsx
{/* Hover overlay — creates additional compositor layer */}
<div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-purple-50 
                opacity-0 group-hover:opacity-30 transition-opacity duration-500" />

{/* Gradient text overlay — another compositor layer */}
<div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-30" />
```

Each `transition-opacity` element creates its own compositor layer. Each `bg-gradient` on an `absolute inset-0` div is a full-card-sized GPU texture. Cards have 2 gradient overlays each → 50 cards × 2 = **100 more GPU layers**.

---

### 🟡 Cause 4: No `content-visibility: auto` on Off-Screen Page Sections

**File**: `src/pages/landing/home.tsx`

The page has 6 ScrollableSection blocks stacked vertically. Once React renders them, every section's elements (cards, images, overlays) remain GPU-composited even when completely off-screen. The browser must maintain all their tiles.

Using `content-visibility: auto` tells the browser it can skip rendering off-screen sections entirely — no tiles, no GPU layers. The element reserves its own height so the scrollbar doesn't jump, but the browser treats it like an empty box until the user scrolls near it.

---

## Fix Strategy

### The Real Solution: Stop Creating Unnecessary GPU Layers

Instead of `transition-all` and `scale` transforms:
1. Use `transition-shadow` (box-shadow only — stays on CPU but avoids the GPU layer)
2. Replace `scale-105` with a `brightness` filter — browsers typically do NOT layer-promote for `brightness` because it's a visual filter that composites lazily
3. Remove redundant gradient overlay divs — use a single CSS gradient on the image wrapper background
4. Add `content-visibility: auto` and `contain-intrinsic-size` to major page sections

---

## Priority Summary

| # | Cause | GPU Layers Saved | Fix |
|---|-------|-----------------|-----|
| 🔴 1 | `transition-all` on Link wrappers | ~50 layers | Use `transition-shadow` only |
| 🔴 2 | `group-hover:scale-105` on images | ~50 layers + | Replace with `brightness-90` or no effect |
| 🟠 3 | Gradient overlay divs with `transition-opacity` | ~100 layers | Consolidate into CSS `::after` or single static overlay |
| 🟡 4 | No `content-visibility` on sections | Unbounded | Add `content-visibility: auto` to ScrollableSection wrappers |

---

## Agent Task Breakdown

### Agent 1 — Fix HomeHighlightsCard GPU Layer Explosion

Replace `transition-all` with `transition-shadow`, remove `group-hover:scale-105` hover scale (use a `brightness` filter instead), and merge the two gradient overlay divs.

**Files**: `src/components/home/HomeHighlightsCard.tsx`

### Agent 2 — Fix home.tsx Product Card GPU Layer Creation

Apply the same fixes to the product cards rendered inline in `home.tsx`.

**Files**: `src/pages/landing/home.tsx`

### Agent 3 — Add `content-visibility: auto` to Page Sections

Add `content-visibility: auto` and `contain-intrinsic-size` to all `<div className="py-4">` section wrappers in `home.tsx` to let the browser skip off-screen section rendering.

**Files**: `src/pages/landing/home.tsx`
