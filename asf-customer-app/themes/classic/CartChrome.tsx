import type { ReactElement } from "react";

/**
 * Classic cart chrome overlay for {@link CartChromeHost}.
 *
 * Classic uses **header bags** (`CartButton` inside Home / Shop / Highlights /
 * Profile hub chrome), not a floating FAB — so the host overlay is a no-op.
 * Auth and checkout never mount `CartChromeHost`, so they stay bag-free.
 *
 * Agents 3 (Atelier FAB) / 5 (Noir headers) replace this pattern per pack.
 */
export function ClassicCartChrome(): ReactElement | null {
  return null;
}
