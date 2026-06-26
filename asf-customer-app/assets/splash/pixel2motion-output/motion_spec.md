# MODEL MATCH — Motion Spec

## Source

| Field | Value |
|-------|-------|
| File | `../source.png` |
| Size | 1024 × 1024 px (updated from 500px) |
| Mode | RGB on black |
| Background | `#000000` |
| Brand | Simon — footwear retail pilot (MODEL MATCH / M2) |

> **Client decision:** Simon selected **Variation 7 — Letter cascade** (`logo_motion_letters.html`). This is the production target; other variations are kept for reference.

## Personality

**Confident · Clean · Modern**

Derived from high-contrast serif typography, bold M + accent 2 lockup, and black retail backdrop. Motion is deliberate (splash intro) with a crisp pink accent pop — not playful bounce, not luxury slow-fade.

Preset base: **Trustworthy / Professional** with a single **Energetic** accent on `#number-2`.

## Usage

Mobile app splash / intro — **1500 ms** reveal, then **hold static final frame**.

## Part inventory

| Id | Role | Fill |
|----|------|------|
| `#letter-m` | Primary mark | `#ffffff` |
| `#number-2` | Accent numeral (overlaps M) | `#ee73c4` |
| `#word-model` | Wordmark line 1 | `#ffffff` |
| `#word-match` | Wordmark line 2 | `#ffffff` |

## Choreography — Staggered Assembly

Pattern: **Staggered Assembly** (reveal-patterns §2)  
Timeline shape: **20 : 50 : 30** → 300 ms anticipation · 750 ms action · 450 ms settle

| Phase | Time (ms) | Parts | Principle |
|-------|-----------|-------|-----------|
| Anticipation | 0–300 | All hidden; M coils | Anticipation, Staging |
| Action | 300–1050 | M → 2 pop → MODEL → MATCH cascade | Timing, Follow Through, Overlapping Action |
| Settle | 1050–1500 | All at rest | Slow In/Out, Appeal |

Drag hierarchy: `#letter-m` → `#number-2` → `#word-model` → `#word-match`

## Easing tokens

| Token | Value | Use |
|-------|-------|-----|
| `--p2m-duration` | `1500ms` | Shared clock |
| `--p2m-ease-enter` | `cubic-bezier(0, 0, 0.2, 1)` | Primary arrivals |
| `--p2m-ease-pop` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | `#number-2` overshoot |
| `--p2m-ease-settle` | `cubic-bezier(0.22, 1, 0.36, 1)` | Final settle |
| `--p2m-overshoot` | `1.06` | Scale peak on accent |

> Keyframes use **literal** `cubic-bezier(...)` per Chromium rule (tokens are documentation only).

## Geometry QA

| Iteration | IoU | src_only | render_only | Verdict |
|-----------|-----|----------|-------------|---------|
| 01_semantic (500px) | 0.9954 | 175 | 899 | Pass — exact raster trace |
| 02_highres (1024px) | 0.9972 | 1988 | 790 | Pass — sharper serifs, less softness |
| 03_highres_letters (1024px) | 0.9972 | 1965 | 799 | Pass — 12-part letter split intact |

Fit script is resolution-aware (`outputs/fit_work/fit_model_match.py`): part-split thresholds scale from a 500px baseline via `SCALE = WIDTH / 500`. Complexity: trace-derived paths per semantic part (exact letterform match from source raster). Higher resolution reduced the soft-edge residuals seen in the 500px pass.

## Atomic motions (showcase)

1. **Hover lift** — `#letter-m` subtle translateY
2. **Accent pulse** — `#number-2` scale breathing loop
3. **Wordmark cascade** — `#word-model` / `#word-match` letter-group fade

## Variant ideas

1. **Draw-on** — stroke skeleton on M serifs + 2 curve (premium, +iterations)
2. **Scale-pop** — whole `#logo` single pop (app-icon style, less brand story)
3. **Mask wipe** — left-to-right reveal across lockup (editorial)

## Delivered variations (full industry set for Simon)

| # | Name | Industry norm | Preview | Duration |
|---|------|---------------|---------|----------|
| 1 | **Scale-pop + blur** | Mobile app splash — #1 DTC pattern | `logo_motion_scale_pop.html` | 1200ms |
| 2 | **Minimal fade** | Apple / Netflix-style restraint | `logo_motion_minimal_fade.html` | 1000ms |
| 3 | **Staggered assembly** | Mark → wordmark (retail default) | `logo_motion.html` | 1500ms |
| 4 | **Luxury fade** | Premium footwear & fashion | `logo_motion_luxury_fade.html` | 1800ms |
| 5 | **Mask wipe** | Broadcast / campaign reveals | `logo_motion_mask_wipe.html` | 1400ms |
| 6 | **Ink reveal** | Draw-on / craft studio style | `logo_motion_ink_reveal.html` | 1600ms |
| 7 | **Letter cascade** | Typographic brand-name emphasis | `logo_motion_letters.html` | 1500ms |

**Client picker:** `variations.html` — share this file with Simon.

### Option 7 — Letter cascade

- **M** and pink **2** arrive first (same staging as V1)
- **MODEL** spells in left-to-right: `#model-m` → `#model-o` → `#model-d` → `#model-e` → `#model-l`
- **MATCH** follows: `#match-m` → `#match-a` → `#match-t` → `#match-c` → `#match-h`
- Shared clock: **1500 ms**; ~3% stagger between letters (~45 ms)
