import type { ReactElement } from "react";

/**
 * Storefront cart chrome overlay for {@link CartChromeHost}.
 *
 * Storefront uses **header bags** (`CartButton` inside Home / Shop / Highlights /
 * Profile hub chrome), not a floating FAB — so the host overlay is a no-op.
 * Auth and checkout never mount `CartChromeHost`, so they stay bag-free.
 */
export function StorefrontCartChrome(): ReactElement | null {
  return null;
}
