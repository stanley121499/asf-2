---
title: "Pixel2Motion animated splash (ASF-2)"
type: concept
updated: 2026-06-26
sources: 1
tags: [pixel2motion, splash, mobile, expo, webview, model-match]
---

# Pixel2Motion animated splash (ASF-2)

Pattern for **branded animated cold-start intros** on ASF-2 Expo apps using Pixel2Motion HTML output embedded in a WebView. Primary source: [[wiki/sources/2026-06-26-pixel2motion-model-match-splash]].

## Purpose

Ship a client-approved logo animation on mobile without rewriting motion in Reanimated/Lottie. First deployment: Simon **MODEL MATCH** letter cascade on customer + staff apps.

## Architecture (three layers)

| Layer | Location | Mutable by app code? |
|-------|----------|----------------------|
| **Authoring** | `tools/pixel2motion/` + `asf-customer-app/assets/splash/pixel2motion-output/` | No — edit via Pixel2Motion pipeline |
| **Mobile bundle** | `assets/splash/intro/splash-intro.html` | Regenerated only (`npm run build:splash`) |
| **Runtime** | `SplashIntro.tsx` + `lib/splashScreen.ts` + `_layout.tsx` | Yes — overlay lifecycle only |

Staff app does **not** fork motion sources — `asf-staff-app/scripts/build_splash_intro.py` reads customer `pixel2motion-output/`.

## Why WebView

- Browser preview (`variations.html`, `logo_motion_letters.html`) is the approval surface
- Bundled HTML = same SVG + CSS keyframes in production
- Trade-off: WebView load cost vs zero porting effort

Alternatives deferred: Lottie export, native Reanimated reimplementation.

## Cold-start sequence

1. `SplashScreen.preventAutoHideAsync()` at module load
2. App providers + fonts mount (customer app blocks on fonts)
3. `SplashIntro` loads HTML via `expo-asset` + `react-native-webview`
4. `onLoadEnd` → `SplashScreen.hideAsync()`
5. Animation ~1500ms; completion via `postMessage({ type: "p2m:complete" })` or fallback timeout
6. Overlay removed; main navigation visible

**Maintenance flag**: skip intro, hide native splash immediately.

## Theme (light / dark)

- `useColorScheme()` in `SplashIntro`
- `?theme=` on asset URI + `injectedJavaScriptBeforeContentLoaded` seeds `localStorage` (Android file:// quirk)
- Pink accent `#ee73c4` unchanged in both themes

## Regeneration workflow

```bash
cd asf-customer-app && npm run build:splash
cd ../asf-staff-app && npm run build:splash
```

Requires Python 3. Restart Metro after bundle changes.

## Metro requirements

- `assetExts` includes `html`
- `types/html.d.ts` for `require("*.html")`
- Dependencies: `expo-splash-screen`, `expo-asset`, `react-native-webview`

## Production motion (Simon pilot)

- **Variation 7** — letter cascade
- SVG: `logo_letters.svg` (12 parts)
- CSS: `motion_letter_cascade.css`
- Brief: `motion_spec.md`

## Known gaps

- Static native `splash-icon.png` may not match final animation frame
- MODEL MATCH hard-coded — no per-tenant splash config yet
- Web app not integrated

## Related

- [[wiki/entities/asf-2]]
- [[wiki/sources/2026-06-26-pixel2motion-model-match-splash]]
- [[wiki/concepts/mobile-app-architecture-asf-2]]
