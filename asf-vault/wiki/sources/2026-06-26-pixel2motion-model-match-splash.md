---
title: "Pixel2Motion — MODEL MATCH Animated Splash (June 26, 2026)"
type: source
updated: 2026-06-26
tags: [pixel2motion, splash, mobile, expo, asf-2, model-match, simon]
---

# Pixel2Motion — MODEL MATCH Animated Splash (June 26, 2026)

**Raw source**: [raw/sources/2026-06-26-pixel2motion-model-match-splash.md](../../raw/sources/2026-06-26-pixel2motion-model-match-splash.md)

## Summary

End-to-end pipeline for Simon’s **MODEL MATCH** footwear pilot splash: Pixel2Motion cloned to `tools/pixel2motion/`, logo raster traced to semantic SVG (IoU **0.9972** at 1024px), seven HTML motion variations for client review, **Variation 7 — Letter cascade** selected, and shipped as cold-start intro on **both** Expo apps via a bundled WebView HTML asset.

Motion authoring lives in `asf-customer-app/assets/splash/pixel2motion-output/`; apps only mount `SplashIntro` overlay. Staff app rebuilds from customer sources via `npm run build:splash`.

## Key claims

- **Client decision**: `logo_motion_letters.html` — 1500ms letter cascade (M + 2 → MODEL → MATCH per-letter stagger).
- **Why WebView**: preserves WYSIWYG with browser-approved HTML preview; avoids hand-porting 12-part CSS keyframes to Reanimated.
- **Bundle**: `scripts/build_splash_intro.py` inlines theme bridge, strips demo chrome, plays at 1× speed, posts `p2m:complete` to React Native.
- **Startup flow**: `preventAutoHideAsync` → WebView loads `splash-intro.html` → `hideAsync` → animation → overlay unmount.
- **Both apps**: parallel `SplashIntro.tsx`, `lib/splashScreen.ts`, `AppShell` in `_layout.tsx`; maintenance flag skips intro.
- **Single motion SOT**: customer `pixel2motion-output/`; staff script reads from sibling app.

## Outline

1. Problem, goals, repo layout
2. Pixel2Motion one-time setup (venv, Chrome on Windows)
3. Logo vectorization + `fit_model_match.py` + IoU QA
4. Seven variations + Simon’s pick + `motion_spec.md`
5. WebView vs native animation rationale
6. `build_splash_intro.py` mobile bundle pipeline
7. RN integration (Metro html ext, theme injection, timeouts)
8. Preview paths, gaps, test checklist, file index

## Open questions

- Should staff app use a different splash when white-labeling beyond Simon pilot?
- Export final-frame PNG to replace static `splash-icon.png` for seamless native handoff?
- Add same intro to `asf-2-next` web boot?
- Automate `build:splash` in CI when motion assets change?

## Wikilinks

- [[wiki/entities/asf-2]]
- [[wiki/concepts/pixel2motion-splash-asf-2]]
- [[wiki/concepts/mobile-app-architecture-asf-2]]
- [[wiki/sources/2026-04-25-mobile-apps-progress]]
- [[wiki/sources/2026-06-26-store-locations-feature]]
