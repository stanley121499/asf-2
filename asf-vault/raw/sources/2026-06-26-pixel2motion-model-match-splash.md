# Pixel2Motion — MODEL MATCH Animated Splash (June 26, 2026)

**Date**: 2026-06-26  
**Context**: Simon footwear retail pilot (**MODEL MATCH** / M2 logo). Set up [Pixel2Motion](https://github.com/nolangz/pixel2motion) in the ASF-2 monorepo, produced seven client-reviewable splash variations, and shipped the chosen animation as the cold-start intro on **both** Expo mobile apps (`asf-customer-app`, `asf-staff-app`).

---

## 1. Problem and goals

### Business need

Simon needed a polished **animated splash / intro** for the MODEL MATCH brand on mobile — not a static PNG flash. The logo is a high-contrast lockup: white serif **M**, pink accent **2**, and **MODEL** / **MATCH** wordmarks on black.

### Engineering goals

| Goal | How we addressed it |
|------|---------------------|
| Keep app code clean | Motion authoring lives in `tools/pixel2motion/` + `assets/splash/`; apps only mount a WebView overlay |
| Client review before ship | Seven HTML previews + `variations.html` picker with light/dark toggle |
| Exact brand fidelity | Semantic SVG traced from raster with IoU QA (not hand-drawn approximations) |
| Reproducible pipeline | Python fit script + `npm run build:splash` bundles self-contained HTML for Metro |
| Both mobile apps | Same animation bundle; staff build script reads customer Pixel2Motion sources |

### Out of scope (v1)

- Animated splash on **web** (`asf-2-next`) — mobile only
- Lottie / Rive / native Reanimated port — WebView embed chosen for speed and pixel-perfect CSS/SVG motion
- Per-tenant splash switching in app — hard-coded MODEL MATCH pilot asset for now

---

## 2. Repo layout

```
asf-2/
├── tools/pixel2motion/              # Cloned Pixel2Motion toolkit (Python venv inside)
│   └── .venv/                       # pillow, numpy, playwright
│
├── asf-customer-app/
│   ├── assets/splash/
│   │   ├── source.png               # Master raster logo (1024×1024)
│   │   ├── intro/
│   │   │   └── splash-intro.html    # ~39 KB bundled mobile asset (generated)
│   │   └── pixel2motion-output/     # All motion authoring artifacts
│   │       ├── logo.svg             # 4-part semantic SVG
│   │       ├── logo_letters.svg     # 12-part letter cascade SVG
│   │       ├── motion_letter_cascade.css
│   │       ├── logo_motion_letters.html   # Variation 7 (production)
│   │       ├── variations.html      # Client picker page
│   │       ├── theme-bridge.js/css  # Light/dark preview toggle
│   │       └── motion_spec.md       # Creative + technical brief
│   ├── components/SplashIntro.tsx   # Full-screen WebView overlay
│   ├── lib/splashScreen.ts          # preventAutoHideAsync helper
│   └── scripts/build_splash_intro.py
│
└── asf-staff-app/
    ├── assets/splash/intro/splash-intro.html   # Generated copy
    ├── components/SplashIntro.tsx              # Same component pattern
    ├── lib/splashScreen.ts
    └── scripts/build_splash_intro.py           # Reads customer app sources
```

**Single source of truth for motion authoring**: `asf-customer-app/assets/splash/pixel2motion-output/`. Staff app does not duplicate Pixel2Motion output — only the final `splash-intro.html` bundle.

---

## 3. One-time Pixel2Motion setup

Executed in repo root (Windows):

```powershell
git clone https://github.com/nolangz/pixel2motion.git tools/pixel2motion
cd tools/pixel2motion
python -m venv .venv
.\.venv\Scripts\pip install pillow numpy playwright
.\.venv\Scripts\playwright install chromium
```

**Chrome for overlay QA** (Windows): set `CHROME_BIN` to system Chrome when Playwright bundled Chromium is unavailable:

```
C:\Program Files\Google\Chrome\Application\chrome.exe
```

PowerShell uses `;` between commands, not `&&`.

---

## 4. Logo source and vectorization

### Raster source

| Field | Value |
|-------|-------|
| File | `asf-customer-app/assets/splash/source.png` |
| Size | **1024 × 1024** (upgraded from initial 500×500 ASF placeholder) |
| Background | `#000000` |
| Brand | Simon — MODEL MATCH footwear pilot |

### Why semantic parts (not one blob)

Pixel2Motion animates **named SVG groups**. MODEL MATCH decomposes into:

| Part id | Role | Fill |
|---------|------|------|
| `#letter-m` | Primary mark | `#ffffff` |
| `#number-2` | Accent numeral | `#ee73c4` |
| `#word-model` / per-letter `#model-*` | Wordmark line 1 | `#ffffff` |
| `#word-match` / per-letter `#match-*` | Wordmark line 2 | `#ffffff` |

### Fit script

`assets/splash/pixel2motion-output/outputs/fit_work/fit_model_match.py`:

- Clusters white vs pink pixels from source raster
- Traces each semantic region to closed SVG paths
- **Resolution-aware**: thresholds scale from 500px baseline via `SCALE = WIDTH / 500`
- Outputs `logo.svg` (4 parts) and letter-split variants for cascade

### Geometry QA (IoU vs source)

| Iteration | Resolution | IoU | Verdict |
|-----------|------------|-----|---------|
| Semantic v1 | 500px | 0.9954 | Pass |
| High-res semantic | 1024px | 0.9972 | Pass — sharper serifs |
| Letter split | 1024px | 0.9972 | Pass — 12 cascade parts |

QA overlays: `outputs/fit_work/overlay.png`, `outputs/fit_iterations/`.

---

## 5. Motion design

Full brief: `assets/splash/pixel2motion-output/motion_spec.md`.

### Personality

**Confident · Clean · Modern** — deliberate splash intro, crisp pink accent pop on `#number-2`, not playful bounce or luxury slow-fade.

### Seven variations (client review set)

| # | Name | File | Duration | Pattern |
|---|------|------|----------|---------|
| 1 | Scale-pop + blur | `logo_motion_scale_pop.html` | 1200ms | Mobile DTC default |
| 2 | Minimal fade | `logo_motion_minimal_fade.html` | 1000ms | Apple/Netflix restraint |
| 3 | Staggered assembly | `logo_motion.html` | 1500ms | Mark → wordmark |
| 4 | Luxury fade | `logo_motion_luxury_fade.html` | 1800ms | Premium footwear |
| 5 | Mask wipe | `logo_motion_mask_wipe.html` | 1400ms | Broadcast reveal |
| 6 | Ink reveal | `logo_motion_ink_reveal.html` | 1600ms | Draw-on craft |
| **7** | **Letter cascade** ✓ | `logo_motion_letters.html` | **1500ms** | **Simon’s pick** |

**Client picker**: open `variations.html` in a browser (file:// or static host). Includes **light/dark theme toggle** via `theme-bridge.js` + `theme-bridge.css` (pink accent unchanged; background + mark fills swap).

### Production choice — Variation 7 (Letter cascade)

Choreography:

1. **M** and pink **2** arrive first (staged anticipation)
2. **MODEL** spells left-to-right: `model-m` → `model-o` → `model-d` → `model-e` → `model-l`
3. **MATCH** follows: `match-m` → `match-a` → `match-t` → `match-c` → `match-h`
4. ~3% stagger between letters (~45ms); total clock **1500ms** + 120ms hold

CSS: `motion_letter_cascade.css`. SVG: `logo_letters.svg` (12 animatable groups).

---

## 6. Why WebView (not native animation)

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| **WebView + bundled HTML** | Exact match to approved browser preview; no porting keyframes; fast iteration | WebView startup cost; needs Metro `html` asset ext | **Chosen** |
| Lottie export | Native performance | No direct Pixel2Motion export; manual rebuild | Deferred |
| Reanimated / RN Animated | No WebView | Re-implement 12-part cascade + easing by hand | Rejected for v1 |

The client approved motion in **HTML preview**. Bundling that HTML preserves WYSIWYG between review and ship.

---

## 7. Mobile bundle pipeline

### `build_splash_intro.py`

Transforms `logo_motion_letters.html` into a **self-contained** `splash-intro.html`:

1. Inlines `theme-bridge.js` (external `<script>` removed)
2. Adds mobile-only CSS (hides demo chrome: controls, footer, theme bar)
3. Replaces showcase init with mobile init:
   - `setPlaybackRate(1.0)` (preview used 0.45× slow-mo)
   - Auto-starts animation on load
   - Posts `{ type: "p2m:complete" }` via `window.ReactNativeWebView.postMessage`
   - Respects `prefers-reduced-motion` (finishes instantly, short hold)
4. Strips `mountThemeBar()` — RN passes theme via query param + injected localStorage seed

### Regenerate

```bash
# Customer app (authoritative)
cd asf-customer-app
npm run build:splash

# Staff app (reads customer pixel2motion-output)
cd ../asf-staff-app
npm run build:splash
```

Requires Python 3. Output: `assets/splash/intro/splash-intro.html` (~39 KB).

### Metro configuration

Both apps add `html` to `resolver.assetExts` in `metro.config.js` and declare `types/html.d.ts` for `require("*.html")`.

---

## 8. React Native integration

### Cold-start flow

```
Native Expo splash (preventAutoHideAsync)
    → Fonts / providers mount (customer app waits on fonts)
    → SplashIntro WebView loads bundled HTML asset
    → onLoadEnd → hideAsync() native splash
    → Letter cascade plays (~1500ms)
    → postMessage p2m:complete OR fallback timeout (~2020ms)
    → Overlay unmounts → main Stack/tabs visible
```

### Key files (both apps — parallel structure)

| File | Role |
|------|------|
| `lib/splashScreen.ts` | `SplashScreen.preventAutoHideAsync()` once at module load |
| `components/SplashIntro.tsx` | `expo-asset` loads HTML; `react-native-webview` plays it |
| `app/_layout.tsx` | `AppShell` holds `introComplete` state; renders overlay until done |

### `SplashIntro.tsx` details

- Resolves **light/dark** from `useColorScheme()` (overridable via prop)
- Loads asset: `Asset.fromModule(require("@/assets/splash/intro/splash-intro.html"))`
- Appends `?theme=light|dark` to `localUri`
- **Android fix**: `injectedJavaScriptBeforeContentLoaded` seeds `localStorage` + `dataset.p2mTheme` (file:// query params unreliable)
- `allowFileAccess` + `allowFileAccessFromFileURLs` for Android local HTML
- **Idempotent** `finishIntro` via ref (message + timeout won’t double-fire)
- **Fallback timeout**: `1500 + 120 + 400` ms after WebView ready

### Customer app specifics (`app/_layout.tsx`)

- `preventNativeSplashAutoHide()` at top level
- `AppShell` inside `AppProviders` (needs `useFeatureFlags`)
- **Maintenance mode**: skips intro, calls `SplashScreen.hideAsync()` immediately

### Staff app specifics

- Same `SplashIntro` + `AppShell` inside `AdminContextBundle`
- Maintenance flag skip identical to customer app

### Native splash (`app.json`)

Both apps configure `expo-splash-screen` plugin:

- Light: white background `#ffffff`
- Dark: black background `#000000`
- Image: existing `splash-icon.png` (static bridge until WebView ready)

Dependencies added: `expo-splash-screen`, `expo-asset`, `react-native-webview`.

---

## 9. Preview URLs (local development)

| Asset | Path |
|-------|------|
| Variation picker | `asf-customer-app/assets/splash/pixel2motion-output/variations.html` |
| Production motion | `asf-customer-app/assets/splash/pixel2motion-output/logo_motion_letters.html` |
| Mobile bundle | `asf-customer-app/assets/splash/intro/splash-intro.html` |

Example file URL (Windows):

```
file:///E:/Dev/GitHub/asf-2/asf-customer-app/assets/splash/pixel2motion-output/variations.html
```

---

## 10. Known gaps and follow-ups

| Gap | Impact | Suggested action |
|-----|--------|------------------|
| WebView cold-start latency | Brief flash possible on slow devices | Export final-frame PNG for native splash image; tune `splash-icon.png` |
| HTML asset cache | Metro may serve stale bundle after rebuild | Full restart after `npm run build:splash` |
| Single brand hard-coded | Staff app shows MODEL MATCH (Simon pilot) | Future: tenant-specific splash from Supabase storage or white-label config |
| No web splash | Web boot unchanged | Optional: embed same HTML in Next.js loading shell |
| `tools/pixel2motion/.venv` not in git | Fresh clone needs setup | Document in README or add setup script |
| True 2000px source | User mentioned 2000px; file delivered 1024px | Re-run fit + rebuild if higher-res master arrives |

---

## 11. Manual test checklist

1. **Customer app** — cold start → native splash → letter cascade → home/auth
2. **Staff app** — same flow → dashboard/login
3. **Light mode** — white background, dark marks readable
4. **Dark mode** — black background matches brand default
5. **Maintenance flag on** — intro skipped, app loads immediately
6. **Airplane mode** — bundled HTML works offline (no network for splash)
7. **After logo change** — run `build:splash` in both apps, restart Metro

---

## 12. Related work (same repo)

- **Store locations** (2026-06-26): separate feature; no coupling to splash
- **ASF placeholder logo**: initial `source.png` was ASF SYSTEM APP FORMULA; replaced with Simon MODEL MATCH art

---

## 13. File index (implementation)

### Tooling

- `tools/pixel2motion/` — upstream clone
- `asf-customer-app/assets/splash/pixel2motion-output/outputs/fit_work/fit_model_match.py`

### Customer mobile

- `asf-customer-app/components/SplashIntro.tsx`
- `asf-customer-app/lib/splashScreen.ts`
- `asf-customer-app/app/_layout.tsx`
- `asf-customer-app/scripts/build_splash_intro.py`
- `asf-customer-app/metro.config.js`
- `asf-customer-app/types/html.d.ts`
- `asf-customer-app/app.json` (`expo-splash-screen` plugin)

### Staff mobile

- `asf-staff-app/components/SplashIntro.tsx`
- `asf-staff-app/lib/splashScreen.ts`
- `asf-staff-app/app/_layout.tsx`
- `asf-staff-app/scripts/build_splash_intro.py` (sources from customer app)
- `asf-staff-app/metro.config.js`
- `asf-staff-app/types/html.d.ts`
- `asf-staff-app/app.json`

### Creative / QA artifacts

- `motion_spec.md`, `logo_letters.svg`, `motion_letter_cascade.css`
- `variations.html`, `theme-bridge.js`, `theme-bridge.css`
- `outputs/motion_frames_letters/` — frame captures for evidence
