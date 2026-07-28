/**
 * Design tokens exactly matching the web app's CSS variables in globals.css.
 * --color-accent: #C9A96E (gold)
 * --color-bg:     #FFFFFF
 * --color-panel:  #F5F5F3
 * --color-text:   #0A0A0A
 * --color-muted:  #6B7280
 * --color-border: #E5E5E3
 * --color-danger: #E8453C
 *
 * Classic defaults kept for gradual migration. Prefer `useThemeTokens()` on
 * Tier A/B surfaces going forward (see `themes/classic/tokens.ts`).
 */
export const colors = {
  accent: "#C9A96E",
  bg: "#FFFFFF",
  panel: "#F5F5F3",
  text: "#0A0A0A",
  muted: "#6B7280",
  border: "#E5E5E3",
  danger: "#E8453C",
  success: "#22C55E",
} as const;

export const fonts = {
  display: "PlayfairDisplay_400Regular",
  sans: "Inter_400Regular",
} as const;

/** Legacy aggregate — prefer `colors` / `fonts` for new code. */
export const theme = {
  ...colors,
  background: colors.bg,
} as const;
