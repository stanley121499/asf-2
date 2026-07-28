/**
 * Atelier-only editorial motion tokens for Home entrance, chrome reveal,
 * and PDP plate ceremony. Kept local so Classic / Noir timings stay untouched.
 *
 * Target presence: ~1–1.5s feel — not a multi-second blocker.
 */
export const atelierMotion = {
  duration: {
    /** Cover / intro settle (scale + fade). */
    coverEntranceMs: 520,
    /** Staggered chapter / section step. */
    chapterStepMs: 360,
    /** Chrome bar fade when scroll-revealed. */
    chromeFadeMs: 220,
    /** Cover copy line settle (eyebrow → title → body). */
    coverLineMs: 320,
    /**
     * PDP plate hero scale/fade on every open (~300–450ms band).
     * Shorter than Home cover so PDP does not feel like a splash.
     */
    pdpHeroMs: 400,
    /** PDP type-slab / secondary ceremony step. */
    pdpSlabMs: 340,
    /** Sticky Add bar slide-up (last beat). */
    pdpCtaSlideMs: 320,
  },
  delay: {
    /**
     * Cover starts after a short breathe — earlier than shared
     * `contentBaseDelayMs` so the theater moment leads.
     */
    coverBaseMs: 160,
    /** Gap between cover copy lines (eyebrow / title / body). */
    coverLineStaggerMs: 85,
    /** Gap between editorial chapter CeremonySections. */
    chapterStaggerMs: 110,
    /**
     * When reduced motion is on, reveal brand+search after this delay
     * so search stays reachable without requiring a scroll.
     */
    chromeReducedRevealMs: 280,
    /** Gap between PDP plate ceremony beats (hero → title → CTA). */
    pdpStaggerMs: 90,
  },
  /**
   * Fraction of cover height scrolled before minimal chrome appears.
   * Below this, first paint stays chrome-free (theater).
   */
  chromeRevealCoverFraction: 0.5,
  /**
   * When scrolling back near the top, hide chrome again (fraction of cover).
   * Hysteresis below reveal fraction avoids flicker at the threshold.
   */
  chromeHideCoverFraction: 0.22,
  /** Upward travel (px) for the slim sticky Add bar entrance. */
  pdpCtaSlideY: 48,
} as const;
