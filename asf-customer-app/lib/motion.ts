import { Easing } from "react-native-reanimated";

/**
 * Shared motion tokens for the Expo customer app ceremony & interaction system.
 * Pure module — no React. Map `easing` to Reanimated via {@link motionEasing}.
 *
 * Personality: Confident · Clean · Modern (fashion retail — deliberate, editorial).
 */
export const motion = {
  duration: {
    /** Press scale in/out. */
    press: 120,
    /** Micro transitions (tab icon, badge settle). */
    fast: 200,
    /** Default stack / content transitions. */
    base: 280,
    /** Page / section entrances. */
    entrance: 420,
    /** Single home-ceremony stagger step. */
    ceremonyStep: 380,
    /**
     * Day-to-day bold entrances (Shop first-land, PDP image/content, cart lines).
     * Keep the full sequence under ~1.5–2.5s when combined with delays.
     */
    dailyEntrance: 480,
    /** Add-to-bag tray slide in / out. */
    addTray: 240,
    /** Sticky PDP Add-to-bag bar slide-up. */
    ctaSlide: 360,
    /** Thin gold light sweep / underline wipe. */
    lightSweep: 520,
    /**
     * Discovery-points achievement burst (confetti + strip cycle).
     * Keep the full sequence in the ~1.5–2.5s feel window.
     */
    achievementBurst: 2200,
    /** Achievement strip slide in / out. */
    achievementStrip: 280,
  },
  delay: {
    /** Stillness after splash unmount before brand beat. */
    postSplashBreathe: 200,
    /** Gap between staggered ceremony sections. */
    stagger: 100,
    /** Gap from brand beat to hero. */
    brandToHero: 120,
    /** Gap between day-to-day bold stagger steps (PDP / cart / shop). */
    dailyStagger: 80,
    /**
     * How long the add-to-bag tray stays visible before auto-dismiss
     * (excluding enter/exit animation). ~900–1200ms feel window.
     */
    addTrayHold: 1000,
    /**
     * How long the discovery-points strip stays fully visible before exit
     * (excluding enter/exit). Paired with {@link motion.duration.achievementBurst}.
     */
    achievementHold: 1600,
  },
  scale: {
    /** Pressable scale while pressed. */
    press: 0.97,
    /** Cart / count badge peak before settle. */
    badgePeak: 1.15,
    /** Hero start scale (settles to 1) — ambient / default. */
    heroStart: 1.04,
    /**
     * Stronger hero settle for day-to-day bold home amplify.
     * Prefer this over {@link motion.scale.heroStart} when the storefront
     * opening should read unmistakably (plan: ~1.06–1.08).
     */
    heroStartBold: 1.07,
    /** Brand beat start scale (settles to 1). */
    brandStart: 0.94,
    /** Wishlist heart peak scale. */
    heartPeak: 1.25,
    /** PDP hero start scale for every product open. */
    pdpHeroStart: 1.05,
  },
  /**
   * Logical easing id. Prefer {@link motionEasing} with Reanimated `withTiming`.
   */
  easing: "outCubic",
} as const;

/**
 * Standard Reanimated easing for entrances and presses:
 * `Easing.out(Easing.cubic)`.
 */
export const motionEasing = Easing.out(Easing.cubic);
